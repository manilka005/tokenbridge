import { useState, useEffect, useRef } from "react";

// ── Google Fonts ───────────────────────────────────────────────────────────
const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=DM+Mono:ital,wght@0,300;0,400;0,500;1,300&family=Syne:wght@400;500;600;700;800&display=swap";
document.head.appendChild(fontLink);

// ── Types ──────────────────────────────────────────────────────────────────
type TokenValue = string | number;
interface Token {
  name: string;
  value: TokenValue;
  type: "color" | "spacing" | "typography" | "radius" | "shadow" | "other";
  group: string;
}
interface DiffResult {
  token: Token;
  status: "added" | "removed" | "changed";
  oldValue?: TokenValue;
}
type ExportFormat = "css" | "tailwind" | "js";
type ActiveTab = "import" | "diff" | "export";

// ── Helpers ────────────────────────────────────────────────────────────────
function detectType(key: string, value: TokenValue): Token["type"] {
  if (typeof value === "string" && /^#|rgb|hsl/.test(value)) return "color";
  if (/space|gap|padding|margin|size/.test(key)) return "spacing";
  if (/font|text|line|letter/.test(key)) return "typography";
  if (/radius|rounded/.test(key)) return "radius";
  if (/shadow/.test(key)) return "shadow";
  return "other";
}

function flattenTokens(obj: Record<string, unknown>, prefix = ""): Token[] {
  const tokens: Token[] = [];
  for (const [key, val] of Object.entries(obj)) {
    const fullKey = prefix ? `${prefix}.${key}` : key;
    if (val && typeof val === "object" && !("value" in val)) {
      tokens.push(...flattenTokens(val as Record<string, unknown>, fullKey));
    } else {
      const value = (val as { value?: unknown })?.value ?? val;
      const parts = fullKey.split(".");
      tokens.push({
        name: fullKey,
        value: String(value),
        type: detectType(fullKey.toLowerCase(), String(value)),
        group: parts[0],
      });
    }
  }
  return tokens;
}

function diffTokens(source: Token[], target: Token[]): DiffResult[] {
  const results: DiffResult[] = [];
  const targetMap = new Map(target.map((t) => [t.name, t]));
  const sourceMap = new Map(source.map((t) => [t.name, t]));
  for (const token of source) {
    const match = targetMap.get(token.name);
    if (!match) results.push({ token, status: "removed" });
    else if (String(match.value) !== String(token.value))
      results.push({ token: match, status: "changed", oldValue: token.value });
  }
  for (const token of target) {
    if (!sourceMap.has(token.name)) results.push({ token, status: "added" });
  }
  return results;
}

function toCSS(tokens: Token[]): string {
  return `:root {\n${tokens.map((t) => `  --${t.name.replace(/\./g, "-")}: ${t.value};`).join("\n")}\n}`;
}

function toTailwind(tokens: Token[]): string {
  const grouped: Record<string, Record<string, string>> = {};
  for (const t of tokens) {
    const parts = t.name.split(".");
    const group = parts[0];
    const key = parts.slice(1).join("-") || parts[0];
    if (!grouped[group]) grouped[group] = {};
    grouped[group][key] = String(t.value);
  }
  const entries = Object.entries(grouped)
    .map(([g, vals]) => {
      const inner = Object.entries(vals).map(([k, v]) => `      "${k}": "${v}"`).join(",\n");
      return `    ${g}: {\n${inner}\n    }`;
    }).join(",\n");
  return `module.exports = {\n  theme: {\n    extend: {\n${entries}\n    }\n  }\n}`;
}

function toJS(tokens: Token[]): string {
  const obj: Record<string, unknown> = {};
  for (const t of tokens) {
    const parts = t.name.split(".");
    let cur = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      if (!cur[parts[i]]) cur[parts[i]] = {};
      cur = cur[parts[i]] as Record<string, unknown>;
    }
    cur[parts[parts.length - 1]] = t.value;
  }
  return `export const tokens = ${JSON.stringify(obj, null, 2)};`;
}

const SAMPLE_SOURCE = `{
  "color": {
    "brand": { "value": "#6366f1" },
    "surface": { "value": "#ffffff" },
    "text": { "value": "#111827" },
    "muted": { "value": "#6b7280" }
  },
  "space": {
    "xs": { "value": "4px" },
    "sm": { "value": "8px" },
    "md": { "value": "16px" },
    "lg": { "value": "24px" },
    "xl": { "value": "32px" }
  },
  "radius": {
    "sm": { "value": "4px" },
    "md": { "value": "8px" },
    "lg": { "value": "12px" }
  }
}`;

const SAMPLE_TARGET = `{
  "color": {
    "brand": { "value": "#4f46e5" },
    "surface": { "value": "#f9fafb" },
    "text": { "value": "#111827" },
    "accent": { "value": "#f59e0b" }
  },
  "space": {
    "xs": { "value": "4px" },
    "sm": { "value": "8px" },
    "md": { "value": "16px" },
    "lg": { "value": "32px" },
    "xl": { "value": "48px" }
  },
  "radius": {
    "sm": { "value": "4px" },
    "md": { "value": "8px" },
    "lg": { "value": "16px" }
  }
}`;

// ── Animated counter ───────────────────────────────────────────────────────
function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const end = value;
    if (start === end) return;
    const duration = 600;
    const step = end / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= end) { setDisplay(end); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

// ── Fade-in wrapper ────────────────────────────────────────────────────────
function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(8px)";
    const t = setTimeout(() => {
      el.style.transition = `opacity 0.4s ease, transform 0.4s ease`;
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);
  return <div ref={ref}>{children}</div>;
}

// ── Color swatch ───────────────────────────────────────────────────────────
function ColorSwatch({ value }: { value: string }) {
  const isColor = /^#|rgb|hsl/.test(value);
  if (!isColor) return null;
  return (
    <span
      className="inline-block w-3.5 h-3.5 rounded-sm border border-white/10 mr-1.5 align-middle flex-shrink-0"
      style={{ backgroundColor: value }}
      aria-hidden="true"
    />
  );
}

// ── Type badge ─────────────────────────────────────────────────────────────
const TYPE_STYLES: Record<Token["type"], string> = {
  color: "bg-pink-500/10 text-pink-400 border-pink-500/20",
  spacing: "bg-sky-500/10 text-sky-400 border-sky-500/20",
  typography: "bg-violet-500/10 text-violet-400 border-violet-500/20",
  radius: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  shadow: "bg-slate-500/10 text-slate-400 border-slate-500/20",
  other: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

function TypeBadge({ type }: { type: Token["type"] }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium tracking-wide uppercase ${TYPE_STYLES[type]}`}>
      {type}
    </span>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────
export default function App() {
  const [activeTab, setActiveTab] = useState<ActiveTab>("import");
  const [sourceText, setSourceText] = useState(SAMPLE_SOURCE);
  const [targetText, setTargetText] = useState(SAMPLE_TARGET);
  const [sourceTokens, setSourceTokens] = useState<Token[]>([]);
  const [targetTokens, setTargetTokens] = useState<Token[]>([]);
  const [diffResults, setDiffResults] = useState<DiffResult[]>([]);
  const [exportFormat, setExportFormat] = useState<ExportFormat>("css");
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  function parseAndLoad() {
    try {
      const src = flattenTokens(JSON.parse(sourceText));
      const tgt = flattenTokens(JSON.parse(targetText));
      setSourceTokens(src);
      setTargetTokens(tgt);
      setDiffResults(diffTokens(src, tgt));
      setParseError(null);
      setActiveTab("diff");
    } catch {
      setParseError("Invalid JSON — check both token files for syntax errors.");
    }
  }

  function exportCode() {
    const tokens = targetTokens.length ? targetTokens : sourceTokens;
    if (exportFormat === "css") return toCSS(tokens);
    if (exportFormat === "tailwind") return toTailwind(tokens);
    return toJS(tokens);
  }

  function copyToClipboard() {
    navigator.clipboard.writeText(exportCode());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const diffAdded = diffResults.filter((d) => d.status === "added").length;
  const diffChanged = diffResults.filter((d) => d.status === "changed").length;
  const diffRemoved = diffResults.filter((d) => d.status === "removed").length;

  return (
    <div style={{ fontFamily: "'Syne', sans-serif" }} className="min-h-screen bg-[#0a0a0b] text-slate-100">

      {/* Subtle grid background */}
      <div className="fixed inset-0 pointer-events-none" style={{
        backgroundImage: `linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)`,
        backgroundSize: "48px 48px"
      }} />

      {/* Glow */}
      <div className="fixed top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] pointer-events-none"
        style={{ background: "radial-gradient(ellipse at center, rgba(99,102,241,0.08) 0%, transparent 70%)" }} />

      {/* Header */}
      <header className="relative border-b border-white/[0.06] bg-[#0a0a0b]/80 backdrop-blur-xl sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg flex items-center justify-center text-white font-black text-xs"
              style={{ background: "linear-gradient(135deg, #6366f1, #8b5cf6)" }}>
              TB
            </div>
            <span className="font-bold text-[15px] tracking-tight text-white">TokenBridge</span>
            <span className="text-[10px] text-slate-600 border border-white/[0.06] rounded px-1.5 py-0.5 font-medium tracking-wider uppercase">
              v0.1.0
            </span>
          </div>
          <p style={{ fontFamily: "'DM Mono', monospace" }} className="text-[11px] text-slate-600 hidden sm:block">
            design tokens · sync · export
          </p>
        </div>
      </header>

      <main className="relative max-w-5xl mx-auto px-6 py-10">

        {/* Tab bar */}
        <div className="flex items-center gap-1 mb-10">
          {(["import", "diff", "export"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`relative px-4 py-1.5 rounded-md text-[13px] font-medium transition-all capitalize ${
                activeTab === tab
                  ? "text-white"
                  : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {activeTab === tab && (
                <span className="absolute inset-0 rounded-md bg-white/[0.07] border border-white/[0.1]" />
              )}
              <span className="relative">
                {tab}
                {tab === "diff" && diffResults.length > 0 && (
                  <span className="ml-1.5 text-[10px] bg-indigo-500/20 text-indigo-400 rounded-full px-1.5 py-0.5">
                    {diffResults.length}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>

        {/* ── IMPORT ── */}
        {activeTab === "import" && (
          <FadeIn>
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Compare token sets</h1>
              <p className="text-sm text-slate-500">Paste W3C-format JSON from Figma and your codebase to see what&#39;s changed.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { label: "Source", sublabel: "Figma / design", value: sourceText, onChange: setSourceText },
                { label: "Target", sublabel: "Codebase / current", value: targetText, onChange: setTargetText },
              ].map(({ label, sublabel, value, onChange }) => (
                <div key={label}>
                  <div className="flex items-baseline gap-2 mb-2">
                    <label className="text-[13px] font-semibold text-slate-200">{label}</label>
                    <span style={{ fontFamily: "'DM Mono', monospace" }} className="text-[11px] text-slate-600">{sublabel}</span>
                  </div>
                  <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px" }}
                    className="w-full h-80 bg-[#111113] border border-white/[0.07] rounded-xl p-4 text-slate-400 resize-none focus:outline-none focus:border-indigo-500/50 focus:ring-1 focus:ring-indigo-500/20 transition-all leading-relaxed"
                    spellCheck={false}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>

            {parseError && (
              <div role="alert" className="mb-4 bg-red-500/5 border border-red-500/20 text-red-400 rounded-xl px-4 py-3 text-[13px]">
                {parseError}
              </div>
            )}

            <button
              onClick={parseAndLoad}
              className="group relative overflow-hidden bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg transition-all active:scale-95"
            >
              <span className="relative flex items-center gap-2">
                Parse &amp; Compare
                <span className="group-hover:translate-x-0.5 transition-transform">→</span>
              </span>
            </button>
          </FadeIn>
        )}

        {/* ── DIFF ── */}
        {activeTab === "diff" && (
          <FadeIn>
            {diffResults.length === 0 ? (
              <div className="text-center py-32 text-slate-600">
                <p className="text-lg font-semibold mb-2 text-slate-500">No diff yet</p>
                <p className="text-sm">Go to Import, paste your tokens, and click Parse &amp; Compare.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Token diff</h1>
                  <p className="text-sm text-slate-500">{diffResults.length} token{diffResults.length !== 1 ? "s" : ""} changed between source and target.</p>
                </div>

                {/* Summary cards */}
                <div className="grid grid-cols-3 gap-3 mb-8">
                  {[
                    { label: "Added", count: diffAdded, color: "text-emerald-400", border: "border-emerald-500/15", bg: "bg-emerald-500/5" },
                    { label: "Changed", count: diffChanged, color: "text-amber-400", border: "border-amber-500/15", bg: "bg-amber-500/5" },
                    { label: "Removed", count: diffRemoved, color: "text-red-400", border: "border-red-500/15", bg: "bg-red-500/5" },
                  ].map(({ label, count, color, border, bg }, i) => (
                    <FadeIn key={label} delay={i * 60}>
                      <div className={`border rounded-xl p-5 text-center ${border} ${bg}`}>
                        <div className={`text-4xl font-black tracking-tight ${color}`}>
                          <AnimatedNumber value={count} />
                        </div>
                        <div style={{ fontFamily: "'DM Mono', monospace" }} className="text-[11px] text-slate-500 mt-1 uppercase tracking-wider">{label}</div>
                      </div>
                    </FadeIn>
                  ))}
                </div>

                {/* Diff list */}
                <div className="space-y-2">
                  {diffResults.map((d, i) => (
                    <FadeIn key={i} delay={i * 30}>
                      <div className={`group rounded-xl border px-5 py-4 flex items-center gap-5 transition-all hover:border-white/[0.12] ${
                        d.status === "added" ? "bg-emerald-500/[0.04] border-emerald-500/10"
                        : d.status === "removed" ? "bg-red-500/[0.04] border-red-500/10"
                        : "bg-amber-500/[0.04] border-amber-500/10"
                      }`}>
                        {/* Status pill */}
                        <span style={{ fontFamily: "'DM Mono', monospace" }} className={`text-[10px] font-medium uppercase tracking-widest w-14 flex-shrink-0 ${
                          d.status === "added" ? "text-emerald-500"
                          : d.status === "removed" ? "text-red-500"
                          : "text-amber-500"
                        }`}>
                          {d.status}
                        </span>

                        {/* Token name */}
                        <code style={{ fontFamily: "'DM Mono', monospace" }} className="text-[13px] text-slate-300 flex-1 min-w-0 truncate">
                          {d.token.name}
                        </code>

                        {/* Type badge */}
                        <TypeBadge type={d.token.type} />

                        {/* Values */}
                        <div style={{ fontFamily: "'DM Mono', monospace" }} className="flex items-center gap-2 text-[12px] flex-shrink-0">
                          {d.status === "changed" && (
                            <>
                              <span className="flex items-center text-red-400/70 line-through">
                                <ColorSwatch value={String(d.oldValue)} />
                                {String(d.oldValue)}
                              </span>
                              <span className="text-slate-700">→</span>
                            </>
                          )}
                          <span className="flex items-center text-slate-300">
                            <ColorSwatch value={String(d.token.value)} />
                            {String(d.token.value)}
                          </span>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>

                <div className="mt-8">
                  <button
                    onClick={() => setActiveTab("export")}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white text-[13px] font-semibold px-5 py-2.5 rounded-lg transition-all active:scale-95 flex items-center gap-2"
                  >
                    Export tokens <span>→</span>
                  </button>
                </div>
              </>
            )}
          </FadeIn>
        )}

        {/* ── EXPORT ── */}
        {activeTab === "export" && (
          <FadeIn>
            <div className="mb-6">
              <h1 className="text-2xl font-bold tracking-tight text-white mb-1">Export tokens</h1>
              <p className="text-sm text-slate-500">Copy your tokens in the format your codebase uses.</p>
            </div>

            <div className="flex gap-2 mb-5" role="group" aria-label="Export format">
              {([
                { key: "css", label: "CSS Variables" },
                { key: "tailwind", label: "Tailwind Config" },
                { key: "js", label: "JS Object" },
              ] as { key: ExportFormat; label: string }[]).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setExportFormat(key)}
                  className={`px-3.5 py-1.5 rounded-lg text-[12px] font-semibold transition-all ${
                    exportFormat === key
                      ? "bg-indigo-600 text-white"
                      : "bg-white/[0.04] text-slate-400 hover:text-slate-200 border border-white/[0.06]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            <div className="relative rounded-xl overflow-hidden border border-white/[0.07]">
              {/* Code header bar */}
              <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
                <span style={{ fontFamily: "'DM Mono', monospace" }} className="text-[11px] text-slate-600 uppercase tracking-wider">
                  {exportFormat === "css" ? "styles/tokens.css" : exportFormat === "tailwind" ? "tailwind.config.js" : "tokens/index.ts"}
                </span>
                <button
                  onClick={copyToClipboard}
                  className={`text-[11px] font-medium px-3 py-1 rounded-md transition-all ${
                    copied
                      ? "bg-emerald-500/20 text-emerald-400"
                      : "bg-white/[0.05] text-slate-400 hover:text-slate-200 hover:bg-white/[0.08]"
                  }`}
                  aria-label="Copy to clipboard"
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre style={{ fontFamily: "'DM Mono', monospace", fontSize: "12px" }}
                className="bg-[#0d0d0f] p-6 text-slate-400 overflow-auto max-h-[480px] leading-relaxed">
                {targetTokens.length || sourceTokens.length
                  ? exportCode()
                  : "// Parse tokens first in the Import tab"}
              </pre>
            </div>
          </FadeIn>
        )}
      </main>
    </div>
  );
}