import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Brain, FileSearch, Calculator, ShieldCheck, Zap, GitBranch, Clock, DollarSign, CheckCircle2, FileText } from "lucide-react";
import { MarketingNav } from "@/components/MarketingNav";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "UnderwriteIQ — Read every loan file. Miss nothing. Decide faster." },
      { name: "description", content: "AI document intelligence for Non-QM mortgage underwriting. From 4 hours to 20 minutes. DSCR, Bank Statement, Jumbo, Foreign National." },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <MarketingNav />

      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        <div className="absolute inset-0 grid-bg opacity-60" />
        <div className="absolute inset-0" style={{ background: "var(--gradient-radial)" }} />
        <div className="relative mx-auto max-w-7xl px-6 pt-24 pb-28">
          <div className="inline-flex items-center gap-2 rounded-full border border-border bg-surface-1/60 px-3 py-1 text-xs font-mono text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-success animate-pulse" /> Built for Non-QM lenders · DSCR · Bank Statement · Jumbo
          </div>
          <h1 className="mt-6 text-5xl md:text-7xl font-semibold tracking-tight text-balance max-w-4xl">
            Read every loan file.<br />
            <span className="text-muted-foreground">Miss nothing.</span> Decide faster.
          </h1>
          <p className="mt-6 max-w-2xl text-lg text-muted-foreground">
            UnderwriteIQ is the AI document intelligence layer for Non-QM mortgage underwriting.
            Extract every field from 300+ page loan files, run DSCR / income / LTV calculations, and produce a structured decision package — in under 20 minutes.
          </p>
          <div className="mt-9 flex flex-wrap items-center gap-3">
            <Link to="/signup">
              <Button size="lg" className="h-12 px-6 text-base shadow-[var(--shadow-glow)]">
                Start free — no credit card <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
            <a href="#how">
              <Button size="lg" variant="outline" className="h-12 px-6 text-base">See how it works</Button>
            </a>
          </div>

          {/* Metric strip */}
          <div className="mt-20 grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {[
              { k: "20 min", v: "Avg loan processed", icon: Clock },
              { k: "$300B+", v: "Non-QM market", icon: DollarSign },
              { k: "22+", v: "Doc types extracted", icon: FileText },
              { k: "99.2%", v: "Field-level accuracy", icon: CheckCircle2 },
            ].map((m, i) => (
              <div key={i} className="bg-surface-1 p-6">
                <m.icon className="h-4 w-4 text-primary mb-3" />
                <div className="text-2xl font-mono font-semibold">{m.k}</div>
                <div className="text-xs text-muted-foreground mt-1">{m.v}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Problem */}
      <section id="product" className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <p className="text-xs font-mono uppercase tracking-widest text-primary">The Problem</p>
              <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight text-balance">
                Non-QM underwriters spend 70% of their time reading documents, not deciding.
              </h2>
              <p className="mt-5 text-muted-foreground">
                Fannie DU and Freddie LP can't touch DSCR, bank statement, or jumbo loans. Every Non-QM file is 300–500 pages, in inconsistent formats, requiring custom calculations per lender. That's 3.5–4.5 hours of human work per loan, at $5,000–$10,000 in processing cost. It doesn't scale.
              </p>
            </div>
            <div className="rounded-xl border border-border bg-surface-1 p-6 font-mono text-sm">
              <div className="text-muted-foreground">// Current state</div>
              <div className="mt-3 space-y-2">
                {[
                  ["Pay stubs / W-2s", "manual read"],
                  ["Tax returns (1040, 1120S)", "manual add-back math"],
                  ["12–24 mo bank statements", "manual deposit averaging"],
                  ["Lease / rent roll", "manual DSCR calc"],
                  ["Appraisal", "manual LTV calc"],
                  ["Lender guideline check", "manual matrix lookup"],
                ].map(([a, b]) => (
                  <div key={a} className="flex justify-between border-b border-border/60 py-1.5">
                    <span>{a}</span><span className="text-destructive">{b}</span>
                  </div>
                ))}
                <div className="flex justify-between pt-3 text-foreground">
                  <span>Total / loan</span><span className="text-warning">~ 4 hr · $5–10k</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how" className="border-b border-border/60 bg-surface-1/30">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">How it works</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">
            Five steps. One pipeline. Auditable end-to-end.
          </h2>

          <div className="mt-14 grid md:grid-cols-5 gap-px bg-border rounded-xl overflow-hidden border border-border">
            {[
              { n: "01", t: "Ingest", d: "Drop the loan file — PDF, image, or text. Any format, any quality.", i: FileSearch },
              { n: "02", t: "Classify", d: "Every page tagged by document type with confidence score.", i: Brain },
              { n: "03", t: "Extract", d: "Borrower, income, property, debt, identity — every field.", i: GitBranch },
              { n: "04", t: "Calculate", d: "DSCR, LTV, qualifying income — deterministic, formula-traced.", i: Calculator },
              { n: "05", t: "Package", d: "Decision summary, deficiencies, stipulations. Export to LOS.", i: ShieldCheck },
            ].map((s) => (
              <div key={s.n} className="bg-surface-1 p-6">
                <div className="font-mono text-xs text-primary">{s.n}</div>
                <s.i className="h-5 w-5 mt-3 text-foreground" />
                <div className="mt-3 font-semibold">{s.t}</div>
                <div className="mt-1 text-sm text-muted-foreground">{s.d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">Built for every Non-QM product</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">
            One platform across the full Non-QM stack.
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            {[
              { t: "DSCR", d: "Rental property investors. Gross rent / PITIA + HOA. The fastest path to scale." },
              { t: "Bank Statement", d: "Self-employed. 12 or 24 month deposit averaging with expense factor." },
              { t: "Jumbo", d: "Above conforming limits. Income, asset, and reserve verification." },
              { t: "Fix & Flip / RTL", d: "Short-term investor loans. ARV, rehab budget, exit strategy." },
              { t: "Foreign National", d: "Non-US borrowers. Visa, ITIN, source of funds." },
              { t: "Asset Depletion", d: "High net worth. Reserve-based qualifying income." },
            ].map((p) => (
              <div key={p.t} className="group rounded-xl border border-border bg-surface-1 p-6 hover:border-primary/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{p.t}</div>
                  <Zap className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="mt-2 text-sm text-muted-foreground">{p.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section id="security" className="border-b border-border/60 bg-surface-1/30">
        <div className="mx-auto max-w-7xl px-6 py-24 grid md:grid-cols-2 gap-12 items-start">
          <div>
            <p className="text-xs font-mono uppercase tracking-widest text-primary">Security & Compliance</p>
            <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight">
              Built like the financial institution you serve.
            </h2>
            <p className="mt-5 text-muted-foreground">
              Row-level security on every record. AES-256 encrypted documents. Full audit trail from raw page to final decision. SOC 2 Type II roadmap. ECOA and Fair Housing compliant.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            {[
              ["Row-level security", "Per-user isolation"],
              ["AES-256 at rest", "TLS 1.3 in transit"],
              ["Audit trail", "Every field traced"],
              ["SOC 2 roadmap", "Type II in flight"],
              ["GLBA", "Safeguards Rule"],
              ["MISMO 3.4", "LOS export ready"],
            ].map(([t, d]) => (
              <div key={t} className="rounded-lg border border-border p-4">
                <div className="text-sm font-semibold">{t}</div>
                <div className="text-xs text-muted-foreground mt-1 font-mono">{d}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-24">
          <p className="text-xs font-mono uppercase tracking-widest text-primary">Pricing</p>
          <h2 className="mt-3 text-3xl md:text-4xl font-semibold tracking-tight max-w-2xl">
            Pay per loan. Or by volume.
          </h2>
          <div className="mt-12 grid md:grid-cols-3 gap-4">
            {[
              { t: "Starter", p: "$999", u: "/month", b: ["Up to 25 loans/mo", "DSCR + Bank Statement", "Email support", "Audit trail"] },
              { t: "Lender", p: "$3,499", u: "/month", h: true, b: ["Up to 150 loans/mo", "All Non-QM products", "Lender guideline configurator", "LOS integration", "Priority support"] },
              { t: "Enterprise", p: "Custom", u: "", b: ["Unlimited volume", "Per-loan pricing $30–$75", "Dedicated success manager", "SSO + SAML", "Custom guideline rules"] },
            ].map((p) => (
              <div key={p.t} className={`rounded-xl border p-7 ${p.h ? "border-primary bg-primary/5 shadow-[var(--shadow-glow)]" : "border-border bg-surface-1"}`}>
                <div className="flex items-center justify-between">
                  <div className="font-semibold">{p.t}</div>
                  {p.h && <span className="text-xs font-mono text-primary">MOST POPULAR</span>}
                </div>
                <div className="mt-4 flex items-baseline gap-1">
                  <span className="text-4xl font-semibold font-mono">{p.p}</span>
                  <span className="text-muted-foreground text-sm">{p.u}</span>
                </div>
                <ul className="mt-6 space-y-2.5">
                  {p.b.map((b) => (
                    <li key={b} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <CheckCircle2 className="h-4 w-4 mt-0.5 text-success shrink-0" /> {b}
                    </li>
                  ))}
                </ul>
                <Link to="/signup" className="mt-7 block">
                  <Button className="w-full" variant={p.h ? "default" : "outline"}>Get started</Button>
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-b border-border/60">
        <div className="mx-auto max-w-7xl px-6 py-24 text-center">
          <h2 className="text-4xl md:text-5xl font-semibold tracking-tight text-balance max-w-3xl mx-auto">
            Stop reading documents. Start making decisions.
          </h2>
          <p className="mt-5 text-muted-foreground max-w-xl mx-auto">
            Process your first loan in minutes. Built for the underwriters who close.
          </p>
          <div className="mt-9">
            <Link to="/signup">
              <Button size="lg" className="h-12 px-8 text-base shadow-[var(--shadow-glow)]">
                Start your first loan <ArrowRight className="ml-1.5 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <footer className="mx-auto max-w-7xl px-6 py-10 flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-muted-foreground">
        <div>© 2026 Suzerain Labs · UnderwriteIQ · Built for Saaf Finance</div>
        <div className="font-mono">underwriteiq.ai</div>
      </footer>
    </div>
  );
}
