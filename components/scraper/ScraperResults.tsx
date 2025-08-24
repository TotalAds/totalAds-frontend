"use client";

import {
    Brain, Building2, Clock, Contact, Download, ExternalLink, Shield, TrendingUp, Users, Zap
} from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import { AboutProfilePanel } from './AboutProfilePanel';
import { ContactInfo, ExtractedData, ScrapeResult, SocialPresence } from './utils/scraperTypes';

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

  // Helper functions for rendering different sections
  function renderAboutInfo(data: ExtractedData) {
    return (
      <AboutProfilePanel
        title={data?.title}
        description={data?.description || data?.companyDescription}
        about={null}
        businessIntel={data?.businessIntelligence}
      />
    );
  }

  function renderContactInfo(data: ExtractedData) {
    const contact = data?.contactInfo;
    const socialPresence = data?.socialPresence || {};

    if (!contact && !Object.values(socialPresence).some(Boolean)) {
      return (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">
              No contact information found.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Contact Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Contact className="h-5 w-5 text-blue-600" />
              Contact Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {contact?.email && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Email</h4>
                <a
                  href={`mailto:${contact.email}`}
                  className="text-blue-600 hover:underline"
                >
                  {contact.email}
                </a>
              </div>
            )}

            {contact?.phone && contact.phone.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Phone</h4>
                {contact.phone.map((phone: string, index: number) => (
                  <a
                    key={index}
                    href={`tel:${phone}`}
                    className="text-blue-600 hover:underline block"
                  >
                    {phone}
                  </a>
                ))}
              </div>
            )}

            {contact?.addresses && contact.addresses.length > 0 && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Address</h4>
                {contact.addresses.map((address: string, index: number) => (
                  <p key={index} className="text-gray-700">
                    {address}
                  </p>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Social Media */}
        {Object.values(socialPresence).some(Boolean) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-purple-600" />
                Social Media
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {Object.entries(socialPresence).map(
                ([platform, url]: [string, any]) =>
                  url ? (
                    <a
                      key={platform}
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-blue-600 hover:underline"
                    >
                      <ExternalLink className="h-4 w-4" />
                      {platform.charAt(0).toUpperCase() + platform.slice(1)}
                    </a>
                  ) : null
              )}
            </CardContent>
          </Card>
        )}
      </div>
    );
  }

  function renderICPAnalysis(score: number, matchLevel: string, fields: any) {
    return (
      <>
        {/* ICP Score Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6 text-center">
              <div
                className={`text-4xl font-bold mb-2 ${
                  score >= 80
                    ? "text-green-600"
                    : score >= 60
                    ? "text-yellow-600"
                    : score >= 40
                    ? "text-orange-600"
                    : "text-red-600"
                }`}
              >
                {score}%
              </div>
              <p className="text-sm text-gray-600">ICP Match Score</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div
                className={`inline-flex px-3 py-1 rounded-full text-sm font-medium mb-2 ${
                  matchLevel === "excellent"
                    ? "bg-green-100 text-green-800"
                    : matchLevel === "good"
                    ? "bg-blue-100 text-blue-800"
                    : matchLevel === "fair"
                    ? "bg-yellow-100 text-yellow-800"
                    : "bg-red-100 text-red-800"
                }`}
              >
                {matchLevel?.replace("_", " ").toUpperCase() || "UNKNOWN"}
              </div>
              <p className="text-sm text-gray-600">Match Level</p>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6 text-center">
              <div className="text-2xl font-bold text-purple-600 mb-2">
                {Object.keys(fields).length}
              </div>
              <p className="text-sm text-gray-600">ICP Fields Extracted</p>
            </CardContent>
          </Card>
        </div>

        {/* ICP Fields */}
        {Object.keys(fields).length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-purple-600" />
                ICP Profile Data
              </CardTitle>
              <CardDescription>
                Extracted data points matching your Ideal Customer Profile
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {Object.entries(fields).map(([key, value]: [string, any]) => (
                  <div key={key} className="p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-medium text-gray-900 mb-2">{key}</h4>
                    <div className="text-sm text-gray-700">
                      {Array.isArray(value) ? (
                        <ul className="space-y-1">
                          {value.map((item: any, index: number) => (
                            <li key={index}>• {item}</li>
                          ))}
                        </ul>
                      ) : (
                        <p>{value || "Not specified"}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </>
    );
  }

  function renderBusinessIntelligence(businessIntel: any) {
    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Industry & Services */}
        {(businessIntel?.industry || businessIntel?.keyServices) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-green-600" />
                Industry & Services
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {businessIntel?.industry && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Industries</h4>
                  <div className="flex flex-wrap gap-2">
                    {businessIntel.industry.map(
                      (industry: string, index: number) => (
                        <Badge
                          key={index}
                          variant="secondary"
                          className="bg-green-100 text-green-800"
                        >
                          {industry}
                        </Badge>
                      )
                    )}
                  </div>
                </div>
              )}
              {businessIntel?.keyServices && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Key Services
                  </h4>
                  <div className="flex flex-wrap gap-2">
                    {businessIntel.keyServices
                      .slice(0, 8)
                      .map((service: string, index: number) => (
                        <Badge
                          key={index}
                          variant="outline"
                          className="border-blue-200 text-blue-700"
                        >
                          {service}
                        </Badge>
                      ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Company Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Company Details
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {businessIntel?.employeeCount && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Employee Count
                </h4>
                <p className="text-gray-700 capitalize">
                  {businessIntel.employeeCount}
                </p>
              </div>
            )}
            {businessIntel?.targetMarket && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">
                  Target Market
                </h4>
                <div className="flex flex-wrap gap-2">
                  {businessIntel.targetMarket.map(
                    (market: string, index: number) => (
                      <Badge
                        key={index}
                        variant="secondary"
                        className="bg-purple-100 text-purple-800"
                      >
                        {market}
                      </Badge>
                    )
                  )}
                </div>
              </div>
            )}
            {businessIntel?.competitiveAdvantages &&
              businessIntel.competitiveAdvantages.length > 0 && (
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">
                    Competitive Advantages
                  </h4>
                  <ul className="space-y-1">
                    {businessIntel.competitiveAdvantages.map(
                      (advantage: string, index: number) => (
                        <li
                          key={index}
                          className="text-gray-700 flex items-start gap-2"
                        >
                          <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                          {advantage}
                        </li>
                      )
                    )}
                  </ul>
                </div>
              )}
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderLinksTab(links: string[]) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ExternalLink className="h-5 w-5 text-blue-600" />
            Discovered Links ({links.length})
          </CardTitle>
          <CardDescription>All links found on the website</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto glass-scrollbar">
            {links.map((link: string, index: number) => (
              <a
                key={index}
                href={link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition-colors text-sm"
              >
                <ExternalLink className="h-3 w-3 text-blue-600 flex-shrink-0" />
                <span className="truncate text-gray-700">{link}</span>
              </a>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

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

      {/* JSON Data Export Card */}
      <Card className="border-2 border-dashed border-gray-200 bg-gray-50/50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5 text-white" />
            Extracted Data (Clean JSON)
          </CardTitle>
          <CardDescription className="text-white-200">
            Clean extracted data without nested wrappers - ready for frontend
            integration
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
    </div>
  );
};

export default ScraperResults;
