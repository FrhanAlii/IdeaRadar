import { Link } from "react-router-dom";

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
    body: `At IdeaRadar, we want you to be completely satisfied with your subscription. This Refund Policy explains the conditions under which refunds are available for paid plans (Pro and Team).

We offer a 7-day money-back guarantee on all new paid subscriptions. Please read this policy carefully before purchasing.`,
  },
  {
    title: "2. 7-Day Money-Back Guarantee",
    body: `If you are not satisfied with IdeaRadar for any reason, you may request a full refund within 7 days of your first payment on a new subscription.

Conditions:
• The refund window is 7 calendar days from the date of your first paid charge.
• This guarantee applies to first-time subscribers only. It does not apply to renewals, plan upgrades, or re-subscriptions after a previous cancellation.
• To be eligible, your account must not have violated our Terms of Service.
• The guarantee covers both monthly and annual plans when a new subscription is initiated.

How to claim: Email refunds@idearadar.io within the 7-day window with the subject line "Refund Request." No explanation is required, though feedback is appreciated.`,
  },
  {
    title: "3. Annual Plan Refunds",
    body: `For annual subscriptions that have passed the 7-day guarantee window, we offer pro-rated refunds within the first 30 days of the billing period.

Pro-rated calculation: Refund = (Remaining full months in billing period / 12) × Annual price paid.

Example: If you paid $144/year (Pro annual) and cancel after 2 months with a refund request in month 2: Refund = (10/12) × $144 = $120.

After 30 days from the annual billing date, no pro-rated refunds are issued for annual plans. You retain access to the plan until the end of the paid period.`,
  },
  {
    title: "4. Monthly Plan Renewals",
    body: `Monthly subscriptions auto-renew at the start of each billing cycle. We do not issue refunds for monthly renewal charges unless requested within 48 hours of the renewal date.

If you wish to cancel, please do so before your renewal date to avoid being charged for the next month. You can cancel anytime from the Settings page in the application — your access continues until the end of the current billing period.`,
  },
  {
    title: "5. What Is Not Refundable",
    body: `The following are not eligible for refunds:

• Free plan: No payment is collected, so no refund applies.
• Subscriptions that have been suspended or terminated due to Terms of Service violations.
• Partial use of a monthly billing period beyond the 48-hour renewal window.
• Annual subscriptions beyond 30 days from the billing date.
• Add-on charges (if applicable in future pricing).
• Charges resulting from currency conversion or bank fees — these are the responsibility of your financial institution.

We reserve the right to decline refund requests that appear fraudulent or abusive (e.g., repeated subscription + refund cycles).`,
  },
  {
    title: "6. How to Request a Refund",
    body: `To request a refund, please contact us:

Email: refunds@idearadar.io
Subject: Refund Request – [your registered email]

Please include:
• The email address associated with your IdeaRadar account.
• Your subscription plan (Pro or Team).
• The date of the charge you are requesting a refund for.

We aim to confirm receipt of all refund requests within 1 business day.`,
  },
  {
    title: "7. Processing Time",
    body: `Once your refund is approved:

• Credit card refunds: Typically appear within 5–10 business days, depending on your card issuer.
• We will send an email confirmation once the refund has been issued.

If you have not received your refund after 10 business days, please check with your bank first. If the issue persists, contact us at refunds@idearadar.io and we will investigate.`,
  },
  {
    title: "8. Chargebacks",
    body: `We encourage you to contact us before initiating a chargeback with your bank. We can typically resolve billing issues faster than a chargeback dispute process.

Initiating a chargeback without first contacting us may result in suspension of your account. If a chargeback is resolved in your favor, any active subscription will be cancelled.`,
  },
  {
    title: "9. Changes to This Policy",
    body: `We reserve the right to modify this Refund Policy at any time. Changes will be effective immediately upon posting to this page. Existing subscriptions will be honored under the terms in effect at the time of purchase for the remainder of that billing period.`,
  },
  {
    title: "10. Contact",
    body: `For all refund-related inquiries:

Email: refunds@idearadar.io
General support: support@idearadar.io

We aim to respond to all billing inquiries within 2 business days.`,
  },
];

export default function RefundPolicy() {
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
            <Link to="/signin" className="text-sm font-semibold text-foreground hover:text-primary transition-colors px-3 py-2 no-underline">
              Log in
            </Link>
            <Link
              to="/signup"
              className="text-sm font-bold text-primary-foreground px-5 py-2 rounded-full transition-all hover:-translate-y-0.5 no-underline"
              style={{ background: "linear-gradient(135deg, hsl(var(--primary)), hsl(var(--primary-light)))", boxShadow: "0 4px 18px hsl(var(--primary) / 0.28)" }}
            >
              Sign up
            </Link>
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
            Refund Policy
          </h1>
          <p className="text-muted-foreground text-[1.0625rem] leading-[1.7] max-w-[520px] mx-auto">
            We offer a 7-day money-back guarantee. Here's everything you need to know about refunds for IdeaRadar subscriptions.
          </p>
          <p className="text-sm text-muted-foreground mt-4">
            Effective date: <strong className="text-foreground">May 13, 2025</strong>
          </p>
        </div>
      </section>

      {/* Highlight box */}
      <div className="py-6 px-6">
        <div className="max-w-3xl mx-auto">
          <div
            className="rounded-2xl p-6 flex items-start gap-4"
            style={{ background: "hsl(var(--primary) / 0.07)", border: "1px solid hsl(var(--primary) / 0.2)" }}
          >
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
              style={{ background: "hsl(var(--primary) / 0.12)" }}
            >
              🛡️
            </div>
            <div>
              <div className="font-bold text-foreground mb-1">7-Day Money-Back Guarantee</div>
              <p className="text-sm text-muted-foreground leading-[1.7]">
                Not happy? Get a full refund within 7 days of your first charge — no questions asked. Just email{" "}
                <a href="mailto:refunds@idearadar.io" className="text-primary font-semibold no-underline hover:underline">refunds@idearadar.io</a>.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <section className="py-8 px-6 pb-14">
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
