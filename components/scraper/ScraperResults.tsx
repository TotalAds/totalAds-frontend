"use client";

import {
  Award,
  Brain,
  Building2,
  Clock,
  Contact,
  Download,
  ExternalLink,
  Globe,
  Mail,
  MapPin,
  Phone,
  Shield,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react";
import React from "react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ScrapeResult, Table as TableType } from "./utils/scraperTypes";

interface ScraperResultsProps {
  result: ScrapeResult;
}

const ScraperResults: React.FC<ScraperResultsProps> = ({ result }) => {
  const { data, meta } = result;
  const isAIEnhanced = meta?.aiEnhanced || data?.aiEnhanced;

  const renderContactInfo = () => {
    const contact =
      data.contactDetails ||
      data.enhancedContactInfo ||
      data.company_info?.contact;

    if (!contact) {
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

    const emails = Array.isArray(contact.email)
      ? contact.email
      : contact.email
      ? [contact.email]
      : [];
    const phones = Array.isArray(contact.phone)
      ? contact.phone
      : contact.phone
      ? [contact.phone]
      : [];

    // Type guard for ContactDetails
    const hasAddress = "address" in contact && contact.address;
    const hasSocialMedia = "social_media" in contact && contact.social_media;

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {emails?.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Mail className="h-5 w-5 text-blue-600" />
                Email
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {emails.map((email, index) => (
                  <a
                    key={index}
                    href={`mailto:${email}`}
                    className="block text-blue-600 hover:text-blue-800 hover:underline"
                  >
                    {email}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {phones?.length > 0 && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <Phone className="h-5 w-5 text-green-600" />
                Phone
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {phones.map((phone, index) => (
                  <a
                    key={index}
                    href={`tel:${phone}`}
                    className="block text-green-600 hover:text-green-800 hover:underline"
                  >
                    {phone}
                  </a>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {hasAddress && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-lg flex items-center gap-2">
                <MapPin className="h-5 w-5 text-red-600" />
                Address
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-gray-700">{(contact as any).address}</p>
            </CardContent>
          </Card>
        )}

        {hasSocialMedia &&
          Object.keys((contact as any).social_media).length > 0 && (
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Globe className="h-5 w-5 text-purple-600" />
                  Social Media
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {Object.entries((contact as any).social_media).map(
                    ([platform, url]) => (
                      <a
                        key={platform}
                        href={url as string}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-2 text-purple-600 hover:text-purple-800 hover:underline"
                      >
                        <ExternalLink className="h-4 w-4" />
                        <span className="capitalize">{platform}</span>
                      </a>
                    )
                  )}
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    );
  };

  const renderAboutInfo = () => {
    const about = data.aboutData;
    const businessIntel = data.businessIntelligence;
    const title = data.title;
    const description = data.desc;

    if (!about && !businessIntel && !title && !description) {
      return (
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500 text-center">
              No company information found.
            </p>
          </CardContent>
        </Card>
      );
    }

    return (
      <div className="space-y-6">
        {/* Basic Info */}
        {(title || description) && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="h-5 w-5 text-blue-600" />
                Company Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              {title && (
                <h3 className="text-xl font-semibold text-gray-900 mb-3">
                  {title}
                </h3>
              )}
              {description && (
                <p className="text-gray-700 leading-relaxed">{description}</p>
              )}
            </CardContent>
          </Card>
        )}

        {/* Business Intelligence (AI Enhanced) */}
        {businessIntel && (
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
                <CardContent>
                  {businessIntel.industry && (
                    <div className="mb-4">
                      <h4 className="font-medium text-gray-900 mb-2">
                        Industries
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {businessIntel.industry.map((industry, index) => (
                          <Badge key={index} variant="secondary">
                            {industry}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                  {businessIntel.keyServices && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Key Services
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {businessIntel.keyServices
                          .slice(0, 6)
                          .map((service, index) => (
                            <Badge key={index} variant="outline">
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
              <CardContent>
                <div className="space-y-3">
                  {businessIntel?.companyType && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Type:</span>
                      <span className="font-medium capitalize">
                        {businessIntel.companyType}
                      </span>
                    </div>
                  )}
                  {businessIntel?.businessModel && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Model:</span>
                      <span className="font-medium">
                        {businessIntel.businessModel}
                      </span>
                    </div>
                  )}
                  {businessIntel?.marketPosition && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Market Position:</span>
                      <span className="font-medium capitalize">
                        {businessIntel.marketPosition}
                      </span>
                    </div>
                  )}
                  {businessIntel?.employeeCount && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">Employee Count:</span>
                      <span className="font-medium">
                        {businessIntel.employeeCount}
                      </span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Competitive Advantages */}
        {businessIntel?.competitiveAdvantages &&
          businessIntel.competitiveAdvantages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="h-5 w-5 text-yellow-600" />
                  Competitive Advantages
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {businessIntel?.competitiveAdvantages
                    .slice(0, 5)
                    .map((advantage, index) => (
                      <li key={index} className="flex items-start gap-2">
                        <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                        <span className="text-gray-700">{advantage}</span>
                      </li>
                    ))}
                </ul>
              </CardContent>
            </Card>
          )}

        {/* Technologies */}
        {businessIntel?.technologies &&
          businessIntel.technologies.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5 text-orange-600" />
                  Technologies
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {businessIntel.technologies.map((tech, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="bg-orange-50"
                    >
                      {tech}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
      </div>
    );
  };

  const renderTable = (table: TableType, index: number) => {
    return (
      <div key={index} className="overflow-x-auto mb-8">
        {table?.caption && <p className="font-medium mb-2">{table.caption}</p>}
        <table className="min-w-full border-collapse border border-bg-300">
          <thead>
            <tr className="bg-bg-200">
              {table?.headers.map((header, i) => (
                <th
                  key={i}
                  className="py-2 px-4 border border-bg-300 text-left text-sm font-medium"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {table?.rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className={rowIndex % 2 === 0 ? "bg-bg-100" : "bg-white"}
              >
                {row.map((cell, cellIndex) => (
                  <td
                    key={cellIndex}
                    className="py-2 px-4 border border-bg-300 text-sm"
                  >
                    {cell}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const getUrlFromData = () => {
    // Try to extract URL from various possible locations
    return (
      data?.url || (data?.nestedLinks && data.nestedLinks[0]) || "Unknown URL"
    );
  };

  const getProcessingTime = () => {
    return (
      meta?.processingTime ||
      meta?.processing_time_ms ||
      data?.processingTime ||
      0
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      {/* Header */}
      {data ? (
        <>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                Scrape Results
              </h2>
              {isAIEnhanced && (
                <Badge
                  variant="default"
                  className="bg-gradient-to-r from-purple-500 to-blue-500"
                >
                  <Brain className="h-3 w-3 mr-1" />
                  AI Enhanced
                </Badge>
              )}
            </div>

            <div className="space-y-2">
              <p className="text-gray-600">
                Data extracted from{" "}
                <a
                  href={getUrlFromData()}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-800 hover:underline"
                >
                  {getUrlFromData()}
                </a>
              </p>

              {/* Metadata */}
              {meta && (
                <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                  {getProcessingTime() > 0 && (
                    <div className="flex items-center gap-1">
                      <Clock className="h-3 w-3" />
                      <span>
                        Processed in {(getProcessingTime() / 1000).toFixed(2)}s
                      </span>
                    </div>
                  )}

                  {meta.billing && (
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3" />
                      <span>
                        {meta.billing.charged
                          ? `Credits used: ${meta.billing.creditsUsed || 1} (${
                              meta.billing.scraperType || "Normal"
                            })`
                          : `Credits used: ${
                              meta.billing.creditsUsed || 0.5
                            } (free tier)`}
                      </span>
                    </div>
                  )}

                  {meta.timestamp && (
                    <span>{new Date(meta.timestamp).toLocaleString()}</span>
                  )}

                  {data?.aiCost && (
                    <div className="flex items-center gap-1">
                      <Brain className="h-3 w-3" />
                      <span>AI Cost: ${data.aiCost.toFixed(4)}</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <Tabs defaultValue="about" className="w-full">
            <TabsList className="mb-6 flex-wrap">
              <TabsTrigger value="about">
                <Building2 className="h-4 w-4 mr-1" />
                About
              </TabsTrigger>
              <TabsTrigger value="contact">
                <Contact className="h-4 w-4 mr-1" />
                Contact
              </TabsTrigger>
              {isAIEnhanced && data.businessIntelligence && (
                <TabsTrigger value="business-intel">
                  <Brain className="h-4 w-4 mr-1" />
                  Business Intelligence
                </TabsTrigger>
              )}
              {data?.nestedLinks && data.nestedLinks.length > 0 && (
                <TabsTrigger value="links">
                  <ExternalLink className="h-4 w-4 mr-1" />
                  Links ({data.nestedLinks.length})
                </TabsTrigger>
              )}
              {data.tables && data.tables.length > 0 && (
                <TabsTrigger value="tables">
                  Tables ({data.tables.length})
                </TabsTrigger>
              )}
              {(data.text || data.ai_summary || data.raw_text) && (
                <TabsTrigger value="text-data">Text Data</TabsTrigger>
              )}
            </TabsList>

            <TabsContent value="about" className="space-y-6">
              {renderAboutInfo()}
            </TabsContent>

            <TabsContent value="contact" className="space-y-6">
              {renderContactInfo()}
            </TabsContent>

            {/* Business Intelligence Tab (AI Enhanced) */}
            {isAIEnhanced && data.businessIntelligence && (
              <TabsContent value="business-intel" className="space-y-6">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Risk Factors */}
                  {data.businessIntelligence.riskFactors &&
                    data.businessIntelligence.riskFactors.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Shield className="h-5 w-5 text-red-600" />
                            Risk Factors
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {data.businessIntelligence.riskFactors.map(
                              (risk, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <div className="w-2 h-2 bg-red-600 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-gray-700 text-sm">
                                    {risk}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                  {/* Opportunities */}
                  {data.businessIntelligence.opportunities &&
                    data.businessIntelligence.opportunities.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <TrendingUp className="h-5 w-5 text-green-600" />
                            Opportunities
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="space-y-2">
                            {data.businessIntelligence.opportunities.map(
                              (opportunity, index) => (
                                <li
                                  key={index}
                                  className="flex items-start gap-2"
                                >
                                  <div className="w-2 h-2 bg-green-600 rounded-full mt-2 flex-shrink-0"></div>
                                  <span className="text-gray-700 text-sm">
                                    {opportunity}
                                  </span>
                                </li>
                              )
                            )}
                          </ul>
                        </CardContent>
                      </Card>
                    )}

                  {/* Target Market */}
                  {data.businessIntelligence.targetMarket &&
                    data.businessIntelligence.targetMarket.length > 0 && (
                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-blue-600" />
                            Target Market
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <div className="flex flex-wrap gap-2">
                            {data.businessIntelligence.targetMarket.map(
                              (market, index) => (
                                <Badge
                                  key={index}
                                  variant="outline"
                                  className="bg-blue-50"
                                >
                                  {market}
                                </Badge>
                              )
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    )}

                  {/* Confidence Score */}
                  {data.businessIntelligence.confidence && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Brain className="h-5 w-5 text-purple-600" />
                          AI Confidence
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-4">
                          <div className="flex-1 bg-gray-200 rounded-full h-3">
                            <div
                              className="bg-gradient-to-r from-purple-500 to-blue-500 h-3 rounded-full transition-all duration-300"
                              style={{
                                width: `${data.businessIntelligence.confidence}%`,
                              }}
                            ></div>
                          </div>
                          <span className="font-semibold text-lg">
                            {data.businessIntelligence.confidence}%
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mt-2">
                          AI confidence in the extracted business intelligence
                        </p>
                      </CardContent>
                    </Card>
                  )}
                </div>
              </TabsContent>
            )}

            {/* Links Tab */}
            {data.nestedLinks && data.nestedLinks.length > 0 && (
              <TabsContent value="links" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <ExternalLink className="h-5 w-5 text-blue-600" />
                      Extracted Links ({data.nestedLinks.length})
                    </CardTitle>
                    <CardDescription>
                      All links found on the website
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-96 overflow-y-auto">
                      {data.nestedLinks.map((link, index) => (
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
              </TabsContent>
            )}

            {/* Tables Tab */}
            {data.tables && data.tables.length > 0 && (
              <TabsContent value="tables" className="space-y-6">
                {data.tables.map((table, index) => renderTable(table, index))}
              </TabsContent>
            )}

            {/* Text Data Tab */}
            {(data.text || data.ai_summary || data.raw_text) && (
              <TabsContent value="text-data" className="space-y-6">
                {/* AI Summary (for AI enhanced responses) */}
                {data.text && isAIEnhanced && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Brain className="h-5 w-5 text-purple-600" />
                        AI Summary
                      </CardTitle>
                      <CardDescription>
                        AI-generated summary of key business points
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="prose prose-sm max-w-none">
                        <div className="whitespace-pre-line text-gray-700">
                          {data.text}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Legacy AI Summary */}
                {data.ai_summary && (
                  <Card>
                    <CardHeader>
                      <CardTitle>AI Summary</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="whitespace-pre-line text-gray-700">
                        {data.ai_summary}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Raw Text */}
                {(data.raw_text || (data.text && !isAIEnhanced)) && (
                  <Card>
                    <CardHeader>
                      <CardTitle>Raw Text</CardTitle>
                      <CardDescription>
                        Raw text content extracted from the website
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gray-50 p-4 rounded-lg border max-h-96 overflow-y-auto">
                        <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                          {data.raw_text || data.text}
                        </pre>
                      </div>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            )}
          </Tabs>

          <div className="flex justify-end mt-6">
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors"
              onClick={() => {
                const jsonString = JSON.stringify(result, null, 2);
                const blob = new Blob([jsonString], {
                  type: "application/json",
                });
                const url = URL.createObjectURL(blob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `scrape-result-${
                  new Date().toISOString().split("T")[0]
                }.json`;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
              }}
            >
              <Download className="h-4 w-4" />
              Download JSON
            </button>
          </div>
        </>
      ) : (
        ""
      )}
    </div>
  );
};

export default ScraperResults;
