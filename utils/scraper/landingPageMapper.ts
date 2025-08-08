import { ScrapeResult } from "@/components/scraper/utils/scraperTypes";

export interface LandingPageData {
  companyName: string;
  description: string;
  website: string;
  location: string;
  email: string;
  phone: string;
  industry: string;
  companySize: string;
  businessModel: string;
  targetMarket: string;
  services: string[];
  socialMedia: {
    linkedin?: string;
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  competitiveAdvantages: string[];
  fundingStage: string;
  revenue: string;
  icpScore: number;
  icpMatchLevel: string;
  timestamp?: string;
}

export const mapToLandingPageData = (result: ScrapeResult): LandingPageData => {
  const data = result?.data || ({} as any);
  const meta = result?.meta || ({} as any);
  const bi = data?.businessIntelligence || ({} as any);

  const services = (bi?.keyServices || data?.service || []) as string[];

  return {
    companyName: data?.title || "Company Name Not Found",
    description: data?.desc || "Description not available",
    website: data?.url || (data?.nestedLinks?.[0] ?? ""),
    location: (data as any)?.location || "",
    email: Array.isArray(data?.contactDetails?.email)
      ? data.contactDetails.email[0] || ""
      : (data?.contactDetails as any)?.email || "",
    phone: Array.isArray(data?.contactDetails?.phone)
      ? data.contactDetails.phone[0] || ""
      : (data?.contactDetails as any)?.phone || "",
    industry: Array.isArray(bi?.industry)
      ? bi.industry.join(", ")
      : (data as any)?.industry || "",
    companySize: (bi as any)?.employeeCount || (data as any)?.companySize || "",
    businessModel: bi?.businessModel || "",
    targetMarket: Array.isArray(bi?.targetMarket)
      ? bi.targetMarket.join(", ")
      : "",
    services: services.slice(0, 8),
    socialMedia: {
      linkedin: (data?.contactDetails as any)?.social_media?.linkedin,
      facebook: (data?.contactDetails as any)?.social_media?.facebook,
      instagram: (data?.contactDetails as any)?.social_media?.instagram,
      twitter:
        (data?.contactDetails as any)?.social_media?.twitter ||
        (data?.contactDetails as any)?.social_media?.x,
    },
    competitiveAdvantages: (bi?.competitiveAdvantages || []).slice(0, 6),
    fundingStage: bi?.fundingStage || "",
    revenue: (bi as any)?.revenue || "",
    icpScore: (data as any)?.icpScore || 0,
    icpMatchLevel: (data as any)?.icpMatchLevel || "",
    timestamp: meta?.timestamp,
  };
};

