import { useState, useEffect, useRef } from "react";
import Nav from "../components/Nav";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href = "https://fonts.googleapis.com/css2?family=Geist+Mono:wght@300;400;500&family=Geist:wght@300;400;500;600&display=swap";
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

function AnimatedNumber({ value }: { value: number }) {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const duration = 500;
    const step = value / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(timer); }
      else setDisplay(Math.floor(start));
    }, 16);
    return () => clearInterval(timer);
  }, [value]);
  return <>{display}</>;
}

function FadeIn({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(6px)";
    const t = setTimeout(() => {
      el.style.transition = "opacity 0.35s ease, transform 0.35s ease";
      el.style.opacity = "1";
      el.style.transform = "translateY(0)";
    }, delay);
    return () => clearTimeout(t);
  }, [delay]);
  return <div ref={ref}>{children}</div>;
}

function ColorSwatch({ value }: { value: string }) {
  if (!/^#|rgb|hsl/.test(value)) return null;
  return (
    <span
      className="inline-block w-3 h-3 rounded-sm border border-black/10 mr-1.5 align-middle flex-shrink-0"
      style={{ backgroundColor: value }}
      aria-hidden="true"
    />
  );
}

const TYPE_STYLES: Record<Token["type"], string> = {
  color:      "text-pink-600 bg-pink-50",
  spacing:    "text-blue-600 bg-blue-50",
  typography: "text-violet-600 bg-violet-50",
  radius:     "text-amber-600 bg-amber-50",
  shadow:     "text-slate-500 bg-slate-100",
  other:      "text-zinc-500 bg-zinc-100",
};

function TypeBadge({ type }: { type: Token["type"] }) {
  return (
    <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium uppercase tracking-wider ${TYPE_STYLES[type]}`}>
      {type}
    </span>
  );
}

export default function Tool() {
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

  const diffAdded   = diffResults.filter((d) => d.status === "added").length;
  const diffChanged = diffResults.filter((d) => d.status === "changed").length;
  const diffRemoved = diffResults.filter((d) => d.status === "removed").length;

  return (
    <div style={{ fontFamily: "'Geist', sans-serif" }} className="min-h-screen bg-[#fafafa] text-[#111] pt-14">
      <Nav />
      <main className="max-w-4xl mx-auto px-8 py-8">
        <div className="flex items-center gap-0 mb-8 border-b border-[#e5e5e5]">
          {(["import", "diff", "export"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2.5 text-[13px] font-medium capitalize transition-all border-b-2 -mb-px ${
                activeTab === tab
                  ? "border-[#111] text-[#111]"
                  : "border-transparent text-[#888] hover:text-[#444]"
              }`}
            >
              {tab}
              {tab === "diff" && diffResults.length > 0 && (
                <span className="ml-1.5 text-[10px] bg-[#f0f0f0] text-[#666] rounded-full px-1.5 py-0.5 font-medium">
                  {diffResults.length}
                </span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "import" && (
          <FadeIn>
            <div className="mb-6">
              <h1 className="text-[22px] font-semibold tracking-tight text-[#111] mb-1">Compare token sets</h1>
              <p className="text-[13px] text-[#888]">Paste W3C-format JSON from Figma and your codebase to see what changed.</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              {[
                { label: "Source", sublabel: "Figma / design", value: sourceText, onChange: setSourceText },
                { label: "Target", sublabel: "Codebase / current", value: targetText, onChange: setTargetText },
              ].map(({ label, sublabel, value, onChange }) => (
                <div key={label}>
                  <div className="flex items-baseline gap-2 mb-1.5">
                    <label className="text-[13px] font-medium text-[#111]">{label}</label>
                    <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[11px] text-[#aaa]">{sublabel}</span>
                  </div>
                  <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    style={{ fontFamily: "'Geist Mono', monospace", fontSize: "11.5px" }}
                    className="w-full h-72 bg-white border border-[#e5e5e5] rounded-lg p-3.5 text-[#444] resize-none focus:outline-none focus:border-[#999] transition-colors leading-relaxed"
                    spellCheck={false}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>
            {parseError && (
              <div role="alert" className="mb-4 bg-red-50 border border-red-200 text-red-600 rounded-lg px-4 py-3 text-[13px]">
                {parseError}
              </div>
            )}
            <button
              onClick={parseAndLoad}
              className="bg-[#111] hover:bg-[#333] text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors active:scale-95"
            >
              Parse &amp; Compare →
            </button>
          </FadeIn>
        )}

        {activeTab === "diff" && (
          <FadeIn>
            {diffResults.length === 0 ? (
              <div className="text-center py-32 text-[#bbb]">
                <p className="text-[15px] font-medium mb-1 text-[#888]">No diff yet</p>
                <p className="text-[13px]">Go to Import, paste your tokens, and click Parse &amp; Compare.</p>
              </div>
            ) : (
              <>
                <div className="mb-6">
                  <h1 className="text-[22px] font-semibold tracking-tight text-[#111] mb-1">Token diff</h1>
                  <p className="text-[13px] text-[#888]">
                    {diffResults.length} token{diffResults.length !== 1 ? "s" : ""} changed between source and target.
                  </p>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {[
                    { label: "Added",   count: diffAdded,   color: "#16a34a", bg: "#f0fdf4", border: "#bbf7d0" },
                    { label: "Changed", count: diffChanged, color: "#d97706", bg: "#fffbeb", border: "#fde68a" },
                    { label: "Removed", count: diffRemoved, color: "#dc2626", bg: "#fef2f2", border: "#fecaca" },
                  ].map(({ label, count, color, bg, border }, i) => (
                    <FadeIn key={label} delay={i * 50}>
                      <div className="rounded-lg p-4 text-center border" style={{ background: bg, borderColor: border }}>
                        <div className="text-3xl font-bold tracking-tight" style={{ color }}>
                          <AnimatedNumber value={count} />
                        </div>
                        <div
                          style={{ fontFamily: "'Geist Mono', monospace" }}
                          className="text-[10px] text-[#888] mt-1 uppercase tracking-wider"
                        >
                          {label}
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
                <div className="border border-[#e5e5e5] rounded-lg overflow-hidden">
                  {diffResults.map((d, i) => (
                    <FadeIn key={i} delay={i * 25}>
                      <div
                        className={`flex items-center gap-4 px-4 py-3 text-[13px] border-b border-[#f0f0f0] last:border-0 hover:bg-[#fafafa] transition-colors ${
                          d.status === "added"
                            ? "bg-[#f0fdf4]"
                            : d.status === "removed"
                            ? "bg-[#fef2f2]"
                            : "bg-white"
                        }`}
                      >
                        <span
                          style={{ fontFamily: "'Geist Mono', monospace" }}
                          className={`text-[10px] font-medium uppercase tracking-wider w-14 flex-shrink-0 ${
                            d.status === "added"
                              ? "text-green-600"
                              : d.status === "removed"
                              ? "text-red-500"
                              : "text-amber-600"
                          }`}
                        >
                          {d.status}
                        </span>
                        <code
                          style={{ fontFamily: "'Geist Mono', monospace" }}
                          className="text-[12.5px] text-[#333] flex-1 min-w-0 truncate"
                        >
                          {d.token.name}
                        </code>
                        <TypeBadge type={d.token.type} />
                        <div
                          style={{ fontFamily: "'Geist Mono', monospace" }}
                          className="flex items-center gap-2 text-[12px] flex-shrink-0"
                        >
                          {d.status === "changed" && (
                            <>
                              <span className="flex items-center text-[#bbb] line-through">
                                <ColorSwatch value={String(d.oldValue)} />
                                {String(d.oldValue)}
                              </span>
                              <span className="text-[#ccc]">→</span>
                            </>
                          )}
                          <span className="flex items-center text-[#444]">
                            <ColorSwatch value={String(d.token.value)} />
                            {String(d.token.value)}
                          </span>
                        </div>
                      </div>
                    </FadeIn>
                  ))}
                </div>
                <div className="mt-6">
                  <button
                    onClick={() => setActiveTab("export")}
                    className="bg-[#111] hover:bg-[#333] text-white text-[13px] font-medium px-4 py-2 rounded-lg transition-colors active:scale-95"
                  >
                    Export tokens →
                  </button>
                </div>
              </>
            )}
          </FadeIn>
        )}

        {activeTab === "export" && (
          <FadeIn>
            <div className="mb-6">
              <h1 className="text-[22px] font-semibold tracking-tight text-[#111] mb-1">Export tokens</h1>
              <p className="text-[13px] text-[#888]">Copy your tokens in the format your codebase uses.</p>
            </div>
            <div className="flex gap-2 mb-4">
              {(
                [
                  { key: "css",      label: "CSS Variables" },
                  { key: "tailwind", label: "Tailwind Config" },
                  { key: "js",       label: "JS Object" },
                ] as { key: ExportFormat; label: string }[]
              ).map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setExportFormat(key)}
                  className={`px-3 py-1.5 rounded-md text-[12px] font-medium transition-all ${
                    exportFormat === key
                      ? "bg-[#111] text-white"
                      : "bg-white border border-[#e5e5e5] text-[#666] hover:text-[#111] hover:border-[#999]"
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <div className="rounded-lg border border-[#e5e5e5] overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2.5 bg-[#f5f5f5] border-b border-[#e5e5e5]">
                <span style={{ fontFamily: "'Geist Mono', monospace" }} className="text-[11px] text-[#999]">
                  {exportFormat === "css"
                    ? "tokens.css"
                    : exportFormat === "tailwind"
                    ? "tailwind.config.js"
                    : "tokens/index.ts"}
                </span>
                <button
                  onClick={copyToClipboard}
                  className={`text-[11px] font-medium px-2.5 py-1 rounded transition-all ${
                    copied
                      ? "bg-green-100 text-green-700"
                      : "bg-white border border-[#e5e5e5] text-[#666] hover:text-[#111]"
                  }`}
                >
                  {copied ? "✓ Copied" : "Copy"}
                </button>
              </div>
              <pre
                style={{ fontFamily: "'Geist Mono', monospace", fontSize: "12px" }}
                className="bg-white p-5 text-[#444] overflow-auto max-h-[440px] leading-relaxed"
              >
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
