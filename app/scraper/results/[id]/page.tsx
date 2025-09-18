"use client";

import { useParams, useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { ScrapeResult } from "@/components/scraper/utils/scraperTypes";
import { getScrapeJobDetails } from "@/utils/api/scraperClient";
import {
  IconArrowLeft,
  IconDownload,
  IconExternalLink,
  IconShare,
} from "@tabler/icons-react";

export default function ScraperResultPage() {
  const params = useParams();
  const router = useRouter();
  const [result, setResult] = useState<ScrapeResult | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const jobId = params.id as string;

  useEffect(() => {
    const fetchJobDetails = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await getScrapeJobDetails(jobId);
        setResult(data);
      } catch (err: any) {
        console.error("Error fetching job details:", err);
        setError(
          err.message || "Failed to load result. Please try again later."
        );
      } finally {
        setLoading(false);
      }
    };

    if (jobId) {
      fetchJobDetails();
    }
  }, [jobId]);

  const handleGoBack = () => {
    router.back();
  };

  const downloadJSON = () => {
    if (!result) return;

    const dataStr = JSON.stringify(result.data, null, 2);
    const dataUri = `data:application/json;charset=utf-8,${encodeURIComponent(
      dataStr
    )}`;

    const exportName = `scrape-result-${jobId}.json`;
    const linkElement = document.createElement("a");
    linkElement.setAttribute("href", dataUri);
    linkElement.setAttribute("download", exportName);
    linkElement.click();
  };

  const shareResult = async () => {
    if (!result) return;

    try {
      if (navigator.share) {
        await navigator.share({
          title: `Leadsnipper Scrape Result for ${result.data.url}`,
          text: `Check out this website scrape result from Leadsnipper`,
          url: window.location.href,
        });
      } else {
        // Fallback to clipboard
        await navigator.clipboard.writeText(window.location.href);
        alert("Link copied to clipboard!");
      }
    } catch (error) {
      console.error("Error sharing:", error);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="flex justify-center items-center p-16">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-primary-600"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-red-700">{error}</p>
              <button
                onClick={handleGoBack}
                className="mt-3 text-sm text-red-700 underline hover:text-red-800"
              >
                Go back to history
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="container mx-auto py-8 px-4">
        <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4">
          <div className="flex">
            <div className="ml-3">
              <p className="text-sm text-yellow-700">
                No result found for this ID.
              </p>
              <button
                onClick={handleGoBack}
                className="mt-3 text-sm text-yellow-700 underline hover:text-yellow-800"
              >
                Go back to history
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8 px-4">
      {/* Header with back button */}
      <div className="mb-6">
        <button
          onClick={handleGoBack}
          className="flex items-center text-text-400 hover:text-primary-600 mb-4"
        >
          <IconArrowLeft className="h-4 w-4 mr-1" />
          <span>Back to history</span>
        </button>

        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
          <h1 className="text-2xl font-bold">Scrape Result</h1>

          <div className="flex mt-4 sm:mt-0 space-x-2">
            <button
              onClick={downloadJSON}
              className="bg-bg-100 hover:bg-bg-200 text-text-500 px-4 py-2 rounded-md flex items-center text-sm"
            >
              <IconDownload className="h-4 w-4 mr-2" />
              Download JSON
            </button>
            <button
              onClick={shareResult}
              className="bg-bg-100 hover:bg-bg-200 text-text-500 px-4 py-2 rounded-md flex items-center text-sm"
            >
              <IconShare className="h-4 w-4 mr-2" />
              Share
            </button>
          </div>
        </div>
      </div>

      {/* URL and metadata card */}
      <div className="bg-white border border-bg-200 rounded-lg shadow-sm mb-6">
        <div className="p-4 border-b border-bg-200">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-medium">Source Information</h3>
            <a
              href={result.data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary-600 hover:text-primary-700 flex items-center text-sm"
            >
              Visit Website
              <IconExternalLink className="h-4 w-4 ml-1" />
            </a>
          </div>
        </div>

        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h4 className="text-sm font-medium text-text-300 mb-1">URL</h4>
              <p className="text-text-600 break-all">{result.data.url}</p>
            </div>
            {result.meta?.timestamp && (
              <div>
                <h4 className="text-sm font-medium text-text-300 mb-1">
                  Scraped On
                </h4>
                <p className="text-text-600">
                  {new Date(result.meta.timestamp).toLocaleString()}
                </p>
              </div>
            )}
            {result.meta?.processing_time_ms && (
              <div>
                <h4 className="text-sm font-medium text-text-300 mb-1">
                  Processing Time
                </h4>
                <p className="text-text-600">
                  {(result.meta.processing_time_ms / 1000).toFixed(2)} seconds
                </p>
              </div>
            )}
            {result.meta?.billing?.charged !== undefined && (
              <div>
                <h4 className="text-sm font-medium text-text-300 mb-1">
                  Credits Used
                </h4>
                <p className="text-text-600">
                  {result.meta?.billing?.apiCall || "N/A"}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Company information */}
      {result.data.company_info && (
        <div className="bg-white border border-bg-200 rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b border-bg-200">
            <h3 className="text-lg font-medium">Company Information</h3>
          </div>
          <div className="p-4">
            {/* About section */}
            <div className="mb-6">
              <h4 className="text-md font-medium mb-4">About</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.data.company_info.about.company_name && (
                  <div>
                    <h5 className="text-sm font-medium text-text-300 mb-1">
                      Company Name
                    </h5>
                    <p className="text-text-600">
                      {result.data.company_info.about.company_name}
                    </p>
                  </div>
                )}
                {result.data.company_info.about.founded_year && (
                  <div>
                    <h5 className="text-sm font-medium text-text-300 mb-1">
                      Founded
                    </h5>
                    <p className="text-text-600">
                      {result.data.company_info.about.founded_year}
                    </p>
                  </div>
                )}
                {result.data.company_info.about.industry && (
                  <div>
                    <h5 className="text-sm font-medium text-text-300 mb-1">
                      Industry
                    </h5>
                    <p className="text-text-600">
                      {result.data.company_info.about.industry}
                    </p>
                  </div>
                )}
                {result.data.company_info.about.headquarters && (
                  <div>
                    <h5 className="text-sm font-medium text-text-300 mb-1">
                      Headquarters
                    </h5>
                    <p className="text-text-600">
                      {result.data.company_info.about.headquarters}
                    </p>
                  </div>
                )}
                {result.data.company_info.about.company_size && (
                  <div>
                    <h5 className="text-sm font-medium text-text-300 mb-1">
                      Company Size
                    </h5>
                    <p className="text-text-600">
                      {result.data.company_info.about.company_size}
                    </p>
                  </div>
                )}
                {result.data.company_info.about.revenue && (
                  <div>
                    <h5 className="text-sm font-medium text-text-300 mb-1">
                      Revenue
                    </h5>
                    <p className="text-text-600">
                      {result.data.company_info.about.revenue}
                    </p>
                  </div>
                )}
              </div>

              {result.data.company_info.about.description && (
                <div className="mt-4">
                  <h5 className="text-sm font-medium text-text-300 mb-1">
                    Description
                  </h5>
                  <p className="text-text-600 whitespace-pre-line">
                    {result.data.company_info.about.description}
                  </p>
                </div>
              )}
            </div>

            {/* Contact section */}
            <div>
              <h4 className="text-md font-medium mb-4">Contact Information</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {result.data.company_info.contact.email && (
                  <div>
                    <h5 className="text-sm font-medium text-text-300 mb-1">
                      Email
                    </h5>
                    <p className="text-text-600">
                      {result.data.company_info.contact.email}
                    </p>
                  </div>
                )}
                {result.data.company_info.contact.phone && (
                  <div>
                    <h5 className="text-sm font-medium text-text-300 mb-1">
                      Phone
                    </h5>
                    <p className="text-text-600">
                      {result.data.company_info.contact.phone}
                    </p>
                  </div>
                )}
                {result.data.company_info.contact.address && (
                  <div>
                    <h5 className="text-sm font-medium text-text-300 mb-1">
                      Address
                    </h5>
                    <p className="text-text-600 whitespace-pre-line">
                      {result.data.company_info.contact.address}
                    </p>
                  </div>
                )}
              </div>

              {/* Social media */}
              {result.data.company_info.contact.social_media &&
                Object.keys(result.data.company_info.contact.social_media)
                  .length > 0 && (
                  <div className="mt-4">
                    <h5 className="text-sm font-medium text-text-300 mb-2">
                      Social Media
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {Object.entries(
                        result.data.company_info.contact.social_media
                      ).map(([platform, url]) => (
                        <a
                          key={platform}
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary-600 hover:text-primary-700 flex items-center"
                        >
                          {platform.charAt(0).toUpperCase() + platform.slice(1)}
                          <IconExternalLink className="h-4 w-4 ml-1" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}
            </div>
          </div>
        </div>
      )}

      {/* Tables */}
      {result.data.tables && result.data.tables.length > 0 && (
        <div className="bg-white border border-bg-200 rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b border-bg-200">
            <h3 className="text-lg font-medium">Extracted Tables</h3>
          </div>
          <div className="p-4">
            {result.data.tables.map((table, tableIndex) => (
              <div key={tableIndex} className="mb-6 last:mb-0">
                {table.caption && (
                  <h4 className="text-md font-medium mb-2">{table.caption}</h4>
                )}
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-bg-200 border border-bg-200">
                    <thead className="bg-bg-50">
                      <tr>
                        {table.headers.map((header, headerIndex) => (
                          <th
                            key={headerIndex}
                            className="px-4 py-3 text-left text-xs font-medium text-text-300 uppercase tracking-wider"
                          >
                            {header}
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-bg-200">
                      {table.rows.map((row, rowIndex) => (
                        <tr
                          key={rowIndex}
                          className={
                            rowIndex % 2 === 0 ? "bg-white" : "bg-bg-50"
                          }
                        >
                          {row.map((cell, cellIndex) => (
                            <td
                              key={cellIndex}
                              className="px-4 py-3 text-sm text-text-600"
                            >
                              {cell}
                            </td>
                          ))}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* AI Summary */}
      {result.data.ai_summary && (
        <div className="bg-white border border-bg-200 rounded-lg shadow-sm mb-6">
          <div className="p-4 border-b border-bg-200">
            <h3 className="text-lg font-medium">AI Summary</h3>
          </div>
          <div className="p-4">
            <p className="text-text-600 whitespace-pre-line">
              {result.data.ai_summary}
            </p>
          </div>
        </div>
      )}

      {/* Raw Text */}
      {result.data.raw_text && (
        <div className="bg-white border border-bg-200 rounded-lg shadow-sm">
          <div className="p-4 border-b border-bg-200 flex justify-between items-center">
            <h3 className="text-lg font-medium">Raw Text</h3>
            <div className="text-sm text-text-400">
              {result.data.raw_text.length} characters
            </div>
          </div>
          <div className="p-4">
            <div className="bg-bg-50 p-4 rounded-md overflow-auto max-h-96 glass-scrollbar">
              <pre className="text-sm text-text-600 whitespace-pre-wrap font-mono">
                {result.data.raw_text}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
