import { useNavigate } from "react-router-dom";

interface NavProps {
  dark?: boolean;
}

export default function Nav({ dark = false }: NavProps) {
  const navigate = useNavigate();

  const glassStyle: React.CSSProperties = {
    backdropFilter: "blur(20px) saturate(180%)",
    WebkitBackdropFilter: "blur(20px) saturate(180%)",
    backgroundColor: dark ? "rgba(20,18,35,0.75)" : "rgba(247,246,243,0.85)",
    borderBottom: dark ? "1px solid rgba(255,255,255,0.12)" : "1px solid rgba(0,0,0,0.06)",
    boxShadow: dark ? "0 1px 40px rgba(0,0,0,0.4)" : "0 1px 20px rgba(0,0,0,0.06)",
  };

  const textPrimary = dark ? "text-white font-bold" : "text-[#111]";
  const textMuted = dark ? "text-white/60 hover:text-white" : "text-[#999] hover:text-[#111]";
  const ctaBg = "bg-indigo-600 hover:bg-indigo-500";

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-500"
      style={{ ...glassStyle, fontFamily: "'DM Mono', monospace" }}
    >
      <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
        {/* Wordmark */}
        <button
          onClick={() => navigate("/")}
          className={`text-[14px] font-semibold tracking-tight transition-colors ${textPrimary}`}
          style={{ fontFamily: "'DM Serif Display', serif" }}
        >
          TokenBridge
        </button>

        {/* Desktop links */}
        <div className="hidden md:flex items-center gap-7">
          <button onClick={() => navigate("/")} className={`text-[11px] uppercase tracking-widest transition-colors ${textMuted}`}>
            Overview
          </button>
          
          <a
            href="https://manilka.de"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[11px] uppercase tracking-widest transition-colors ${textMuted}`}
          >
            manilka.de
          </a>
          <a
            href="https://github.com/manilka005/tokenbridge"
            target="_blank"
            rel="noopener noreferrer"
            className={`text-[11px] uppercase tracking-widest transition-colors flex items-center gap-1.5 ${textMuted}`}
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z" />
            </svg>
            GitHub
          </a>
          <button
            onClick={() => navigate("/app")}
            className={`${ctaBg} text-white text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-md transition-colors`}
          >
            Try it →
          </button>
        </div>

        {/* Mobile: CTA only */}
        <div className="flex md:hidden items-center gap-3">
          <button
            onClick={() => navigate("/app")}
            className={`${ctaBg} text-white text-[11px] uppercase tracking-widest px-4 py-1.5 rounded-md transition-colors`}
          >
            Try it →
          </button>
        </div>
      </div>
    </nav>
  );
}
