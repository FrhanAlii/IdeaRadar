import { Link } from "react-router-dom";

const APP_URL = (import.meta.env.VITE_APP_URL as string) || "";

const RadarLogo = ({ size = 18 }: { size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="10" />
    <circle cx="12" cy="12" r="4" />
    <line x1="12" y1="2" x2="12" y2="8" />
    <line x1="12" y1="16" x2="12" y2="22" />
    <line x1="2" y1="12" x2="8" y2="12" />
    <line x1="16" y1="12" x2="22" y2="12" />
  </svg>
);

const sections = [
  {
    title: "1. Overview",
    body: `IdeaRadar ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy explains how we collect, use, disclose, and safeguard your personal information when you use our platform at idearadar.io and the associated web application.

By using IdeaRadar, you consent to the data practices described in this policy. If you do not agree, please discontinue use of the Service.`,
  },
  {
    title: "2. Information We Collect",
    body: `We collect information you provide directly:

• Account Information: Your name, email address, and password when you register.
• Profile Data: Any optional profile details you choose to add.
• Payment Information: Billing details processed securely through our payment provider (Stripe). We do not store full card numbers.
• Communications: Messages you send to our support team.

We collect information automatically when you use the Service:

• Usage Data: Pages visited, features used, ideas viewed or saved, filter queries, and session duration.
• Device & Browser Data: IP address, browser type, operating system, and device identifiers.
• Cookies & Tracking: Session cookies, preference cookies, and analytics tracking (see Section 6).`,
  },
  {
    title: "3. How We Use Your Information",
    body: `We use the information we collect to:

• Provide, operate, and improve the IdeaRadar platform.
• Process your subscription and manage your account.
• Personalize your experience (e.g., remembering your filters and saved ideas).
• Send transactional emails (account confirmation, password reset, billing receipts).
• Send product updates and newsletters if you opt in (you can unsubscribe at any time).
• Monitor and analyze usage patterns to improve features and fix bugs.
• Detect, prevent, and respond to fraud, abuse, and security incidents.
• Comply with legal obligations.

We do not sell your personal information to third parties.`,
  },
  {
    title: "4. Publicly Crawled Content",
    body: `IdeaRadar indexes publicly available posts from Reddit and Hacker News. This content is sourced from public APIs and feeds in accordance with those platforms' terms of service.

Important: We process the text of posts to generate AI-graded summaries, but we do not store the personal information of Reddit or Hacker News users beyond what is necessary to display the idea (e.g., a username as context). We do not build profiles of third-party users from these platforms.

If you are a Reddit or Hacker News author and wish to have your content removed from our index, please contact us at privacy@idearadar.io.`,
  },
  {
    title: "5. AI Processing",
    body: `Idea posts are processed by OpenAI's GPT-4o-mini API to generate quality grades and dimension scores. When we send content to OpenAI for processing, it is subject to OpenAI's privacy and data usage policies.

We do not send your personal account information to OpenAI. Only the text of crawled public posts is processed by the AI model. AI-generated outputs (grades, scores) are stored in our database and displayed on the platform.`,
  },
  {
    title: "6. Cookies & Tracking",
    body: `We use cookies and similar technologies to:

• Maintain your login session.
• Remember your preferences (e.g., filter settings, billing cycle selection).
• Collect anonymous analytics about how the Service is used.

Types of cookies we use:
• Essential cookies: Required for the Service to function (session management, authentication).
• Preference cookies: Remember your settings across visits.
• Analytics cookies: Help us understand usage patterns (e.g., PostHog or similar tools). These do not identify you personally.

You can control cookies through your browser settings. Disabling essential cookies may impair Service functionality.`,
  },
  {
    title: "7. Data Storage & Security",
    body: `Your data is stored securely in Supabase (PostgreSQL), hosted on infrastructure provided by Supabase Inc. Data is stored in secure data centers with encryption at rest and in transit (TLS/SSL).

We implement industry-standard security measures including:
• Encrypted passwords (bcrypt hashing).
• Row-level security (RLS) policies to ensure users can only access their own data.
• Regular security reviews of our infrastructure.

While we take reasonable precautions, no transmission over the internet is 100% secure. We cannot guarantee absolute security.`,
  },
  {
    title: "8. Data Sharing",
    body: `We may share your information with:

• Service Providers: Third-party vendors who help us operate the Service (Supabase for database, Stripe for payments, OpenAI for AI processing, email service providers). These vendors are contractually bound to handle your data securely and only for the purpose we specify.
• Legal Compliance: If required by law, regulation, court order, or government authority.
• Business Transfers: In the event of a merger, acquisition, or sale of assets, your data may be transferred to the acquiring entity.

We do not share your personal data with advertisers or data brokers.`,
  },
  {
    title: "9. Your Rights",
    body: `Depending on your location, you may have the following rights:

• Access: Request a copy of the personal data we hold about you.
• Correction: Request correction of inaccurate or incomplete data.
• Deletion: Request deletion of your account and associated personal data.
• Portability: Request an export of your data in a machine-readable format.
• Objection: Object to certain types of processing (e.g., marketing emails).
• Withdrawal of Consent: Withdraw consent where processing is based on consent.

For EU/EEA residents (GDPR) and California residents (CCPA), you have additional rights under those frameworks.

To exercise any of these rights, contact us at privacy@idearadar.io. We will respond within 30 days.`,
  },
  {
    title: "10. Data Retention",
    body: `We retain your personal data for as long as your account is active or as needed to provide the Service. Specifically:

• Account data: Retained for the duration of your account and up to 30 days after deletion.
• Usage logs: Retained for up to 12 months for analytics and security purposes.
• Billing records: Retained for up to 7 years as required by financial regulations.
• Crawled idea content: Retained indefinitely as part of our idea database (this is public content, not personal data).

You can delete your account at any time from the Settings page. Upon deletion, your personal information will be removed from active systems within 30 days.`,
  },
  {
    title: "11. Contact",
    body: `For privacy-related inquiries, data access requests, or to report a privacy concern, please contact:

Email: privacy@idearadar.io

We aim to respond to all privacy requests within 30 days. For urgent matters, please indicate the urgency in your subject line.`,
  },
];

export default function PrivacyPolicy() {
  return (
    <div className="bg-background text-foreground overflow-x-hidden font-sans antialiased">

      {/* Navbar */}
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
            {[["/#features", "Features"], ["/#how-it-works", "How it works"], ["/#pricing", "Pricing"]].map(([href, label]) => (
              <a key={href} href={href} className="text-sm font-medium text-muted-foreground hover:text-primary transition-colors no-underline">{label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-3">
            <a href={APP_URL + "/signin"} className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-3 py-2 no-underline">
              Log in
            </a>
            <a
              href={APP_URL + "/signup"}
              className="text-sm font-bold text-primary-foreground px-5 py-2 rounded-full transition-all hover:-translate-y-0.5 no-underline"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-light)))", boxShadow: "0 4px 18px hsl(var(--primary) / 0.28)" }}
            >
              Sign up
            </a>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section
        className="relative py-16 px-6 border-b border-border"
        style={{ background: "linear-gradient(135deg, hsl(var(--primary) / 0.08) 0%, hsl(var(--background)) 60%)" }}
      >
        <div className="max-w-3xl mx-auto text-center">
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[0.75rem] font-bold uppercase tracking-wider mb-5"
            style={{ background: "hsl(var(--primary) / 0.1)", border: "1px solid hsl(var(--primary) / 0.2)", color: "hsl(var(--primary-light))" }}
          >
            Legal
          </span>
          <h1 className="text-[clamp(2rem,4vw,3rem)] font-extrabold tracking-[-0.03em] leading-[1.1] mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-[1.0625rem] leading-[1.7] max-w-[520px] mx-auto">
            We take your privacy seriously. This policy explains what data we collect, how we use it, and the choices you have.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Effective date: <strong className="text-foreground">May 13, 2025</strong>
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="py-14 px-6">
        <div className="max-w-3xl mx-auto flex flex-col gap-5">
          {sections.map(({ title, body }) => (
            <div key={title} className="bg-card border border-border rounded-2xl p-8 shadow-card">
              <h2 className="text-[1.0625rem] font-bold mb-4 text-foreground">{title}</h2>
              <div className="text-sm text-muted-foreground leading-[1.8] whitespace-pre-line">{body}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-card border-t border-border pt-14 pb-10 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-3.5">
                <div className="w-8 h-8 rounded-full gradient-primary flex items-center justify-center flex-shrink-0"><RadarLogo size={15} /></div>
                <span className="font-extrabold text-[1rem] text-primary">IdeaRadar</span>
              </div>
              <p className="text-sm text-muted-foreground leading-[1.65] max-w-[200px]">AI-powered startup idea discovery for indie hackers and founders.</p>
            </div>
            <div>
              <div className="text-[0.75rem] font-bold uppercase tracking-[0.08em] text-foreground mb-4">Product</div>
              <div className="flex flex-col gap-2.5">
                {[["/#features", "Features"], ["/#pricing", "Pricing"], ["/#how-it-works", "How it works"]].map(([href, label]) => (
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
