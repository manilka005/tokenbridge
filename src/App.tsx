import { useState } from "react";

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
    if (!sourceMap.has(token.name))
      results.push({ token, status: "added" });
  }
  return results;
}

function toCSS(tokens: Token[]): string {
  return `:root {\n${tokens
    .map((t) => `  --${t.name.replace(/\./g, "-")}: ${t.value};`)
    .join("\n")}\n}`;
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
      const inner = Object.entries(vals)
        .map(([k, v]) => `      "${k}": "${v}"`)
        .join(",\n");
      return `    ${g}: {\n${inner}\n    }`;
    })
    .join(",\n");
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

// ── Sample tokens ──────────────────────────────────────────────────────────
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

// ── Token type badge ───────────────────────────────────────────────────────
const TYPE_COLORS: Record<Token["type"], string> = {
  color: "bg-pink-100 text-pink-700",
  spacing: "bg-blue-100 text-blue-700",
  typography: "bg-purple-100 text-purple-700",
  radius: "bg-amber-100 text-amber-700",
  shadow: "bg-slate-100 text-slate-700",
  other: "bg-gray-100 text-gray-600",
};

function TypeBadge({ type }: { type: Token["type"] }) {
  return (
    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${TYPE_COLORS[type]}`}>
      {type}
    </span>
  );
}

function ColorSwatch({ value }: { value: string }) {
  const isColor = /^#|rgb|hsl/.test(value);
  if (!isColor) return null;
  return (
    <span
      className="inline-block w-4 h-4 rounded-sm border border-black/10 mr-2 align-middle flex-shrink-0"
      style={{ backgroundColor: value }}
      aria-hidden="true"
    />
  );
}

// ── Main App ───────────────────────────────────────────────────────────────
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
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans">
      {/* Header */}
      <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-5xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white font-bold text-sm">
              TB
            </div>
            <span className="font-semibold text-lg tracking-tight">TokenBridge</span>
            <span className="text-xs text-slate-500 border border-slate-700 rounded px-2 py-0.5">
              v0.1.0
            </span>
          </div>
          <p className="text-sm text-slate-400 hidden sm:block">
            Design token sync · diff · export
          </p>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {/* Tabs */}
        <nav className="flex gap-1 mb-8 bg-slate-900 p-1 rounded-xl w-fit" aria-label="Sections">
          {(["import", "diff", "export"] as ActiveTab[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                activeTab === tab
                  ? "bg-indigo-600 text-white shadow"
                  : "text-slate-400 hover:text-slate-200"
              }`}
            >
              {tab}
              {tab === "diff" && diffResults.length > 0 && (
                <span className="ml-2 bg-indigo-500/30 text-indigo-300 text-xs rounded-full px-1.5 py-0.5">
                  {diffResults.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        {/* ── IMPORT TAB ── */}
        {activeTab === "import" && (
          <section aria-label="Token import">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              {[
                { label: "Source tokens", sublabel: "Figma / design source", value: sourceText, onChange: setSourceText },
                { label: "Target tokens", sublabel: "Codebase / current", value: targetText, onChange: setTargetText },
              ].map(({ label, sublabel, value, onChange }) => (
                <div key={label}>
                  <div className="mb-2">
                    <label className="block text-sm font-medium text-slate-200">{label}</label>
                    <span className="text-xs text-slate-500">{sublabel}</span>
                  </div>
                  <textarea
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="w-full h-80 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm font-mono text-slate-300 resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    spellCheck={false}
                    aria-label={label}
                  />
                </div>
              ))}
            </div>

            {parseError && (
              <div role="alert" className="mb-4 bg-red-950/60 border border-red-800 text-red-300 rounded-xl px-4 py-3 text-sm">
                {parseError}
              </div>
            )}

            <button
              onClick={parseAndLoad}
              className="bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium px-6 py-3 rounded-xl transition-all"
            >
              Parse &amp; Compare →
            </button>
          </section>
        )}

        {/* ── DIFF TAB ── */}
        {activeTab === "diff" && (
          <section aria-label="Token diff">
            {diffResults.length === 0 ? (
              <div className="text-center py-24 text-slate-500">
                <p className="text-lg mb-2">No diff yet</p>
                <p className="text-sm">Go to Import, paste your tokens, and click Parse &amp; Compare.</p>
              </div>
            ) : (
              <>
                {/* Summary */}
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {[
                    { label: "Added", count: diffAdded, color: "text-emerald-400", bg: "bg-emerald-950/40 border-emerald-800/50" },
                    { label: "Changed", count: diffChanged, color: "text-amber-400", bg: "bg-amber-950/40 border-amber-800/50" },
                    { label: "Removed", count: diffRemoved, color: "text-red-400", bg: "bg-red-950/40 border-red-800/50" },
                  ].map(({ label, count, color, bg }) => (
                    <div key={label} className={`border rounded-xl p-4 text-center ${bg}`}>
                      <div className={`text-3xl font-bold ${color}`}>{count}</div>
                      <div className="text-sm text-slate-400 mt-1">{label}</div>
                    </div>
                  ))}
                </div>

                {/* Diff cards */}
                <div className="space-y-3">
                  {diffResults.map((d, i) => (
                    <div
                      key={i}
                      className={`rounded-xl border p-4 flex items-start gap-4 ${
                        d.status === "added"
                          ? "bg-emerald-950/20 border-emerald-800/40"
                          : d.status === "removed"
                          ? "bg-red-950/20 border-red-800/40"
                          : "bg-amber-950/20 border-amber-800/40"
                      }`}
                    >
                      <span
                        className={`text-xs font-bold mt-0.5 uppercase tracking-widest w-16 flex-shrink-0 ${
                          d.status === "added" ? "text-emerald-400" : d.status === "removed" ? "text-red-400" : "text-amber-400"
                        }`}
                      >
                        {d.status}
                      </span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <code className="text-sm text-slate-200 font-mono">{d.token.name}</code>
                          <TypeBadge type={d.token.type} />
                        </div>
                        <div className="flex items-center gap-3 text-sm">
                          {d.status === "changed" && (
                            <>
                              <span className="flex items-center text-red-400 line-through">
                                <ColorSwatch value={String(d.oldValue)} />
                                {String(d.oldValue)}
                              </span>
                              <span className="text-slate-500">→</span>
                            </>
                          )}
                          <span className="flex items-center text-slate-300">
                            <ColorSwatch value={String(d.token.value)} />
                            {String(d.token.value)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <button
                  onClick={() => setActiveTab("export")}
                  className="mt-8 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white font-medium px-6 py-3 rounded-xl transition-all"
                >
                  Export tokens →
                </button>
              </>
            )}
          </section>
        )}

        {/* ── EXPORT TAB ── */}
        {activeTab === "export" && (
          <section aria-label="Token export">
            <div className="flex gap-2 mb-6" role="group" aria-label="Export format">
              {(["css", "tailwind", "js"] as ExportFormat[]).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setExportFormat(fmt)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all uppercase tracking-wide ${
                    exportFormat === fmt
                      ? "bg-indigo-600 text-white"
                      : "bg-slate-800 text-slate-400 hover:text-slate-200"
                  }`}
                >
                  {fmt === "css" ? "CSS Variables" : fmt === "tailwind" ? "Tailwind Config" : "JS Object"}
                </button>
              ))}
            </div>

            <div className="relative">
              <pre className="bg-slate-900 border border-slate-700 rounded-xl p-6 text-sm font-mono text-slate-300 overflow-auto max-h-[500px] whitespace-pre-wrap">
                {targetTokens.length || sourceTokens.length
                  ? exportCode()
                  : "// Parse tokens first in the Import tab"}
              </pre>
              <button
                onClick={copyToClipboard}
                className="absolute top-4 right-4 bg-slate-700 hover:bg-slate-600 text-slate-300 text-xs px-3 py-1.5 rounded-lg transition-all"
                aria-label="Copy to clipboard"
              >
                {copied ? "✓ Copied!" : "Copy"}
              </button>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}