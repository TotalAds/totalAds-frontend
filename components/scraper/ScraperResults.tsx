"use client";

import {
  Brain,
  Building2,
  Clock,
  Contact,
  Download,
  ExternalLink,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import React, { useState } from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { AboutProfilePanel } from "./AboutProfilePanel";
import BusinessIntelPanel from "./panels/BusinessIntelPanel";
import ContactInfoPanel from "./panels/ContactInfoPanel";
import ICPAnalysisPanel from "./panels/ICPAnalysisPanel";
import LinksPanel from "./panels/LinksPanel";
import {
  ContactInfo,
  ExtractedData,
  ScrapeResult,
  SocialPresence,
} from "./utils/scraperTypes";

interface ScraperResultsProps {
  result: ScrapeResult;
}

const ScraperResults: React.FC<ScraperResultsProps> = ({ result }) => {
  const { data, meta } = result;

  // Normalize both the deeply nested shape and the flat legacy shape
  const nestedPayloadData: any =
    (data as any)?.payload?.data?.payload?.data ||
    (data as any)?.payload?.data ||
    null;
  const extractedFromNested: ExtractedData | undefined =
    nestedPayloadData?.extractedData || (data as any)?.extractedData;

  function legacyToExtracted(d: any): ExtractedData {
    if (!d) return {} as any;
    const contactDetails = d.contactDetails || d.company_info?.contact;
    const social = contactDetails?.social_media || {};
    const contactInfo = {
      email: Array.isArray(contactDetails?.email)
        ? contactDetails.email[0]
        : contactDetails?.email,
      phone: Array.isArray(contactDetails?.phone)
        ? contactDetails.phone
        : contactDetails?.phone
        ? [contactDetails.phone]
        : [],
      addresses:
        contactDetails?.addresses ||
        (contactDetails?.address ? [contactDetails.address] : []),
    } as ContactInfo;

    const socialPresence: SocialPresence = {
      linkedin: social.linkedin || social.LinkedIn || "",
      youtube: social.youtube || "",
      facebook: social.facebook || "",
      instagram: social.instagram || "",
      x: social.x || social.twitter || "",
      twitter: social.twitter || "",
    };

    const bi = d.businessIntelligence || undefined;

    return {
      title: d.title,
      description: d.desc || d.description || d.aboutData?.companyDescription,
      nestedLinks: d.nestedLinks || [],
      service: d.service || bi?.keyServices || [],
      companyDescription: d.aboutData?.companyDescription,
      contactInfo,
      companySize: bi?.employeeCount || d.companySize,
      industry: Array.isArray(bi?.industry)
        ? (bi?.industry as string[]).join(", ")
        : d.industry,
      location: d.location,
      revenue: bi?.revenue || d.revenue,
      socialPresence,
      fundingStage: bi?.fundingStage || d.fundingStage,
      businessModel: bi?.businessModel || d.businessModel,
      targetMarket: Array.isArray(bi?.targetMarket)
        ? (bi?.targetMarket as string[]).join(", ")
        : d.targetMarket,
      productType: d.productType,
      monthlyRevenue: d.monthlyRevenue,
      insights: d.insights,
      businessIntelligence: bi,
      actionableRecommendations: d.actionableRecommendations,
      allPagesCorpus: d.allPagesCorpus,
      icpFields: (d as any)?.icpFields || {},
    } as ExtractedData;
  }

  const extractedData: ExtractedData =
    extractedFromNested || legacyToExtracted(data as any);
  const icpScore = nestedPayloadData?.icpScore || (data as any)?.icpScore || 0;
  const icpMatchLevel =
    nestedPayloadData?.icpMatchLevel ||
    (data as any)?.icpMatchLevel ||
    "unknown";
  const icpFields: any = (extractedData as any)?.icpFields || {};

  const isAIEnhanced =
    meta?.aiEnhanced ||
    meta?.icpEnhanced ||
    (data as any)?.payload?.meta?.icpEnhanced ||
    (data as any)?.payload?.data?.meta?.icpEnhanced ||
    (data as any)?.payload?.data?.payload?.meta?.icpEnhanced ||
    ((data as any)?.aiEnhanced ?? false);

  console.log("Full result:", result);
  console.log("Extracted data:", extractedData);
  console.log("ICP Score:", icpScore);
  console.log("ICP Fields:", icpFields);

  // Simplified state for expanded details
  const [showMore, setShowMore] = useState(false);

  return (
    <div className="space-y-6">
      {/* Modern Header with Gradient */}
      <div className="bg-gradient-to-r from-purple-600 via-blue-600 to-indigo-600 rounded-2xl p-6 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold mb-2">
              {extractedData?.title || data?.title || "Company Profile"}
            </h2>
            <p className="text-purple-100 text-lg">
              {extractedData?.description ||
                data?.desc ||
                "Sales Intelligence Report"}
            </p>
          </div>
          {isAIEnhanced && (
            <div className="flex items-center space-x-2">
              <Badge className="bg-white/20 text-white border-white/30 hover:bg-white/30">
                <Brain className="h-4 w-4 mr-2" />
                AI Enhanced
              </Badge>
              {(icpScore > 0 || Object.keys(icpFields).length > 0) && (
                <Badge className="bg-green-500/20 text-green-100 border-green-400/30">
                  <TrendingUp className="h-4 w-4 mr-2" />
                  ICP: {icpScore}%
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Primary summary panels */}
      <AboutProfilePanel
        title={extractedData?.title}
        description={
          extractedData?.description || extractedData?.companyDescription
        }
        about={null}
        businessIntel={extractedData?.businessIntelligence}
      />

      <ContactInfoPanel data={extractedData} />

      {(icpScore > 0 || Object.keys(icpFields).length > 0) && (
        <ICPAnalysisPanel
          score={icpScore}
          matchLevel={icpMatchLevel}
          fields={icpFields}
        />
      )}

      {/* Show more toggle */}
      <div className="flex justify-center">
        <button
          onClick={() => setShowMore((s) => !s)}
          className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl border border-white/20"
        >
          {showMore ? "Hide details" : "Show more details"}
        </button>
      </div>

      {showMore && (
        <>
          <BusinessIntelPanel
            businessIntel={extractedData?.businessIntelligence}
          />

          {Array.isArray(extractedData?.nestedLinks) &&
            extractedData.nestedLinks.length > 0 && (
              <LinksPanel links={extractedData.nestedLinks} />
            )}

          {/* JSON Data Export Card */}
          <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Download className="h-5 w-5 text-white" />
                Extracted Data (Clean JSON)
              </CardTitle>
              <CardDescription className="text-white-200">
                Clean extracted data without nested wrappers - ready for
                frontend integration
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-gray-900 text-green-400 p-4 rounded-lg overflow-auto max-h-[60vh] text-xs font-mono glass-scrollbar">
                <pre>{JSON.stringify(extractedData, null, 2)}</pre>
              </div>
              <div className="mt-4 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">
                  Available Data Fields:
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-blue-800">
                  <div>• Company Info</div>
                  <div>• Contact Details</div>
                  <div>• Business Intelligence</div>
                  <div>• ICP Analysis</div>
                  <div>• Services & Industry</div>
                  <div>• Social Presence</div>
                  <div>• Insights & Recommendations</div>
                  <div>• All Pages Content</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default ScraperResults;
