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
    title: "1. Acceptance of Terms",
    body: `By accessing or using IdeaRadar ("the Service"), you agree to be bound by these Terms of Service ("Terms"). If you do not agree to these Terms, please do not use the Service. These Terms constitute a legally binding agreement between you and IdeaRadar.

We reserve the right to update these Terms at any time. Continued use of the Service after any changes constitutes your acceptance of the new Terms. We will notify registered users of material changes via email or an in-app notification.`,
  },
  {
    title: "2. Description of Service",
    body: `IdeaRadar is an AI-powered startup idea discovery platform that:

• Automatically crawls publicly available posts from Reddit (r/SomebodyMakeThis, r/startupideas, and related communities) and Hacker News (Ask HN, Show HN threads) on a daily basis.
• Processes and grades each idea using GPT-4o-mini across four dimensions: demand signal, monetization potential, buildability, and competition gap.
• Presents scored ideas through a searchable, filterable dashboard interface.
• Allows registered users to bookmark, track, and organize ideas.
• Provides trend analytics showing which idea categories are gaining traction over time.

The Service is intended for informational and research purposes. IdeaRadar does not guarantee the viability, legality, or novelty of any idea surfaced on the platform.`,
  },
  {
    title: "3. User Accounts & Registration",
    body: `To access certain features (saving ideas, viewing all grades, trend analytics), you must create an account. You agree to:

• Provide accurate, current, and complete information during registration.
• Maintain and promptly update your account information.
• Keep your password secure and not share it with third parties.
• Notify us immediately of any unauthorized use of your account.
• Accept responsibility for all activities that occur under your account.

You must be at least 16 years of age to create an account. We reserve the right to suspend or terminate accounts that violate these Terms.`,
  },
  {
    title: "4. Subscription Plans",
    body: `IdeaRadar offers the following subscription tiers:

Free Plan: Access to 20 ideas per day, Grade A ideas only, up to 5 saved bookmarks, and basic search functionality. No payment required.

Pro Plan ($15/month or $12/month billed annually): Unlimited ideas, all grades (A–D), unlimited bookmarks, advanced filters, trend analytics, and priority support.

Team Plan ($39/month or $32/month billed annually): Everything in Pro plus up to 5 team seats, shared bookmarks, team annotations, custom alerts, and dedicated support.

Subscription fees are billed in advance. Annual plans are charged as a single payment at the start of the billing period. Prices are subject to change with 30 days' notice to existing subscribers.`,
  },
  {
    title: "5. Acceptable Use",
    body: `You agree not to use IdeaRadar to:

• Scrape, harvest, or systematically extract data from the platform in bulk.
• Attempt to reverse-engineer, decompile, or extract the AI scoring algorithms.
• Use automated bots or scripts to access the Service, other than for personal use.
• Resell, sublicense, or distribute access to the Service without written permission.
• Upload, post, or transmit any content that is unlawful, harmful, or violates the rights of third parties.
• Impersonate another person or entity.
• Interfere with or disrupt the integrity or performance of the Service.
• Attempt to gain unauthorized access to any portion of the Service.

Violation of these restrictions may result in immediate account termination without refund.`,
  },
  {
    title: "6. Intellectual Property",
    body: `IdeaRadar's platform, software, design, logos, and original content are the exclusive property of IdeaRadar and are protected by applicable intellectual property laws.

Content sourced from Reddit and Hacker News remains the property of the original authors and is subject to the terms of those respective platforms. IdeaRadar accesses only publicly available posts and does not claim ownership over third-party content.

AI-generated grades, scores, and summaries produced by IdeaRadar are the property of IdeaRadar. You may not reproduce or distribute these outputs commercially without written consent.

You retain ownership of any ideas or content you create independently. Saving an idea to your IdeaRadar account does not transfer any rights.`,
  },
  {
    title: "7. Disclaimers & Limitation of Liability",
    body: `THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EXPRESS OR IMPLIED. IDEARADAR DOES NOT WARRANT THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR FREE OF VIRUSES.

AI-generated grades and analyses are probabilistic assessments and should not be relied upon as professional business, legal, or financial advice. The quality and accuracy of AI outputs may vary.

TO THE MAXIMUM EXTENT PERMITTED BY LAW, IDEARADAR SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES ARISING FROM YOUR USE OF OR INABILITY TO USE THE SERVICE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGES.

Our total liability to you shall not exceed the amount paid by you to IdeaRadar in the twelve (12) months preceding the claim.`,
  },
  {
    title: "8. Termination",
    body: `Either party may terminate the relationship at any time. You may cancel your account through the Settings page in the application.

IdeaRadar reserves the right to suspend or terminate your account immediately, without prior notice, if you breach these Terms or engage in conduct we determine, in our sole discretion, to be harmful to the Service, other users, or third parties.

Upon termination, your right to use the Service ceases immediately. Saved data may be deleted after a 30-day grace period. We have no obligation to retain your data after account termination.`,
  },
  {
    title: "9. Governing Law",
    body: `These Terms shall be governed by and construed in accordance with applicable law. Any disputes arising under these Terms shall be resolved through binding arbitration, except where prohibited by law. You agree to waive the right to participate in class-action lawsuits.`,
  },
  {
    title: "10. Contact",
    body: `For questions about these Terms of Service, please contact us at:

Email: legal@idearadar.io

We aim to respond to all legal inquiries within 5 business days.`,
  },
];

export default function TermsAndConditions() {
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
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-[1.0625rem] leading-[1.7] max-w-[520px] mx-auto">
            Please read these terms carefully before using IdeaRadar. They govern your access to and use of our platform.
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
