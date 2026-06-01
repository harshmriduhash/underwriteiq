import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { StatusBadge } from "./_app.dashboard";
import { extractDocument, generatePackage } from "@/lib/ai.functions";
import { calcBankStatementIncome, calcDSCR, calcLTV } from "@/lib/calc";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { ArrowLeft, Upload, FileText, Sparkles, Calculator, FileCheck2, AlertCircle, Loader2, Trash2, ClipboardCheck, ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/_app/loans/$loanId")({
  head: () => ({ meta: [{ title: "Loan file — UnderwriteIQ" }] }),
  component: LoanDetail,
});

const DOC_TYPES = [
  "Pay Stub", "W-2", "Tax Return 1040", "Tax Return 1120S",
  "Bank Statement (Personal)", "Bank Statement (Business)",
  "Lease Agreement", "Rent Roll", "Property Appraisal", "Title / Deed",
  "Insurance Declaration", "Property Tax Bill", "HOA Statement",
  "Mortgage Statement", "Credit Report", "Purchase Contract",
  "LLC Operating Agreement", "Asset Statement", "Gift Letter",
  "Visa / ITIN", "Driver License", "Other",
];

const EXAMPLE_DOCUMENTS = {
  lease: {
    name: "Example lease agreement",
    docType: "Lease Agreement",
    text: "Lease Agreement. Tenant: Harbor View Holdings LLC. Property: 1180 Harbor View Dr, Tampa, FL 33602. Monthly rent: $7,850. Lease term: 24 months. Start date: 2026-01-01. Security deposit: $7,850. Landlord: Gulf Coast Income Properties.",
  },
  appraisal: {
    name: "Example property appraisal",
    docType: "Property Appraisal",
    text: "Uniform Residential Appraisal Report. Subject property: 1180 Harbor View Dr, Tampa, FL 33602. Appraised value: $875,000. Market rent: $7,900 per month. Property type: 2-unit residential investment. Condition: C3. Appraiser notes: stabilized long-term rental demand.",
  },
  bank: {
    name: "Example business bank statement summary",
    docType: "Bank Statement (Business)",
    text: "Business bank statement summary for Avery Chen Consulting LLC. Statement period: Jan-Dec 2025. Monthly deposits: 42100, 38950, 44750, 46200, 41800, 47450, 49200, 45500, 43875, 50100, 48600, 51250. Ending balance: $184,320. NSF count: 0.",
  },
};

function LoanDetail() {
  const { loanId } = Route.useParams();
  const { user } = useAuth();
  const qc = useQueryClient();

  const { data: loan, isLoading } = useQuery({
    queryKey: ["loan", loanId],
    queryFn: async () => { const { data, error } = await supabase.from("loans").select("*").eq("id", loanId).single(); if (error) throw error; return data; },
  });
  const { data: documents = [] } = useQuery({
    queryKey: ["docs", loanId],
    queryFn: async () => { const { data, error } = await supabase.from("documents").select("*").eq("loan_id", loanId).order("created_at"); if (error) throw error; return data; },
  });
  const { data: extractions = [] } = useQuery({
    queryKey: ["ext", loanId],
    queryFn: async () => { const { data, error } = await supabase.from("extractions").select("*").eq("loan_id", loanId).order("created_at"); if (error) throw error; return data; },
  });
  const { data: calculations = [] } = useQuery({
    queryKey: ["calc", loanId],
    queryFn: async () => { const { data, error } = await supabase.from("calculations").select("*").eq("loan_id", loanId).order("created_at", { ascending: false }); if (error) throw error; return data; },
  });
  const { data: pkg } = useQuery({
    queryKey: ["pkg", loanId],
    queryFn: async () => { const { data } = await supabase.from("packages").select("*").eq("loan_id", loanId).order("created_at", { ascending: false }).limit(1).maybeSingle(); return data; },
  });

  if (isLoading) return <div className="p-10 text-sm text-muted-foreground">Loading loan file…</div>;
  if (!loan) return <div className="p-10 text-sm text-muted-foreground">Loan not found.</div>;

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <Link to="/dashboard" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground mb-4">
        <ArrowLeft className="h-4 w-4 mr-1.5" /> Back to dashboard
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{loan.borrower_name}</h1>
          <div className="mt-1 text-sm text-muted-foreground flex items-center gap-3">
            <span className="font-mono">{loan.loan_product}</span>
            <span>·</span>
            <span>{loan.property_address || "No address"}</span>
            <span>·</span>
            <StatusBadge s={loan.status} />
          </div>
        </div>
        <div className="text-right">
          <div className="text-xs text-muted-foreground font-mono uppercase tracking-widest">Loan Amount</div>
          <div className="text-2xl font-semibold font-mono">${Number(loan.loan_amount || 0).toLocaleString()}</div>
        </div>
      </div>

      <div className="mt-6 grid md:grid-cols-4 gap-3">
        {[
          ["1", "Collect docs", "Upload or paste lease, appraisal, bank statements and IDs."],
          ["2", "Extract fields", "AI structures rent, values, deposits, dates and deficiencies."],
          ["3", "Run calcs", "Validate DSCR, LTV and bank-statement income."],
          ["4", "Package", "Generate a committee-ready decision narrative."],
        ].map(([n, title, text]) => (
          <div key={n} className="rounded-lg border border-border bg-surface-1 p-4">
            <div className="flex items-center gap-2 text-xs font-mono text-primary"><ClipboardCheck className="h-3.5 w-3.5" /> STEP {n}</div>
            <div className="mt-2 text-sm font-semibold">{title}</div>
            <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{text}</p>
          </div>
        ))}
      </div>

      <Tabs defaultValue="docs" className="mt-8">
        <TabsList>
          <TabsTrigger value="docs"><FileText className="h-3.5 w-3.5 mr-1.5" /> Documents</TabsTrigger>
          <TabsTrigger value="extract"><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Extractions</TabsTrigger>
          <TabsTrigger value="calc"><Calculator className="h-3.5 w-3.5 mr-1.5" /> Calculations</TabsTrigger>
          <TabsTrigger value="package"><FileCheck2 className="h-3.5 w-3.5 mr-1.5" /> Decision package</TabsTrigger>
        </TabsList>

        <TabsContent value="docs" className="mt-6">
          <DocumentsTab loanId={loanId} userId={user!.id} documents={documents} onChange={() => qc.invalidateQueries({ queryKey: ["docs", loanId] })} />
        </TabsContent>

        <TabsContent value="extract" className="mt-6">
          <ExtractionsTab extractions={extractions} />
        </TabsContent>

        <TabsContent value="calc" className="mt-6">
          <CalcTab loanId={loanId} userId={user!.id} extractions={extractions} loan={loan} calculations={calculations} onSaved={() => qc.invalidateQueries({ queryKey: ["calc", loanId] })} />
        </TabsContent>

        <TabsContent value="package" className="mt-6">
          <PackageTab loanId={loanId} pkg={pkg} extractions={extractions} calculations={calculations} onGenerated={() => { qc.invalidateQueries({ queryKey: ["pkg", loanId] }); qc.invalidateQueries({ queryKey: ["loan", loanId] }); }} />
        </TabsContent>
      </Tabs>
    </div>
  );
}

function DocumentsTab({ loanId, userId, documents, onChange }: { loanId: string; userId: string; documents: Array<{ id: string; name: string; doc_type: string | null; status: string; storage_path: string }>; onChange: () => void }) {
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState("Other");
  const [text, setText] = useState("");
  const [name, setName] = useState("");
  const extract = useServerFn(extractDocument);
  const qc = useQueryClient();

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]; if (!file) return;
    setUploading(true);
    const path = `${userId}/${loanId}/${Date.now()}-${file.name}`;
    const { error } = await supabase.storage.from("loan-documents").upload(path, file);
    if (error) { setUploading(false); return toast.error(error.message); }
    const { error: dbErr } = await supabase.from("documents").insert({
      loan_id: loanId, user_id: userId, name: file.name, doc_type: docType,
      storage_path: path, mime_type: file.type, size_bytes: file.size, status: "uploaded",
    });
    setUploading(false);
    if (dbErr) return toast.error(dbErr.message);
    toast.success("Uploaded"); onChange();
  }

  async function runExtract(d: { id: string; name: string; doc_type: string | null; storage_path: string }) {
    try {
      toast.loading("AI is reading the document…", { id: d.id });
      // Get a signed URL for the file (so model can fetch it if image)
      const { data: signed } = await supabase.storage.from("loan-documents").createSignedUrl(d.storage_path, 600);
      const isImage = /\.(png|jpe?g|webp|gif)$/i.test(d.name);
      await extract({ data: { loanId, documentId: d.id, docType: d.doc_type || "Other", fileName: d.name, imageUrl: isImage && signed?.signedUrl ? signed.signedUrl : undefined, text: !isImage ? undefined : undefined } });
      toast.success("Extracted", { id: d.id });
      qc.invalidateQueries({ queryKey: ["ext", loanId] });
      onChange();
    } catch (e) { toast.error((e as Error).message, { id: d.id }); }
  }

  async function extractFromText() {
    if (!name || !text) return toast.error("Add a name and paste the document text");
    try {
      toast.loading("AI is reading…", { id: "txt" });
      await extract({ data: { loanId, docType, fileName: name, text } });
      toast.success("Extracted", { id: "txt" });
      setText(""); setName("");
      qc.invalidateQueries({ queryKey: ["ext", loanId] });
    } catch (e) { toast.error((e as Error).message, { id: "txt" }); }
  }

  async function del(d: { id: string; storage_path: string }) {
    await supabase.storage.from("loan-documents").remove([d.storage_path]);
    await supabase.from("documents").delete().eq("id", d.id);
    onChange();
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <h3 className="font-semibold">Upload document</h3>
        <p className="text-sm text-muted-foreground mt-1">Upload images for AI extraction, or paste PDF/OCR text below in this MVP.</p>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5"><Label>Document type</Label>
            <Select value={docType} onValueChange={setDocType}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>{DOC_TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
            </Select>
          </div>
          <label className="block">
            <div className="rounded-lg border border-dashed border-border bg-surface-2/40 p-8 text-center cursor-pointer hover:border-primary transition-colors">
              {uploading ? <Loader2 className="h-5 w-5 animate-spin mx-auto" /> : <><Upload className="h-5 w-5 mx-auto text-muted-foreground" /><div className="mt-2 text-sm">Click to upload — PDF, JPG, PNG</div></>}
            </div>
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.webp" onChange={handleUpload} disabled={uploading} />
          </label>
        </div>

        <div className="mt-6 border-t border-border pt-5">
          <h4 className="text-sm font-semibold">Or paste document text</h4>
          <p className="text-xs text-muted-foreground mt-1">For text-only docs or pasted content. AI will extract all fields.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {Object.entries(EXAMPLE_DOCUMENTS).map(([key, sample]) => (
              <Button key={key} type="button" size="sm" variant="outline" onClick={() => { setName(sample.name); setDocType(sample.docType); setText(sample.text); }}>
                {sample.docType.replace(" Agreement", "")}
              </Button>
            ))}
          </div>
          <div className="mt-3 space-y-2">
            <Input placeholder="Document name (e.g. Pay stub - Jan)" value={name} onChange={e => setName(e.target.value)} />
            <Textarea rows={5} placeholder="Paste the document text here…" value={text} onChange={e => setText(e.target.value)} />
            <Button size="sm" onClick={extractFromText}><Sparkles className="h-3.5 w-3.5 mr-1.5" /> Extract with AI</Button>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <h3 className="font-semibold">Loan file ({documents.length})</h3>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground mt-4">No documents uploaded yet.</p>
        ) : (
          <ul className="mt-4 space-y-2">
            {documents.map(d => (
              <li key={d.id} className="flex items-center justify-between gap-3 rounded-md border border-border p-3 text-sm">
                <div className="min-w-0">
                  <div className="truncate font-medium">{d.name}</div>
                  <div className="text-xs text-muted-foreground font-mono">{d.doc_type} · {d.status}</div>
                </div>
                <div className="flex items-center gap-1">
                  {/\.(png|jpe?g|webp|gif)$/i.test(d.name) && (
                    <Button size="sm" variant="outline" onClick={() => runExtract(d)}><Sparkles className="h-3.5 w-3.5 mr-1" /> Extract</Button>
                  )}
                  <Button size="icon" variant="ghost" onClick={() => del(d)}><Trash2 className="h-3.5 w-3.5" /></Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function ExtractionsTab({ extractions }: { extractions: Array<{ id: string; doc_type: string | null; confidence: number | null; fields: unknown; raw_text: string | null; created_at: string }> }) {
  if (extractions.length === 0) return <div className="rounded-xl border border-border bg-surface-1 p-10 text-center text-sm text-muted-foreground">No extractions yet. Upload a document and run AI extraction.</div>;
  return (
    <div className="space-y-3">
      {extractions.map(e => {
        const fields = (e.fields as Record<string, unknown>) ?? {};
        const conf = e.confidence ?? 0;
        return (
          <div key={e.id} className="rounded-xl border border-border bg-surface-1 p-5">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">{e.doc_type || "Document"}</div>
                {e.raw_text && <div className="text-sm text-muted-foreground mt-0.5">{e.raw_text}</div>}
              </div>
              <div className="text-right">
                <div className="text-xs font-mono text-muted-foreground">CONFIDENCE</div>
                <div className="text-xl font-semibold font-mono">{Math.round(conf * 100)}%</div>
              </div>
            </div>
            <Progress value={conf * 100} className="mt-2 h-1" />
            <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
              {Object.entries(fields).map(([k, v]) => (
                <div key={k} className="rounded-md bg-surface-2/60 px-3 py-2">
                  <div className="text-xs text-muted-foreground font-mono uppercase tracking-wider">{k}</div>
                  <div className="truncate font-mono">{v === null || v === undefined ? "—" : String(v)}</div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function CalcTab({ loanId, userId, extractions, loan, calculations, onSaved }: { loanId: string; userId: string; extractions: Array<{ fields: unknown }>; loan: { loan_amount: number | null; property_value: number | null }; calculations: Array<{ id: string; calc_type: string; inputs: unknown; result: unknown; formula: string | null }>; onSaved: () => void }) {
  // Auto-pull from extractions
  const seed = useMemo(() => {
    const merged: Record<string, unknown> = {};
    for (const e of extractions) Object.assign(merged, (e.fields as Record<string, unknown>) ?? {});
    return merged;
  }, [extractions]);
  const numField = (k: string) => {
    const v = seed[k]; const n = typeof v === "number" ? v : parseFloat(String(v ?? "").replace(/[^0-9.\-]/g, ""));
    return Number.isFinite(n) ? n : 0;
  };

  const [rent, setRent] = useState(numField("gross_monthly_rent") || numField("lease_monthly_rent"));
  const [piti, setPiti] = useState(numField("monthly_piti"));
  const [hoa, setHoa] = useState(numField("hoa"));

  const dscr = calcDSCR({ grossMonthlyRent: rent, piti, hoa });
  const ltv = calcLTV({ loanAmount: Number(loan.loan_amount || 0), propertyValue: Number(loan.property_value || 0) });

  async function save() {
    const rows = [
      { loan_id: loanId, user_id: userId, calc_type: "DSCR", inputs: { rent, piti, hoa } as never, result: dscr as never, formula: dscr.formula },
      { loan_id: loanId, user_id: userId, calc_type: "LTV", inputs: { loanAmount: loan.loan_amount, propertyValue: loan.property_value } as never, result: ltv as never, formula: ltv.formula },
    ];
    const { error } = await supabase.from("calculations").insert(rows);
    if (error) return toast.error(error.message);
    toast.success("Calculations saved"); onSaved();
  }

  const tierClr = dscr.tier === "strong" ? "text-success" : dscr.tier === "qualifying" ? "text-success" : dscr.tier === "weak" ? "text-warning" : "text-destructive";

  return (
    <div className="grid lg:grid-cols-2 gap-4">
      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <h3 className="font-semibold">DSCR Calculator</h3>
        <p className="text-xs text-muted-foreground font-mono mt-1">{dscr.formula}</p>
        <div className="mt-4 space-y-3">
          <div className="space-y-1.5"><Label>Gross monthly rent ($)</Label><Input type="number" value={rent} onChange={e => setRent(Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>Monthly PITI ($)</Label><Input type="number" value={piti} onChange={e => setPiti(Number(e.target.value))} /></div>
          <div className="space-y-1.5"><Label>HOA ($)</Label><Input type="number" value={hoa} onChange={e => setHoa(Number(e.target.value))} /></div>
        </div>
        <div className="mt-5 rounded-lg bg-surface-2 p-5 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">DSCR</div>
          <div className={`mt-1 text-5xl font-semibold font-mono ${tierClr}`}>{dscr.dscr.toFixed(2)}x</div>
          <div className={`mt-1 text-xs font-mono uppercase ${tierClr}`}>{dscr.tier}</div>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-surface-1 p-6">
        <h3 className="font-semibold">LTV</h3>
        <p className="text-xs text-muted-foreground font-mono mt-1">{ltv.formula}</p>
        <div className="mt-5 rounded-lg bg-surface-2 p-5 text-center">
          <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">LTV</div>
          <div className="mt-1 text-5xl font-semibold font-mono">{ltv.ltv.toFixed(1)}%</div>
        </div>
        <div className="mt-5 grid grid-cols-2 gap-3 text-sm">
          <div className="rounded-md bg-surface-2/60 p-3"><div className="text-xs text-muted-foreground font-mono">Loan amount</div><div className="font-mono">${Number(loan.loan_amount || 0).toLocaleString()}</div></div>
          <div className="rounded-md bg-surface-2/60 p-3"><div className="text-xs text-muted-foreground font-mono">Property value</div><div className="font-mono">${Number(loan.property_value || 0).toLocaleString()}</div></div>
        </div>
        <Button className="mt-5 w-full" onClick={save}>Save calculations</Button>
      </div>

      {calculations.length > 0 && (
        <div className="lg:col-span-2 rounded-xl border border-border bg-surface-1 p-6">
          <h3 className="font-semibold">History</h3>
          <ul className="mt-3 space-y-2 text-sm">
            {calculations.map(c => (
              <li key={c.id} className="flex items-center justify-between border-b border-border/60 py-2 font-mono">
                <span>{c.calc_type}</span>
                <span className="text-muted-foreground">{JSON.stringify(c.result)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function PackageTab({ loanId, pkg, extractions, calculations, onGenerated }: { loanId: string; pkg: { summary: unknown; deficiencies: unknown; recommendation: string | null; created_at: string } | null | undefined; extractions: unknown[]; calculations: unknown[]; onGenerated: () => void }) {
  const gen = useServerFn(generatePackage);
  const [busy, setBusy] = useState(false);
  const canGen = extractions.length > 0 || calculations.length > 0;

  async function go() {
    setBusy(true);
    try { await gen({ data: { loanId } }); toast.success("Decision package generated"); onGenerated(); }
    catch (e) { toast.error((e as Error).message); }
    finally { setBusy(false); }
  }

  const s = (pkg?.summary as { executive_summary?: string; key_metrics?: Array<{ label: string; value: string; status: string }>; strengths?: string[]; risks?: string[]; deficiencies?: string[]; stipulations?: string[] }) ?? null;

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-surface-1 p-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h3 className="font-semibold">Underwriting decision package</h3>
          <p className="text-sm text-muted-foreground">AI synthesizes extractions + calculations into a recommendation.</p>
        </div>
        <Button onClick={go} disabled={busy || !canGen}>
          {busy ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Sparkles className="h-4 w-4 mr-2" />}
          {pkg ? "Regenerate package" : "Generate package"}
        </Button>
      </div>

      {!canGen && <div className="rounded-xl border border-warning/40 bg-warning/5 p-5 text-sm flex items-start gap-3"><AlertCircle className="h-4 w-4 text-warning mt-0.5" /> Extract at least one document or save a calculation first.</div>}

      {pkg && s && (
        <div className="rounded-xl border border-border bg-surface-1 p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">Recommendation</div>
              <div className="text-3xl font-semibold mt-1">{pkg.recommendation || "—"}</div>
            </div>
            <div className="text-xs text-muted-foreground font-mono">{new Date(pkg.created_at).toLocaleString()}</div>
          </div>
          {s.executive_summary && <p className="mt-4 text-foreground/90">{s.executive_summary}</p>}

          {s.key_metrics && s.key_metrics.length > 0 && (
            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-3">
              {s.key_metrics.map((m, i) => (
                <div key={i} className="rounded-lg bg-surface-2 p-4">
                  <div className="text-xs font-mono text-muted-foreground uppercase tracking-widest">{m.label}</div>
                  <div className="mt-1 text-xl font-semibold font-mono">{m.value}</div>
                  <div className={`mt-1 text-[10px] font-mono uppercase ${m.status === "pass" ? "text-success" : m.status === "warn" ? "text-warning" : "text-destructive"}`}>{m.status}</div>
                </div>
              ))}
            </div>
          )}

          <div className="mt-6 grid md:grid-cols-2 gap-4">
            <Block title="Strengths" items={s.strengths || []} tone="success" />
            <Block title="Risks" items={s.risks || []} tone="warn" />
            <Block title="Deficiencies" items={s.deficiencies || []} tone="danger" />
            <Block title="Stipulations" items={s.stipulations || []} tone="muted" />
          </div>
        </div>
      )}
    </div>
  );
}

function Block({ title, items, tone }: { title: string; items: string[]; tone: "success" | "warn" | "danger" | "muted" }) {
  const c = tone === "success" ? "border-success/40" : tone === "warn" ? "border-warning/40" : tone === "danger" ? "border-destructive/40" : "border-border";
  return (
    <div className={`rounded-lg border ${c} bg-surface-2/40 p-4`}>
      <div className="text-xs font-mono uppercase tracking-widest text-muted-foreground">{title}</div>
      {items.length === 0 ? <div className="mt-2 text-sm text-muted-foreground">None</div> : (
        <ul className="mt-2 space-y-1 text-sm list-disc list-inside">{items.map((i, k) => <li key={k}>{i}</li>)}</ul>
      )}
    </div>
  );
}
