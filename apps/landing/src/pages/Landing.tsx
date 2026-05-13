import { useState } from "react";
import { Link } from "react-router-dom";

const APP_URL = import.meta.env.VITE_APP_URL ?? "";

const RadarLogo = ({ size = 18 }: { size?: number }) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    stroke="white"
    strokeWidth="2.5"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="8" />
    <line x1="12" y1="16" x2="12" y2="22" />
    <line x1="2" y1="12" x2="8" y2="12" />
    <line x1="16" y1="12" x2="22" y2="12" />
  </svg>
);

const CheckIcon = () => (
  <svg
    width="15"
    height="15"
    viewBox="0 0 24 24"
    fill="none"
    className="flex-shrink-0 mt-0.5"
  >
    <path
      d="M20 6L9 17l-5-5"
      stroke="hsl(var(--success))"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const _r1 = ["📡", "🤖", "💡", "🔖", "📊", "🔍", "⚡", "🚀", "🌱", "💰", "🎯", "🔬", "📈", "🌐", "🛠️", "🧩"];
const _r2 = ["🧠", "💡", "📡", "🔗", "📱", "🌍", "💎", "🏗️", "⚙️", "🎨", "📦", "🔒", "🌿", "⭐", "💬", "🔔"];
const _r3 = ["🤝", "🌟", "🔭", "🧪", "📌", "🏆", "🌊", "🔑", "💻", "🎯", "📣", "🌺", "🏄", "⚗️", "🗺️", "🔮"];
const ICON_ROWS = [
  [..._r1, ..._r1, ..._r1], [..._r2, ..._r2, ..._r2], [..._r3, ..._r3, ..._r3],
  [..._r1, ..._r1, ..._r1], [..._r2, ..._r2, ..._r2], [..._r3, ..._r3, ..._r3],
];

const pricing = {
  monthly: { pro: "$15", proPlus: "$29" },
  annual: { pro: "$12", proPlus: "$24" },
};

export default function Landing() {
  const [cycle, setCycle] = useState<"monthly" | "annual">("monthly");
  const [imgError, setImgError] = useState(false);

  return (
    <div className="bg-background text-foreground overflow-x-hidden font-sans antialiased">

      {/* ── Hero gradient overlay ── */}
      <div
        aria-hidden
        className="fixed inset-0 pointer-events-none z-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 50% at 50% -5%, hsl(153 55% 45% / 0.22) 0%, transparent 60%)",
        }}
      />

      {/* ════════════════ NAVBAR ════════════════ */}
      <header
        className="sticky top-0 z-50 border-b border-border"
        style={{ background: "hsl(var(--background) / 0.88)", backdropFilter: "blur(12px)" }}
      >
        <div className="max-w-6xl mx-auto px-6 h-[60px] flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5 no-underline">
            <div className="w-9 h-9 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
              <RadarLogo size={18} />
            </div>
            <span className="text-lg font-bold text-primary">IdeaRadar</span>
          </Link>

          <nav className="hidden md:flex items-center gap-8">
            {[["#features", "Features"], ["#how-it-works", "How it works"], ["#pricing", "Pricing"]].map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors no-underline">
                {label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a
              href={APP_URL + "/signin"}
              target="_self"
              className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-3 py-2 no-underline"
            >
              Log in
            </a>
            <a
              href={APP_URL + "/signup"}
              target="_self"
              className="text-sm font-bold text-primary-foreground px-5 py-2 rounded-full transition-all hover:-translate-y-0.5 no-underline"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-light)))",
                boxShadow: "0 4px 18px hsl(var(--primary) / 0.28)",
              }}
            >
              Sign up
            </a>
          </div>
        </div>
      </header>

      {/* ════════════════ HERO ════════════════ */}
      <section className="relative z-10 pt-20 pb-16 px-6">
        <div className="max-w-6xl mx-auto">

          <div className="flex justify-center mb-7">
            <span
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[13px] font-semibold"
              style={{
                background: "hsl(var(--primary) / 0.08)",
                border: "1px solid hsl(var(--primary) / 0.25)",
                color: "hsl(var(--primary-light))",
              }}
            >
              <span
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "hsl(var(--success))" }}
              />
              Introducing IdeaRadar v2.0 — now with AI grading
            </span>
          </div>

          <h1 className="text-[clamp(2.5rem,5.5vw,4rem)] font-extrabold text-center leading-[1.08] tracking-[-0.04em] max-w-[780px] mx-auto mb-6">
            The new way to discover{" "}
            <span
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--success)))",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              startup ideas worth building.
            </span>
          </h1>

          <p className="text-[1.0625rem] text-muted-foreground text-center max-w-[520px] mx-auto mb-10 leading-[1.7]">
            IdeaRadar crawls Reddit &amp; Hacker News daily, scores every post with AI, and surfaces the
            highest-demand ideas — so you can stop searching and start building.
          </p>

          <div className="flex justify-center gap-4 flex-wrap mb-16">
            <a
              href={APP_URL + "/signup"}
              target="_self"
              className="inline-flex items-center gap-2 font-bold text-[1rem] text-primary-foreground px-8 py-3.5 rounded-full no-underline transition-all hover:-translate-y-0.5"
              style={{
                background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-light)))",
                boxShadow: "0 4px 22px hsl(var(--primary) / 0.32), 0 1px 3px hsl(0 0% 0% / 0.1)",
              }}
            >
              Get started for free →
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-2 font-semibold text-[1rem] text-primary px-7 py-3.5 rounded-full no-underline bg-card border border-border shadow-card hover:shadow-elevated transition-all hover:-translate-y-0.5"
            >
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <circle cx="12" cy="12" r="10" />
                <polygon points="10,8 16,12 10,16" />
              </svg>
              See how it works
            </a>
          </div>

          {/* Dashboard screenshot mockup */}
          <div
            className="max-w-[900px] mx-auto rounded-2xl overflow-hidden shadow-card hover:shadow-elevated transition-all duration-150"
            style={{ border: "1px solid hsl(var(--border))" }}
          >
            <div
              className="flex items-center gap-1.5 px-3.5 py-2.5 border-b border-border"
              style={{ background: "hsl(var(--card))" }}
            >
              <span className="w-2.5 h-2.5 rounded-full bg-[#fe5f57] flex-shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#febc2e] flex-shrink-0" />
              <span className="w-2.5 h-2.5 rounded-full bg-[#28c840] flex-shrink-0" />
              <span className="flex-1 text-center text-xs text-muted-foreground font-mono">
                app.idearadar.io/dashboard
              </span>
            </div>

            {!imgError ? (
              <img
                src="/dashboard-preview.png"
                alt="IdeaRadar dashboard — idea feed with AI grades"
                className="w-full block"
                onError={() => setImgError(true)}
              />
            ) : (
              <div className="bg-background p-6 min-h-[320px] flex items-center justify-center">
                <div className="text-center text-muted-foreground">
                  <div className="w-16 h-16 rounded-full gradient-primary flex items-center justify-center mx-auto mb-4">
                    <RadarLogo size={28} />
                  </div>
                  <p className="text-sm font-semibold">Dashboard Preview</p>
                  <p className="text-xs mt-1 opacity-60">
                    Save your screenshot to<br />
                    <code className="font-mono">apps/landing/public/dashboard-preview.png</code>
                  </p>
                </div>
              </div>
            )}
          </div>

        </div>
      </section>

      {/* ════════════════ STATS ════════════════ */}
      <section className="relative z-10 py-14 px-6 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto">
          <p className="text-center text-[0.75rem] font-bold uppercase tracking-[0.1em] text-muted-foreground mb-8">
            TRUSTED BY FOUNDERS FROM AROUND THE WORLD
          </p>

          <div className="flex justify-center items-center gap-10 flex-wrap mb-10 opacity-60">
            {[
              { color: "#ff4500", label: "Reddit", path: "M12 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0zm5.01 4.744c.688 0 1.25.561 1.25 1.249a1.25 1.25 0 0 1-2.498.056l-2.597-.547-.8 3.747c1.824.07 3.48.632 4.674 1.488.308-.309.73-.491 1.207-.491.968 0 1.754.786 1.754 1.754 0 .716-.435 1.333-1.01 1.614a3.111 3.111 0 0 1 .042.52c0 2.694-3.13 4.87-7.004 4.87-3.874 0-7.004-2.176-7.004-4.87 0-.183.015-.366.043-.534A1.748 1.748 0 0 1 4.028 12c0-.968.786-1.754 1.754-1.754.463 0 .898.196 1.207.49 1.207-.883 2.878-1.43 4.744-1.487l.885-4.182a.342.342 0 0 1 .14-.197.35.35 0 0 1 .238-.042l2.906.617a1.214 1.214 0 0 1 1.108-.701zM9.25 12C8.561 12 8 12.562 8 13.25c0 .687.561 1.248 1.25 1.248.687 0 1.248-.561 1.248-1.249 0-.688-.561-1.249-1.249-1.249zm5.5 0c-.687 0-1.248.561-1.248 1.25 0 .687.561 1.248 1.249 1.248.688 0 1.249-.561 1.249-1.249 0-.687-.562-1.249-1.25-1.249zm-5.466 3.99a.327.327 0 0 0-.231.094.33.33 0 0 0 0 .463c.842.842 2.484.913 2.961.913.477 0 2.105-.056 2.961-.913a.361.361 0 0 0 .029-.463.33.33 0 0 0-.464 0c-.547.533-1.684.73-2.512.73-.828 0-1.979-.196-2.512-.73a.326.326 0 0 0-.232-.095z" },
              { color: "#f97316", label: "Hacker News", path: "M0 24l2.635-9.686C1.006 11.498.596 8.58 1.94 6.017 4.08 2.069 8.922.203 13.217 1.793c4.295 1.59 6.645 6.213 5.339 10.626-1.306 4.413-5.89 7.118-10.428 6.198L0 24zm7.388-4.642c.286.078 1.68.407 2.86.279 3.337-.367 5.893-3.161 5.842-6.516-.049-3.257-2.542-5.965-5.793-6.262-3.252-.297-6.208 1.918-6.826 5.128-.417 2.174.234 4.28 1.726 5.791l-.455 1.672 2.646-.092z" },
              { color: "#4285f4", label: "Google Trends", path: "M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z" },
              { color: "#DA552F", label: "Product Hunt", path: "M0 12C0 5.373 5.373 0 12 0s12 5.373 12 12-5.373 12-12 12S0 18.627 0 12zm13.5-4.5h-3v9h1.5v-3h1.5a3 3 0 0 0 0-6zm0 4.5h-1.5V9H13.5a1.5 1.5 0 0 1 0 3z" },
              { color: "#555", label: "App Store", path: "M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" },
            ].map(({ color, label, path }) => (
              <div key={label} className="flex items-center gap-2 font-bold text-foreground">
                <svg width="22" height="22" viewBox="0 0 24 24" fill={color}><path d={path} /></svg>
                {label}
              </div>
            ))}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              ["2,400+", "Ideas indexed daily"],
              ["A–D", "AI quality grades"],
              ["4", "Scoring dimensions"],
              ["24h", "Fresh data refresh"],
            ].map(([num, label]) => (
              <div key={label} className="bg-card border border-border rounded-2xl py-5 px-6 text-center shadow-card">
                <div
                  className="text-[2rem] font-extrabold leading-none mb-1"
                  style={{
                    background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--success)))",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  {num}
                </div>
                <div className="text-sm text-muted-foreground">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ════════════════ FEATURES ════════════════ */}
      <section id="features" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-primary block mb-3">Features</span>
            <h2 className="text-[clamp(1.875rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.03em] leading-[1.15] mb-4">
              Everything you need to find<br />your next big idea
            </h2>
            <p className="text-[1.0625rem] text-muted-foreground max-w-[460px] mx-auto leading-[1.65]">
              Stop scrolling through noise. IdeaRadar does the heavy lifting so you can focus on validation and execution.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {[
              { icon: "📡", title: "Daily automated crawls", body: "Fresh ideas from r/SomebodyMakeThis, r/startupideas, and Hacker News Ask/Show HN — scored overnight while you sleep." },
              { icon: "🤖", title: "AI-graded A–D", body: "GPT-4o-mini evaluates demand signal, monetization potential, buildability, and competition gap for every post." },
              { icon: "🔖", title: "Save your shortlist", body: "Bookmark the ideas you love and track trends over time — your personal idea deal-flow, curated for you." },
              { icon: "📊", title: "Trend analytics", body: "See which categories are heating up, track idea volume over time, and spot emerging patterns before the crowd." },
              { icon: "🔍", title: "Advanced filtering", body: "Filter by grade, source, date, or keyword. Surface exactly the caliber of ideas you want to explore today." },
              { icon: "⚡", title: "Real-time scoring", body: "Ideas are scored across four dimensions in seconds. You see the full breakdown — not just a number, but the why." },
            ].map(({ icon, title, body }) => (
              <div
                key={title}
                className="bg-card border border-border rounded-2xl p-7 shadow-card hover:shadow-elevated transition-all duration-150 hover:-translate-y-1"
              >
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center text-[1.375rem] mb-4"
                  style={{
                    background: "hsl(var(--primary) / 0.08)",
                    border: "1px solid hsl(var(--primary) / 0.18)",
                  }}
                >
                  {icon}
                </div>
                <h3 className="font-bold text-[1.0625rem] mb-2">{title}</h3>
                <p className="text-sm text-muted-foreground leading-[1.65]">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div aria-hidden className="h-px mx-6" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)" }} />

      {/* ════════════════ HOW IT WORKS ════════════════ */}
      <section id="how-it-works" className="relative z-10 py-20 px-6 bg-card border-y border-border">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-primary block mb-3">How it works</span>
            <h2 className="text-[clamp(1.875rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.03em] leading-[1.15]">
              From the internet to your dashboard<br />in three steps
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10 max-w-[900px] mx-auto">
            {[
              {
                n: "1", title: "Automated crawling",
                preview: <><div className="text-sm text-muted-foreground font-mono">Crawling Reddit &amp; HN…</div><div className="text-[0.8125rem] font-mono mt-1" style={{ color: "hsl(var(--success))" }}>✓ 2,418 posts found</div></>,
                body: "Our bots scan Reddit and Hacker News every 24 hours, pulling fresh posts from the most idea-rich communities on the internet.",
              },
              {
                n: "2", title: "AI scoring",
                preview: (
                  <div>
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="inline-flex items-center justify-center w-5 h-5 rounded-md text-[0.625rem] font-extrabold font-mono" style={{ background: "hsl(var(--success) / 0.15)", color: "hsl(var(--success))" }}>A</span>
                      <span className="text-xs text-foreground font-mono">Score: 9.2 / 10</span>
                    </div>
                    <div className="text-xs text-muted-foreground">Demand ★★★★★ · Buildability ★★★★☆</div>
                  </div>
                ),
                body: "GPT-4o-mini grades each idea across demand signal, monetization potential, buildability, and competition gap — instantly.",
              },
              {
                n: "3", title: "Browse & save",
                preview: (
                  <div>
                    <div className="text-xs font-semibold text-foreground mb-1.5">Your saved ideas (3)</div>
                    <div className="text-xs text-muted-foreground mb-0.5">🔖 AI meal planner</div>
                    <div className="text-xs text-muted-foreground">🔖 Feedback SaaS for founders</div>
                  </div>
                ),
                body: "Filter, explore, and bookmark the best ideas. Build your personal shortlist and never lose track of an opportunity again.",
              },
            ].map(({ n, title, preview, body }) => (
              <div key={n} className="flex flex-col gap-4">
                <div
                  className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-extrabold text-primary-foreground flex-shrink-0"
                  style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-light)))" }}
                >
                  {n}
                </div>
                <div className="rounded-xl p-4" style={{ background: "hsl(var(--primary) / 0.06)", border: "1px solid hsl(var(--primary) / 0.14)" }}>
                  {preview}
                </div>
                <h3 className="font-bold text-[1.0625rem]">{title}</h3>
                <p className="text-sm text-muted-foreground leading-[1.65] -mt-2">{body}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div aria-hidden className="h-px mx-6" style={{ background: "linear-gradient(90deg, transparent, hsl(var(--primary) / 0.3), transparent)" }} />

      {/* ════════════════ PRICING ════════════════ */}
      <section id="pricing" className="relative z-10 py-20 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-14">
            <span className="text-[0.75rem] font-bold uppercase tracking-[0.1em] text-primary block mb-3">Pricing</span>
            <h2 className="text-[clamp(1.875rem,3.5vw,2.75rem)] font-extrabold tracking-[-0.03em] leading-[1.15] mb-4">
              Simple pricing for everyone.
            </h2>
            <p className="text-[1.0625rem] text-muted-foreground max-w-[460px] mx-auto mb-8 leading-[1.65]">
              Choose an <strong className="text-foreground">affordable plan</strong> packed with the best features
              for discovering ideas and shipping faster.
            </p>

            <div className="flex items-center justify-center gap-3">
              <div className="inline-flex items-center rounded-full p-1 border border-border" style={{ background: "hsl(var(--secondary))" }}>
                {(["monthly", "annual"] as const).map((c) => (
                  <button
                    key={c}
                    onClick={() => setCycle(c)}
                    className={`px-4 py-1.5 rounded-full text-[0.8125rem] font-semibold capitalize transition-all cursor-pointer border-0 ${
                      cycle === c ? "bg-card text-foreground shadow-card" : "text-muted-foreground bg-transparent"
                    }`}
                  >
                    {c}
                  </button>
                ))}
              </div>
              <span
                className="text-[0.6875rem] font-bold px-2.5 py-1 rounded-full"
                style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.25)", color: "hsl(var(--primary-light))" }}
              >
                2 MONTHS FREE
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 max-w-[900px] mx-auto items-start">
            {/* Free */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-card hover:-translate-y-1 transition-all duration-150">
              <div className="font-bold text-[1rem] mb-1">Free</div>
              <div className="text-sm text-muted-foreground mb-5">For explorers</div>
              <div className="mb-6">
                <span className="text-[2.5rem] font-extrabold leading-none">$0</span>
                <span className="text-sm text-muted-foreground font-medium"> / month</span>
              </div>
              <a href={APP_URL + "/signup"} target="_self" className="flex justify-center text-sm font-semibold text-primary py-2.5 px-4 rounded-full border border-border bg-card shadow-card hover:shadow-elevated transition-all no-underline mb-6">
                Get started
              </a>
              <div className="flex flex-col gap-2.5">
                {["6 ideas / crawl", "2 crawls / day", "Upgrade anytime", "Basic search", "Reddit, HN & Google Trends"].map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm text-foreground"><CheckIcon />{f}</div>
                ))}
              </div>
            </div>

            {/* Pro */}
            <div
              className="bg-card rounded-2xl p-8 hover:-translate-y-1 transition-all duration-150 relative"
              style={{
                border: "1px solid hsl(var(--success))",
                boxShadow: "0 0 0 1px hsl(var(--success)), 0 16px 48px hsl(var(--success) / 0.12)",
                background: "linear-gradient(160deg, hsl(var(--primary) / 0.03) 0%, hsl(var(--card)) 60%)",
              }}
            >
              <span
                className="absolute -top-3.5 left-1/2 -translate-x-1/2 text-[0.6875rem] font-bold uppercase tracking-wider text-primary-foreground px-4 py-1 rounded-full whitespace-nowrap"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-light)))" }}
              >
                MOST POPULAR
              </span>
              <div className="font-bold text-[1rem] mb-1">Pro</div>
              <div className="text-sm text-muted-foreground mb-5">For serious builders</div>
              <div className="mb-6">
                <span className="text-[2.5rem] font-extrabold leading-none">{pricing[cycle].pro}</span>
                <span className="text-sm text-muted-foreground font-medium"> / month</span>
              </div>
              <a
                href={APP_URL + "/signup"}
                target="_self"
                className="flex justify-center text-sm font-bold text-primary-foreground py-2.5 px-4 rounded-full transition-all no-underline mb-6"
                style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-light)))", boxShadow: "0 4px 18px hsl(var(--primary) / 0.28)" }}
              >
                Subscribe
              </a>
              <div className="flex flex-col gap-2.5">
                {["Everything in Free", "~25 ideas / crawl", "5 crawls / day", "All grades (A–D)", "Unlimited bookmarks", "Grade, source & date filters", "+ Product Hunt source"].map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm text-foreground"><CheckIcon />{f}</div>
                ))}
              </div>
            </div>

            {/* Pro Plus */}
            <div className="bg-card border border-border rounded-2xl p-8 shadow-card hover:-translate-y-1 transition-all duration-150">
              <div className="font-bold text-[1rem] mb-1">Pro Plus</div>
              <div className="text-sm text-muted-foreground mb-5">For power users</div>
              <div className="mb-6">
                <span className="text-[2.5rem] font-extrabold leading-none">{pricing[cycle].proPlus}</span>
                <span className="text-sm text-muted-foreground font-medium"> / month</span>
              </div>
              <a href={APP_URL + "/signup"} target="_self" className="flex justify-center text-sm font-semibold text-primary py-2.5 px-4 rounded-full border border-border bg-card shadow-card hover:shadow-elevated transition-all no-underline mb-6">
                Subscribe
              </a>
              <div className="flex flex-col gap-2.5">
                {["Everything in Pro", "Unlimited crawls / day", "60 ideas / crawl", "Unlimited bookmarks", "All grades (A–D)", "Priority support", "+ Play Store & App Store"].map(f => (
                  <div key={f} className="flex items-start gap-2 text-sm text-foreground"><CheckIcon />{f}</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ════════════════ ICON GRID CTA ════════════════ */}
      <section
        className="relative z-10 py-24 px-6 overflow-hidden border-t border-border"
        style={{
          background: `
            radial-gradient(ellipse 70% 60% at 50% 0%, hsl(var(--primary) / 0.18) 0%, transparent 65%),
            radial-gradient(ellipse 50% 45% at 50% 100%, hsl(var(--primary) / 0.1) 0%, transparent 65%),
            hsl(var(--background))
          `,
        }}
      >
        <div aria-hidden className="absolute inset-0 flex flex-col pointer-events-none opacity-35">
          {ICON_ROWS.map((row, i) => (
            <div key={i} className="flex-1 flex gap-2.5 items-center justify-center overflow-hidden">
              {row.map((icon, j) => (
                <div
                  key={j}
                  className="w-[52px] h-[52px] flex-shrink-0 rounded-xl flex items-center justify-center text-xl bg-card shadow-card"
                  style={{ border: "1px solid hsl(var(--border))" }}
                >
                  {icon}
                </div>
              ))}
            </div>
          ))}
        </div>

        <div className="relative z-10 text-center">
          <div className="flex justify-center mb-6">
            <div
              className="w-[72px] h-[72px] rounded-[20px] bg-card flex items-center justify-center shadow-elevated"
              style={{ border: "1px solid hsl(var(--border))" }}
            >
              <div className="w-11 h-11 rounded-full gradient-primary flex items-center justify-center">
                <RadarLogo size={22} />
              </div>
            </div>
          </div>

          <h2 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.04em] leading-[1.08] mb-3">
            Stop wasting time on research.
          </h2>
          <p className="text-[1.0625rem] text-muted-foreground mb-9">
            Start your 7-day free trial. No credit card required.
          </p>
          <a
            href={APP_URL + "/signup"}
            target="_self"
            className="inline-flex items-center gap-2 text-[1.0625rem] font-bold text-primary-foreground px-9 py-3.5 rounded-full no-underline transition-all hover:-translate-y-0.5"
            style={{
              background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-light)))",
              boxShadow: "0 4px 24px hsl(var(--primary) / 0.3), 0 1px 4px hsl(0 0% 0% / 0.1)",
            }}
          >
            Get started →
          </a>
        </div>
      </section>

      {/* ════════════════ FOOTER ════════════════ */}
      <footer className="relative z-10 bg-card border-t border-border pt-14 pb-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3.5">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0">
                  <RadarLogo size={15} />
                </div>
                <span className="font-extrabold text-[1rem] text-primary">IdeaRadar</span>
              </div>
              <p className="text-sm text-muted-foreground leading-[1.65] max-w-[200px]">
                AI-powered startup idea discovery for indie hackers and founders.
              </p>
            </div>

            <div>
              <div className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-foreground mb-4">Product</div>
              <div className="flex flex-col gap-2.5">
                {[["#features", "Features"], ["#pricing", "Pricing"], ["#how-it-works", "How it works"]].map(([href, label]) => (
                  <a key={label} href={href} className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">{label}</a>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-foreground mb-4">Community</div>
              <div className="flex flex-col gap-2.5">
                {[["https://discord.gg/idearadar", "Discord"], ["https://twitter.com/idearadar", "Twitter / X"], ["https://github.com/idearadar", "GitHub"]].map(([href, label]) => (
                  <a key={label} href={href} className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">{label}</a>
                ))}
              </div>
            </div>

            <div>
              <div className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-foreground mb-4">Legal</div>
              <div className="flex flex-col gap-2.5">
                <Link to="/terms" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Terms of Service</Link>
                <Link to="/privacy" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Privacy Policy</Link>
                <Link to="/refund" className="text-sm text-muted-foreground hover:text-primary transition-colors no-underline">Refund Policy</Link>
              </div>
            </div>
          </div>

          <div className="flex items-center justify-between flex-wrap gap-3 pt-8 border-t border-border text-[0.8125rem] text-muted-foreground">
            <span>Copyright © 2025 IdeaRadar. All Rights Reserved.</span>
            <span>No credit card required · Ideas refresh every 24 hours</span>
          </div>
        </div>
      </footer>

    </div>
  );
}
