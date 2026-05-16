import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const LOVABLE_GATEWAY = "https://ai.gateway.lovable.dev/v1/chat/completions";

const DOC_TYPES = [
  "Driver License", "Pay Stub", "W-2", "Tax Return 1040", "Tax Return 1120S",
  "Bank Statement (Personal)", "Bank Statement (Business)", "Lease Agreement",
  "Rent Roll", "Property Appraisal", "Title / Deed", "Insurance Declaration",
  "Property Tax Bill", "HOA Statement", "Mortgage Statement", "Credit Report",
  "Purchase Contract", "LLC Operating Agreement", "Asset Statement", "Gift Letter",
  "Visa / ITIN", "Other",
] as const;

const ExtractInput = z.object({
  loanId: z.string().uuid(),
  documentId: z.string().uuid().optional(),
  docType: z.string().default("Other"),
  fileName: z.string(),
  text: z.string().optional(),
  imageUrl: z.string().url().optional(),
});

const SYS_EXTRACT = `You are UnderwriteIQ, an expert Non-QM mortgage document analyst.
Given a single loan document, extract every relevant financial and identity field.
Return strict JSON only - no prose.

JSON shape:
{
  "doc_type": one of ${JSON.stringify(DOC_TYPES)},
  "summary": "one sentence",
  "fields": { /* flat key/value map of all extracted fields with raw values, e.g. borrower_name, ssn_last4, property_address, gross_monthly_rent, monthly_piti, hoa, deposit_total, statement_period_start, statement_period_end, loan_amount, property_value, appraised_value, lease_monthly_rent, etc. */ },
  "deficiencies": [ "string list of missing or unclear items" ],
  "confidence": 0.0 to 1.0
}
Use null for unknown values. Numbers must be numeric (no $ or commas).`;

export const extractDocument = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => ExtractInput.parse(d))
  .handler(async ({ data, context }) => {
    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI Gateway not configured");

    const userContent: Array<Record<string, unknown>> = [
      { type: "text", text: `Document filename: ${data.fileName}\nUser-tagged type: ${data.docType}\n\nExtract all fields per the schema.` },
    ];
    if (data.text) userContent.push({ type: "text", text: `Document text:\n${data.text}` });
    if (data.imageUrl) userContent.push({ type: "image_url", image_url: { url: data.imageUrl } });

    const res = await fetch(LOVABLE_GATEWAY, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: SYS_EXTRACT },
          { role: "user", content: userContent },
        ],
        response_format: { type: "json_object" },
      }),
    });

    if (res.status === 429) throw new Error("AI rate limit reached. Try again shortly.");
    if (res.status === 402) throw new Error("AI credits exhausted. Add credits in Settings → Workspace → Usage.");
    if (!res.ok) {
      const t = await res.text();
      throw new Error(`AI error ${res.status}: ${t.slice(0, 200)}`);
    }

    const json = await res.json();
    const raw = json?.choices?.[0]?.message?.content ?? "{}";
    let parsed: { doc_type?: string; summary?: string; fields?: Record<string, unknown>; deficiencies?: string[]; confidence?: number } = {};
    try { parsed = JSON.parse(raw); } catch { parsed = { summary: raw } as never; }

    const { supabase, userId } = context;
    const insert = {
      loan_id: data.loanId,
      document_id: data.documentId ?? null,
      user_id: userId,
      doc_type: parsed.doc_type ?? data.docType,
      fields: (parsed.fields ?? {}) as never,
      confidence: parsed.confidence ?? null,
      raw_text: parsed.summary ?? null,
    };
    const { data: row, error } = await supabase.from("extractions").insert(insert).select().single();
    if (error) throw new Error(error.message);

    if (data.documentId) {
      await supabase.from("documents").update({ status: "processed", doc_type: insert.doc_type }).eq("id", data.documentId);
    }

    return { extraction: row, deficiencies: parsed.deficiencies ?? [] };
  });

const PackageInput = z.object({ loanId: z.string().uuid() });

export const generatePackage = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => PackageInput.parse(d))
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const { data: loan } = await supabase.from("loans").select("*").eq("id", data.loanId).single();
    const { data: extractions } = await supabase.from("extractions").select("*").eq("loan_id", data.loanId);
    const { data: calcs } = await supabase.from("calculations").select("*").eq("loan_id", data.loanId);

    const apiKey = process.env.LOVABLE_API_KEY;
    if (!apiKey) throw new Error("AI Gateway not configured");

    const sys = `You are a senior Non-QM mortgage underwriter. Given a loan and all extracted document data plus computed calculations, produce a structured underwriting decision package. Return strict JSON:
{
  "executive_summary": "2-3 sentences",
  "key_metrics": [ { "label": "DSCR", "value": "1.32x", "status": "pass|warn|fail" } ],
  "strengths": ["..."],
  "risks": ["..."],
  "deficiencies": ["missing or unclear items the loan officer must resolve"],
  "stipulations": ["pre-funding conditions"],
  "recommendation": "Approve | Conditional Approve | Counter | Decline"
}`;

    const user = JSON.stringify({ loan, extractions, calculations: calcs }, null, 2);

    const res = await fetch(LOVABLE_GATEWAY, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Authorization": `Bearer ${apiKey}` },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: sys },
          { role: "user", content: user },
        ],
        response_format: { type: "json_object" },
      }),
    });
    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const json = await res.json();
    const parsed = JSON.parse(json?.choices?.[0]?.message?.content ?? "{}");

    const { data: pkg, error } = await supabase.from("packages").insert({
      loan_id: data.loanId,
      user_id: userId,
      summary: parsed as never,
      deficiencies: (parsed.deficiencies ?? []) as never,
      recommendation: parsed.recommendation ?? null,
    }).select().single();
    if (error) throw new Error(error.message);
    await supabase.from("loans").update({ status: "decisioned", recommendation: parsed.recommendation }).eq("id", data.loanId);
    return { package: pkg };
  });
