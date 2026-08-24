import type { Metadata } from "next";

// SEO Configuration for LeadSnipper App (mirrors landing page seoConfig structure)
export const seoConfig = {
  baseUrl:
    process.env.NODE_ENV === "production"
      ? "https://app.leadsnipper.com"
      : "http://localhost:3000",

  defaultTitle:
    "LeadSnipper — Cold Email Platform for Deliverability-First Outreach",
  titleTemplate: "%s | LeadSnipper",
  defaultDescription:
    "Send cold email at scale with infrastructure you control. Verify leads, warm up domains, protect sender reputation, and run campaigns on AWS SES, Google Workspace, Microsoft 365, or SMTP.",

  defaultOpenGraph: {
    type: "website",
    locale: "en_US",
    url: "https://app.leadsnipper.com",
    siteName: "LeadSnipper",
    images: [
      {
        url: "https://leadsnipper.com/og-image.png",
        width: 1200,
        height: 630,
        alt: "LeadSnipper — Deliverability-first cold email platform",
      },
    ],
  },

  defaultTwitter: {
    handle: "@leadsnipper_",
    site: "@leadsnipper_",
    cardType: "summary_large_image",
  },

  additionalMetaTags: [
    {
      name: "viewport",
      content: "width=device-width, initial-scale=1.0",
    },
    {
      name: "theme-color",
      content: "#eb857a",
    },
    {
      name: "msapplication-TileColor",
      content: "#eb857a",
    },
    {
      name: "apple-mobile-web-app-capable",
      content: "yes",
    },
    {
      name: "apple-mobile-web-app-status-bar-style",
      content: "default",
    },
    {
      name: "format-detection",
      content: "telephone=no",
    },
  ],

  additionalLinkTags: [
    {
      rel: "icon",
      href: "/favicon.ico",
    },
    {
      rel: "apple-touch-icon",
      href: "/apple-touch-icon.png",
      sizes: "180x180",
    },
    {
      rel: "manifest",
      href: "/site.webmanifest",
    },
  ],
};

export interface PageConfig {
  title: string;
  description: string;
  keywords: string;
  canonical: string;
  noindex?: boolean;
  openGraph?: {
    title: string;
    description: string;
    url: string;
    images?: Array<{
      url: string;
      width: number;
      height: number;
      alt: string;
    }>;
  };
}

export const pageConfigs: Record<string, PageConfig> = {
  login: {
    title: "Log In to LeadSnipper — Cold Email Dashboard",
    description:
      "Sign in to LeadSnipper to manage cold email campaigns, leads, domains, and deliverability.",
    keywords:
      "LeadSnipper login, cold email dashboard, email outreach login",
    canonical: `${seoConfig.baseUrl}/login`,
    openGraph: {
      title: "Log In to LeadSnipper",
      description:
        "Access your cold email campaigns, lead lists, and deliverability dashboard.",
      url: `${seoConfig.baseUrl}/login`,
    },
  },

  signup: {
    title: "Start Free Trial — LeadSnipper Cold Email Platform",
    description:
      "Create your LeadSnipper account and start sending deliverability-first cold email with verification, warmup, and campaign automation. 14-day free trial.",
    keywords:
      "LeadSnipper signup, cold email free trial, email outreach platform, cold email tool signup",
    canonical: `${seoConfig.baseUrl}/signup`,
    openGraph: {
      title: "Start Free Trial — LeadSnipper",
      description:
        "Create your account and start sending cold email with verification, warmup, and campaign automation.",
      url: `${seoConfig.baseUrl}/signup`,
    },
  },

  forgotPassword: {
    title: "Forgot Password — LeadSnipper",
    description: "Reset your LeadSnipper account password.",
    keywords: "LeadSnipper forgot password, reset password",
    canonical: `${seoConfig.baseUrl}/forgot-password`,
    noindex: true,
  },

  resetPassword: {
    title: "Reset Password — LeadSnipper",
    description: "Choose a new password for your LeadSnipper account.",
    keywords: "LeadSnipper reset password",
    canonical: `${seoConfig.baseUrl}/reset-password`,
    noindex: true,
  },

  verifyEmail: {
    title: "Verify Email — LeadSnipper",
    description: "Verify your email address to activate your LeadSnipper account.",
    keywords: "LeadSnipper verify email, email verification",
    canonical: `${seoConfig.baseUrl}/verify-email`,
    noindex: true,
  },

  onboarding: {
    title: "Get Started — LeadSnipper Onboarding",
    description:
      "Complete onboarding to configure your LeadSnipper workspace for cold email outreach.",
    keywords: "LeadSnipper onboarding, cold email setup",
    canonical: `${seoConfig.baseUrl}/onboarding`,
    noindex: true,
  },

  pricing: {
    title: "Pricing — LeadSnipper Cold Email Platform",
    description:
      "LeadSnipper pricing for cold email teams. Starter at ₹999/mo ($19), Growth at ₹2,499/mo ($49), Scale at ₹5,999/mo ($119). Built on AWS SES with mailbox-aware limits.",
    keywords:
      "LeadSnipper pricing, cold email pricing, email outreach cost, AWS SES pricing plan, cold email platform price, mailbox limits",
    canonical: `${seoConfig.baseUrl}/email/pricing`,
    openGraph: {
      title: "LeadSnipper Pricing — Three Plans, Dual INR/USD",
      description:
        "Pick a plan that scales with your outreach. Starter ₹999/mo ($19), Growth ₹2,499/mo ($49), Scale ₹5,999/mo ($119).",
      url: `${seoConfig.baseUrl}/email/pricing`,
    },
  },

  docs: {
    title: "Developer API Documentation — LeadSnipper",
    description:
      "LeadSnipper REST API documentation for campaigns, leads, sending accounts, webhooks, and workspace automation.",
    keywords:
      "LeadSnipper API, cold email API, email automation API, REST API documentation, campaign API",
    canonical: `${seoConfig.baseUrl}/email/docs`,
    openGraph: {
      title: "LeadSnipper Developer API",
      description:
        "REST API for campaigns, leads, sending accounts, webhooks, and workspace automation.",
      url: `${seoConfig.baseUrl}/email/docs`,
    },
  },

  docsReference: {
    title: "API Reference — LeadSnipper Developer Docs",
    description:
      "Complete LeadSnipper API reference with endpoints, request schemas, and response examples.",
    keywords:
      "LeadSnipper API reference, API endpoints, request schema, cold email API docs",
    canonical: `${seoConfig.baseUrl}/email/docs/reference`,
    openGraph: {
      title: "API Reference — LeadSnipper",
      description:
        "Complete API reference with endpoints, schemas, and response examples.",
      url: `${seoConfig.baseUrl}/email/docs/reference`,
    },
  },

  docsWebhooks: {
    title: "Webhooks — LeadSnipper Developer Docs",
    description:
      "Configure LeadSnipper webhooks for campaign events, lead updates, and delivery notifications.",
    keywords:
      "LeadSnipper webhooks, email webhooks, campaign event webhook, delivery notification webhook",
    canonical: `${seoConfig.baseUrl}/email/docs/webhooks`,
    openGraph: {
      title: "Webhooks — LeadSnipper",
      description:
        "Configure webhooks for campaign events, lead updates, and delivery notifications.",
      url: `${seoConfig.baseUrl}/email/docs/webhooks`,
    },
  },

  docsExamples: {
    title: "API Examples — LeadSnipper Developer Docs",
    description:
      "Copy-paste LeadSnipper API examples for common cold email automation workflows.",
    keywords:
      "LeadSnipper API examples, cold email API code, email automation examples",
    canonical: `${seoConfig.baseUrl}/email/docs/examples`,
    openGraph: {
      title: "API Examples — LeadSnipper",
      description:
        "Copy-paste code examples for common cold email automation workflows.",
      url: `${seoConfig.baseUrl}/email/docs/examples`,
    },
  },

  unsubscribe: {
    title: "Unsubscribe — LeadSnipper",
    description: "Unsubscribe from email communications.",
    keywords: "unsubscribe, email opt-out",
    canonical: `${seoConfig.baseUrl}/email/unsubscribe`,
    noindex: true,
  },

  oauthConsent: {
    title: "OAuth Consent — LeadSnipper MCP",
    description: "Authorize third-party access to your LeadSnipper workspace.",
    keywords: "LeadSnipper OAuth, MCP authorization",
    canonical: `${seoConfig.baseUrl}/email/mcp/oauth/consent`,
    noindex: true,
  },

  workspaceInvite: {
    title: "Workspace Invite — LeadSnipper",
    description: "Accept a workspace invitation to join a LeadSnipper team.",
    keywords: "LeadSnipper workspace invite, team invitation",
    canonical: `${seoConfig.baseUrl}/email/workspaces/invite`,
    noindex: true,
  },
};

// Structured data for the app (subset of landing page's structured data)
export const structuredData = {
  softwareApplication: {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "LeadSnipper",
    alternateName: "LeadSnipper Cold Email Platform",
    applicationCategory: "BusinessApplication",
    applicationSubCategory: "Cold Email Software",
    operatingSystem: "Web Browser",
    description:
      "Cold email platform with BYO AWS SES, built-in Reoon email verification, domain health dashboard, AI warmup, and campaign analytics.",
    url: "https://leadsnipper.com",
    downloadUrl: "https://app.leadsnipper.com/signup",
    offers: {
      "@type": "AggregateOffer",
      priceCurrency: "INR",
      lowPrice: "999",
      highPrice: "5999",
      offerCount: "3",
    },
  },
};

// Matches landing page's generateMetaTags() signature
export function generateMetaTags(pageKey: keyof typeof pageConfigs) {
  const config = pageConfigs[pageKey];
  const base = seoConfig;

  return {
    title: config.title,
    description: config.description,
    keywords: config.keywords,
    canonical: config.canonical,
    openGraph: {
      ...base.defaultOpenGraph,
      ...config.openGraph,
    },
    twitter: {
      ...base.defaultTwitter,
      title: config.title,
      description: config.description,
    },
  };
}

// Helper: format title with template (same logic as landing page)
function formatTitle(title: string, skipTemplate?: boolean): string {
  if (skipTemplate) return title;
  if (title.includes("| LeadSnipper")) return title;
  return seoConfig.titleTemplate.replace("%s", title);
}

// Convert pageConfigs into Next.js App Router Metadata (App Router equivalent of <SEO> component)
export function buildMetadata(
  pageKey: keyof typeof pageConfigs,
  options?: { skipTitleTemplate?: boolean }
): Metadata {
  const config = pageConfigs[pageKey];
  const finalTitle = formatTitle(config.title, options?.skipTitleTemplate);
  const finalOgImage =
    config.openGraph?.images?.[0]?.url ||
    seoConfig.defaultOpenGraph.images[0].url;

  const robotsContent = config.noindex
    ? { index: false, follow: false }
    : { index: true, follow: true };

  return {
    title: finalTitle,
    description: config.description,
    keywords: config.keywords,
    metadataBase: new URL(seoConfig.baseUrl),
    alternates: {
      canonical: config.canonical,
    },
    robots: {
      ...robotsContent,
      googleBot: robotsContent,
    },
    openGraph: {
      type: seoConfig.defaultOpenGraph.type as "website",
      locale: seoConfig.defaultOpenGraph.locale,
      siteName: seoConfig.defaultOpenGraph.siteName,
      title: config.openGraph?.title || finalTitle,
      description: config.openGraph?.description || config.description,
      url: config.openGraph?.url || config.canonical,
      images: config.openGraph?.images || seoConfig.defaultOpenGraph.images,
    },
    twitter: {
      card: "summary_large_image",
      site: seoConfig.defaultTwitter.site,
      creator: seoConfig.defaultTwitter.handle,
      title: config.openGraph?.title || finalTitle,
      description: config.openGraph?.description || config.description,
      images: [finalOgImage],
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/site.webmanifest",
    other: {
      "theme-color": "#eb857a",
      "msapplication-TileColor": "#eb857a",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "format-detection": "telephone=no",
    },
  };
}

// Default noindex metadata for auth-gated pages
export function buildDefaultMetadata(): Metadata {
  return {
    title: seoConfig.defaultTitle,
    description: seoConfig.defaultDescription,
    metadataBase: new URL(seoConfig.baseUrl),
    robots: { index: false, follow: false },
    openGraph: {
      type: "website",
      locale: seoConfig.defaultOpenGraph.locale,
      siteName: seoConfig.defaultOpenGraph.siteName,
      title: seoConfig.defaultTitle,
      description: seoConfig.defaultDescription,
      images: seoConfig.defaultOpenGraph.images,
    },
    twitter: {
      card: "summary_large_image",
      site: seoConfig.defaultTwitter.site,
      creator: seoConfig.defaultTwitter.handle,
      title: seoConfig.defaultTitle,
      description: seoConfig.defaultDescription,
      images: [seoConfig.defaultOpenGraph.images[0].url],
    },
    icons: {
      icon: [
        { url: "/favicon.ico" },
        { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
        { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
      ],
      apple: [{ url: "/apple-touch-icon.png", sizes: "180x180" }],
    },
    manifest: "/site.webmanifest",
    other: {
      "theme-color": "#eb857a",
      "msapplication-TileColor": "#eb857a",
      "apple-mobile-web-app-capable": "yes",
      "apple-mobile-web-app-status-bar-style": "default",
      "format-detection": "telephone=no",
    },
  };
}
