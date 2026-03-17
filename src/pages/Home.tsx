import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import Nav from "../components/Nav";

const fontLink = document.createElement("link");
fontLink.rel = "stylesheet";
fontLink.href =
  "https://fonts.googleapis.com/css2?family=DM+Serif+Display:ital@0;1&family=DM+Mono:wght@300;400;500&family=DM+Sans:wght@300;400;500;600&display=swap";
document.head.appendChild(fontLink);

function Reveal({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    el.style.opacity = "0";
    el.style.transform = "translateY(24px)";
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        setTimeout(() => {
          el.style.transition = "opacity 0.7s ease, transform 0.7s ease";
          el.style.opacity = "1";
          el.style.transform = "translateY(0)";
        }, delay);
        observer.disconnect();
      }
    }, { threshold: 0.1 });
    observer.observe(el);
    return () => observer.disconnect();
  }, [delay]);
  return <div ref={ref} className={className}>{children}</div>;
}

function FloatingCTA() {
  const navigate = useNavigate();
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const handler = () => setVisible(window.scrollY > 400);
    window.addEventListener("scroll", handler);
    return () => window.removeEventListener("scroll", handler);
  }, []);
  return (
    <div className={`fixed bottom-6 right-6 z-50 transition-all duration-500 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4 pointer-events-none"}`}>
      <button
        onClick={() => navigate("/app")}
        className="group flex items-center gap-2 bg-[#0a0a0b]/90 hover:bg-[#1a1a1b] text-white text-[11px] font-medium px-4 py-2.5 rounded-full shadow-2xl transition-all border border-white/10"
        style={{ fontFamily: "'DM Mono', monospace", backdropFilter: "blur(12px)" }}
      >
        Open TokenBridge
        <span className="group-hover:translate-x-0.5 transition-transform text-white/40">→</span>
      </button>
    </div>
  );
}

export default function Home() {
  const navigate = useNavigate();
  const [heroVisible, setHeroVisible] = useState(false);
  useEffect(() => { const t = setTimeout(() => setHeroVisible(true), 100); return () => clearTimeout(t); }, []);

  return (
    <div style={{ fontFamily: "'DM Sans', sans-serif" }} className="text-[#111] overflow-x-hidden">
      <Nav dark />
      <FloatingCTA />

      {/* HERO */}
      <section className="relative min-h-screen flex flex-col justify-center overflow-hidden px-6 md:px-8"
        style={{ background: "radial-gradient(ellipse 80% 60% at 20% 50%, #0f0e1f 0%, #09090f 60%)" }}>
        <div className="absolute top-1/4 left-1/4 w-[300px] md:w-[500px] h-[300px] md:h-[500px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(99,102,241,0.15) 0%, transparent 70%)", animation: "orb 8s ease-in-out infinite" }} />
        <div className="absolute bottom-1/4 right-1/4 w-[200px] md:w-[400px] h-[200px] md:h-[400px] rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle, rgba(234,179,8,0.06) 0%, transparent 70%)", animation: "orb 10s ease-in-out infinite reverse" }} />
        <div className="absolute inset-0 pointer-events-none opacity-[0.025]"
          style={{ backgroundImage: "linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />

        <div className="relative max-w-5xl mx-auto w-full pt-20 md:pt-24">
          <div className={`flex flex-wrap items-center gap-3 mb-8 md:mb-10 transition-all duration-700 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <div className="flex items-center gap-2 bg-white/[0.05] border border-white/[0.08] rounded-full px-3 py-1">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-400" style={{ boxShadow: "0 0 8px #6366f1", animation: "orb 2s ease-in-out infinite" }} />
              <span style={{ fontFamily: "'DM Mono', monospace" }} className="text-[10px] text-white/50 tracking-widest uppercase">Open source · v0.1.0</span>
            </div>
            <span style={{ fontFamily: "'DM Mono', monospace" }} className="text-[10px] text-white/20 tracking-wider hidden sm:inline">React · TypeScript · W3C Tokens</span>
          </div>

          <div className={`transition-all duration-700 delay-100 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", lineHeight: 1.05 }} className="text-[52px] sm:text-[72px] lg:text-[96px] text-white tracking-tight">
              Design.
            </h1>
            <div className="flex items-center gap-4 md:gap-6 my-1">
              <div className="flex-1 h-px bg-gradient-to-r from-indigo-500/40 to-transparent" />
              <span style={{ fontFamily: "'DM Mono', monospace" }} className="text-[10px] md:text-[11px] text-white/30 uppercase tracking-widest flex-shrink-0">meets</span>
              <div className="flex-1 h-px bg-gradient-to-l from-indigo-500/40 to-transparent" />
            </div>
            <h1 style={{ fontFamily: "'DM Serif Display', serif", lineHeight: 1.05, fontStyle: "italic" }} className="text-[52px] sm:text-[72px] lg:text-[96px] tracking-tight">
              <span style={{ background: "linear-gradient(135deg, #818cf8 0%, #6366f1 50%, #a78bfa 100%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                Code.
              </span>
            </h1>
          </div>

          <div className={`flex flex-col sm:flex-row sm:items-end justify-between gap-6 md:gap-8 mt-8 md:mt-10 transition-all duration-700 delay-200 ${heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
            <p className="text-[15px] sm:text-[17px] text-white/40 leading-relaxed max-w-md" style={{ fontWeight: 300 }}>
              TokenBridge closes the gap between Figma variables and your codebase. Compare the differences, instant detection, one-click export.
            </p>
            <div className="flex items-center gap-3 flex-shrink-0">
              <button onClick={() => navigate("/app")} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-5 py-2.5 md:px-6 md:py-3 rounded-md transition-all text-[12px] md:text-[13px] active:scale-95" style={{ fontFamily: "'DM Mono', monospace" }}>
                Try it now <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
              <a href="https://github.com/manilka005/tokenbridge" target="_blank" rel="noopener noreferrer"
                className="text-white/40 hover:text-white/70 px-5 py-2.5 md:px-6 md:py-3 transition-all text-[12px] md:text-[13px] flex items-center gap-2 underline underline-offset-4 decoration-white/20 hover:decoration-white/50"
                style={{ fontFamily: "'DM Mono', monospace" }}>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" /></svg>
                GitHub
              </a>
            </div>
          </div>
        </div>

        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2 text-white/20">
          <div className="w-px h-10 bg-gradient-to-b from-transparent via-white/20 to-transparent" style={{ animation: "orb 2s ease-in-out infinite" }} />
        </div>
        <style>{`@keyframes orb { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0.6;transform:scale(1.05)} }`}</style>
      </section>

      {/* PROBLEM */}
      <section className="py-24 md:py-32 px-6 md:px-8" style={{ background: "#f7f6f3" }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <span style={{ fontFamily: "'DM Mono', monospace" }} className="text-[10px] text-indigo-500 uppercase tracking-widest">The problem</span>
          </Reveal>
          <Reveal delay={80} className="mt-3 mb-12 md:mb-16">
            <h2 style={{ fontFamily: "'DM Serif Display', serif", lineHeight: 1.1 }} className="text-[36px] sm:text-[48px] md:text-[60px] text-[#0a0a0b] tracking-tight">
              Design and code speak<br />
              <span style={{ fontStyle: "italic" }} className="text-indigo-500">different languages.</span>
            </h2>
          </Reveal>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6 mb-12 md:mb-16">
            {[
              { label: "Figma says", accent: "#6366f1", tokens: [
                { name: "color/brand", value: "#6366f1", swatch: "#6366f1" },
                { name: "color/surface", value: "#ffffff", swatch: "#ffffff" },
                { name: "space/lg", value: "24px", swatch: null },
                { name: "radius/lg", value: "12px", swatch: null },
              ]},
              { label: "Codebase says", accent: "#d97706", tokens: [
                { name: "--color-brand", value: "#4f46e5", swatch: "#4f46e5" },
                { name: "--color-surface", value: "#f9fafb", swatch: "#f9fafb" },
                { name: "--space-lg", value: "32px", swatch: null },
                { name: "--radius-lg", value: "16px", swatch: null },
              ]},
            ].map(({ label, accent, tokens }, i) => (
              <Reveal key={label} delay={i * 100}>
                <div className="bg-white border border-[#e5e5e5] rounded-2xl p-5 md:p-6 shadow-sm">
                  <div className="flex items-center gap-2 mb-4 md:mb-5">
                    <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: accent }} />
                    <span style={{ fontFamily: "'DM Mono', monospace", color: accent }} className="text-[11px] font-medium uppercase tracking-wider">{label}</span>
                  </div>
                  <div className="space-y-2.5 md:space-y-3">
                    {tokens.map((t) => (
                      <div key={t.name} className="flex items-center justify-between py-1 border-b border-[#f0f0f0] last:border-0">
                        <code style={{ fontFamily: "'DM Mono', monospace" }} className="text-[11px] md:text-[12px] text-[#444]">{t.name}</code>
                        <div className="flex items-center gap-2">
                          {t.swatch && <span className="w-3 h-3 md:w-3.5 md:h-3.5 rounded-sm border border-black/10 flex-shrink-0" style={{ backgroundColor: t.swatch }} />}
                          <code style={{ fontFamily: "'DM Mono', monospace" }} className="text-[11px] md:text-[12px] text-[#999]">{t.value}</code>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </Reveal>
            ))}
          </div>

          <Reveal delay={100}>
            <p className="text-[15px] md:text-[16px] text-[#555] max-w-2xl leading-relaxed">
              When a designer updates a token in Figma, there's no automated way to know what changed, compare it to the codebase, or export the update in the right format. Teams resort to manual comparisons and the product slowly drifts from the designs.
            </p>
          </Reveal>
        </div>
      </section>

      {/* IMPACT */}
      <section className="py-24 md:py-32 px-6 md:px-8 bg-white">
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <span style={{ fontFamily: "'DM Mono', monospace" }} className="text-[10px] text-indigo-500 uppercase tracking-widest">Impact</span>
          </Reveal>
          <Reveal delay={80} className="mt-3 mb-12 md:mb-16">
            <h2 style={{ fontFamily: "'DM Serif Display', serif", lineHeight: 1.1 }} className="text-[36px] sm:text-[48px] md:text-[60px] text-[#0a0a0b] tracking-tight">
              Built to close<span style={{ fontStyle: "italic" }} className="text-indigo-500"> the gap.</span>
            </h2>
          </Reveal>

          
        {/* Stats — horizontal list, no boxes */}
<Reveal delay={60} className="mb-8 md:mb-10">
  <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#2a2a35] border border-[#2a2a35] rounded-lg overflow-hidden">
    {[
      { value: "W3C", label: "Token spec" },
      { value: "3", label: "Export formats" },
      { value: "5", label: "Token types" },
      { value: "O(n)", label: "Diff algorithm" },
    ].map((stat) => (
      <div key={stat.label} className="bg-[#09090f] px-6 py-7 text-center">
        <div style={{ fontFamily: "'DM Serif Display', serif" }} className="text-[32px] md:text-[38px] text-white leading-none mb-2">{stat.value}</div>
        <div style={{ fontFamily: "'DM Mono', monospace" }} className="text-[10px] text-white/40 uppercase tracking-wider leading-snug">{stat.label}</div>
      </div>
    ))}
  </div>
</Reveal>

          {/* Feature cards — all indigo hover */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { tag: "Engineering", title: "React + TypeScript", desc: "Type-safe throughout. Clean component architecture with hooks-only state management — no external state library." },
              { tag: "Algorithm", title: "Visual diff engine", desc: "Map-based token comparison detects added, changed, and removed tokens in O(n) time with color swatch previews." },
              { tag: "Developer XP", title: "Multi-format export", desc: "One token set, three outputs — CSS custom properties, Tailwind config, or a typed JS module. Copy and ship." },
            ].map((item, i) => (
              <Reveal key={item.title} delay={i * 80}>
                <div className="border border-[#e5e5e5] rounded-lg p-5 md:p-6 transition-all duration-200 hover:border-indigo-300 hover:bg-indigo-50/40 group h-full">
                  <span style={{ fontFamily: "'DM Mono', monospace" }} className="text-[10px] uppercase tracking-widest text-indigo-400 group-hover:text-indigo-500 transition-colors">{item.tag}</span>
                  <h3 className="text-[15px] font-semibold text-[#111] mt-2 mb-2">{item.title}</h3>
                  <p className="text-[13px] text-[#777] leading-relaxed">{item.desc}</p>
                </div>
              </Reveal>
              //reviewed and refactored the code, made sure to keep the same structure and styling
            ))}
          </div>
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section className="py-24 md:py-32 px-6 md:px-8" style={{ background: "#f7f6f3" }}>
        <div className="max-w-5xl mx-auto">
          <Reveal>
            <span style={{ fontFamily: "'DM Mono', monospace" }} className="text-[10px] text-indigo-500 uppercase tracking-widest">How it works</span>
          </Reveal>
          <Reveal delay={80} className="mt-3 mb-16 md:mb-20">
            <h2 style={{ fontFamily: "'DM Serif Display', serif", lineHeight: 1.1 }} className="text-[36px] sm:text-[48px] md:text-[60px] text-[#0a0a0b] tracking-tight">
              Three steps.{" "}
              <span style={{ fontStyle: "italic" }} className="text-indigo-500">Zero friction.</span>
            </h2>
          </Reveal>

          <div className="space-y-20 md:space-y-28">
            {[
              { step: "01", title: "Import your token sets", desc: "Paste W3C-format JSON from Figma — exported via Tokens Studio or the Variables to JSON plugin — alongside your codebase tokens. Sample data is preloaded so you can explore immediately.", img: "/import.png", alt: "TokenBridge import view" },
              { step: "02", title: "See exactly what changed", desc: "TokenBridge flattens both sets and runs a map-based diff — instantly surfacing every addition, change, and removal. Color swatches and type badges make it scannable at a glance.", img: "/diff.png", alt: "TokenBridge diff view" },
              { step: "03", title: "Export in your format", desc: "Copy the result as CSS custom properties, a Tailwind config extension, or a typed JS object — ready to paste straight into your codebase.", img: "/export.png", alt: "TokenBridge export view" },
            ].map((item, i) => (
              <Reveal key={item.step} delay={60}>
                <div className={`flex flex-col ${i % 2 === 0 ? "md:flex-row" : "md:flex-row-reverse"} gap-8 md:gap-12 items-center`}>
                  <div className="flex-1 w-full">
                    <div style={{ fontFamily: "'DM Mono', monospace" }} className="text-[10px] text-indigo-400 uppercase tracking-widest mb-3">Step {item.step}</div>
                    <h3 style={{ fontFamily: "'DM Serif Display', serif", lineHeight: 1.2 }} className="text-[24px] md:text-[28px] text-[#0a0a0b] mb-4">{item.title}</h3>
                    <p className="text-[14px] text-[#666] leading-relaxed mb-6">{item.desc}</p>
                    {i === 2 && (
                      <button onClick={() => navigate("/app")} className="text-indigo-500 hover:text-indigo-400 text-[11px] uppercase tracking-widest transition-all flex items-center gap-1 group" style={{ fontFamily: "'DM Mono', monospace" }}>
                        Try it yourself →
                      </button>
                    )}
                  </div>
                  <div className="flex-1 w-full">
                    <div className="rounded-2xl overflow-hidden border border-[#e5e5e5] shadow-xl" style={{ transform: i % 2 === 0 ? "rotate(1deg)" : "rotate(-1deg)" }}>
                      <img src={item.img} alt={item.alt} className="w-full block" loading="lazy" />
                    </div>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA BAND */}
      <section className="bg-[#09090f] py-20 md:py-28 px-6 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8 md:gap-10">
          <Reveal>
            <h2 style={{ fontFamily: "'DM Serif Display', serif", lineHeight: 1.1 }} className="text-[36px] sm:text-[44px] md:text-[52px] text-white tracking-tight">
              Ready to sync<br />
              <span style={{ fontStyle: "italic" }} className="text-indigo-400">your tokens?</span>
            </h2>
          </Reveal>
          <Reveal delay={100}>
            <div className="flex flex-col gap-3">
              <p className="text-[14px] text-white/40 max-w-xs leading-relaxed">No login, no setup. Paste your tokens and see the diff in seconds.</p>
              <button onClick={() => navigate("/app")} className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium px-6 py-3 rounded-md transition-all text-[12px] md:text-[13px] active:scale-95 w-fit" style={{ fontFamily: "'DM Mono', monospace" }}>
                Open TokenBridge <span className="group-hover:translate-x-1 transition-transform">→</span>
              </button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="bg-[#09090f] border-t border-white/[0.05] py-8 md:py-10 px-6 md:px-8">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <span style={{ fontFamily: "'DM Mono', monospace" }} className="text-[11px] text-white/30 text-center sm:text-left">
            TokenBridge — built by{" "}
            <a href="https://manilka.de" target="_blank" rel="noopener noreferrer" className="text-white/50 hover:text-white transition-colors underline underline-offset-2">
              Manilka Kurukulasuriya
            </a>
          </span>
          <div className="flex items-center gap-5 md:gap-6">
            {[
              { label: "Portfolio", href: "https://manilka.de" },
              { label: "GitHub", href: "https://github.com/manilka005/tokenbridge" },
            ].map((link) => (
              <a key={link.label} href={link.href} target="_blank" rel="noopener noreferrer"
                style={{ fontFamily: "'DM Mono', monospace" }} className="text-[11px] text-white/30 hover:text-white/60 transition-colors uppercase tracking-wider">
                {link.label}
              </a>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
