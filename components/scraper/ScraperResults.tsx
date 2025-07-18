"use client";

import React, { useState } from "react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

import { ScrapeResult, Table as TableType } from "./utils/scraperTypes";

interface ScraperResultsProps {
  result: ScrapeResult;
}

const ScraperResults: React.FC<ScraperResultsProps> = ({ result }) => {
  const { data, meta } = result;

  const renderContactInfo = () => {
    const contact = data.company_info?.contact;
    if (
      !contact ||
      Object.keys(contact).filter(
        (key) => !!contact[key as keyof typeof contact]
      ).length === 0
    ) {
      return <p className="text-text-200">No contact information found.</p>;
    }

    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {contact.email && (
          <div className="p-4 bg-bg-100 rounded-lg">
            <h3 className="font-medium text-text mb-1">Email</h3>
            <p className="text-text-200">{contact.email}</p>
          </div>
        )}

        {contact.phone && (
          <div className="p-4 bg-bg-100 rounded-lg">
            <h3 className="font-medium text-text mb-1">Phone</h3>
            <p className="text-text-200">{contact.phone}</p>
          </div>
        )}

        {contact.address && (
          <div className="p-4 bg-bg-100 rounded-lg">
            <h3 className="font-medium text-text mb-1">Address</h3>
            <p className="text-text-200">{contact.address}</p>
          </div>
        )}

        {contact.social_media &&
          Object.keys(contact.social_media).length > 0 && (
            <div className="p-4 bg-bg-100 rounded-lg">
              <h3 className="font-medium text-text mb-1">Social Media</h3>
              <ul className="text-text-200 space-y-1">
                {Object.entries(contact.social_media).map(([platform, url]) => (
                  <li key={platform}>
                    <span className="font-medium">{platform}:</span>{" "}
                    <a
                      href={url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      {url}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          )}
      </div>
    );
  };

  const renderAboutInfo = () => {
    const about = data.company_info?.about;
    if (
      !about ||
      Object.keys(about).filter((key) => !!about[key as keyof typeof about])
        .length === 0
    ) {
      return <p className="text-text-200">No company information found.</p>;
    }

    return (
      <div className="space-y-6">
        {about.company_name && (
          <div>
            <h3 className="font-medium text-lg text-text">
              {about.company_name}
            </h3>
          </div>
        )}

        {about.description && (
          <div>
            <h4 className="font-medium text-text mb-1">Description</h4>
            <p className="text-text-200">{about.description}</p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {about.industry && (
            <div className="p-3 bg-bg-100 rounded-lg">
              <h4 className="font-medium text-text text-sm">Industry</h4>
              <p className="text-text-200">{about.industry}</p>
            </div>
          )}

          {about.founded_year && (
            <div className="p-3 bg-bg-100 rounded-lg">
              <h4 className="font-medium text-text text-sm">Founded</h4>
              <p className="text-text-200">{about.founded_year}</p>
            </div>
          )}

          {about.company_size && (
            <div className="p-3 bg-bg-100 rounded-lg">
              <h4 className="font-medium text-text text-sm">Company Size</h4>
              <p className="text-text-200">{about.company_size}</p>
            </div>
          )}

          {about.revenue && (
            <div className="p-3 bg-bg-100 rounded-lg">
              <h4 className="font-medium text-text text-sm">Revenue</h4>
              <p className="text-text-200">{about.revenue}</p>
            </div>
          )}

          {about.headquarters && (
            <div className="p-3 bg-bg-100 rounded-lg">
              <h4 className="font-medium text-text text-sm">Headquarters</h4>
              <p className="text-text-200">{about.headquarters}</p>
            </div>
          )}

          {about.website && (
            <div className="p-3 bg-bg-100 rounded-lg">
              <h4 className="font-medium text-text text-sm">Website</h4>
              <a
                href={about.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary-600 hover:underline text-sm"
              >
                {about.website}
              </a>
            </div>
          )}
        </div>
      </div>
    );
  };

  const renderTable = (table: TableType, index: number) => {
    return (
      <div key={index} className="overflow-x-auto mb-8">
        {table.caption && <p className="font-medium mb-2">{table.caption}</p>}
        <table className="min-w-full border-collapse border border-bg-300">
          <thead>
            <tr className="bg-bg-200">
              {table.headers.map((header, i) => (
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
            {table.rows.map((row, rowIndex) => (
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

  return (
    <div className="bg-white rounded-lg shadow-lg p-6">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-text mb-2">Scrape Results</h2>
        <p className="text-text-200">
          Data extracted from{" "}
          <a
            href={data.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary-600 hover:underline"
          >
            {data.url}
          </a>
        </p>
        {meta && (
          <div className="flex flex-wrap gap-4 mt-2 text-sm text-text-200">
            {meta.processing_time_ms && (
              <span>
                Processed in {(meta.processing_time_ms / 1000).toFixed(2)}s
              </span>
            )}
            {meta.billing && (
              <span>
                {meta.billing.charged
                  ? `Credits used: ${meta.billing.apiCall || 1}`
                  : "No credits used (free tier)"}
              </span>
            )}
            {meta.timestamp && (
              <span>{new Date(meta.timestamp).toLocaleString()}</span>
            )}
          </div>
        )}
      </div>

      <Tabs defaultValue="about" className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="about">About</TabsTrigger>
          <TabsTrigger value="contact">Contact</TabsTrigger>
          {data.tables && data.tables.length > 0 && (
            <TabsTrigger value="tables">
              Tables ({data.tables.length})
            </TabsTrigger>
          )}
          {data.ai_summary && (
            <TabsTrigger value="ai-summary">AI Summary</TabsTrigger>
          )}
          {data.raw_text && (
            <TabsTrigger value="raw-text">Raw Text</TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="about" className="space-y-6">
          {renderAboutInfo()}
        </TabsContent>

        <TabsContent value="contact" className="space-y-6">
          {renderContactInfo()}
        </TabsContent>

        {data.tables && data.tables.length > 0 && (
          <TabsContent value="tables" className="space-y-6">
            {data.tables.map((table, index) => renderTable(table, index))}
          </TabsContent>
        )}

        {data.ai_summary && (
          <TabsContent value="ai-summary" className="space-y-6">
            <div className="bg-bg-50 p-4 rounded-lg border border-bg-200">
              <h3 className="font-medium text-text mb-2">AI Summary</h3>
              <div className="text-text-200 whitespace-pre-line">
                {data.ai_summary}
              </div>
            </div>
          </TabsContent>
        )}

        {data.raw_text && (
          <TabsContent value="raw-text" className="space-y-6">
            <div className="bg-bg-50 p-4 rounded-lg border border-bg-200">
              <h3 className="font-medium text-text mb-2">Raw Text</h3>
              <div className="text-text-200 text-sm font-mono max-h-96 overflow-y-auto p-2">
                {data.raw_text}
              </div>
            </div>
          </TabsContent>
        )}
      </Tabs>

      <div className="flex justify-end mt-6">
        <button
          className="text-sm text-primary-600 hover:text-primary-700 flex items-center"
          onClick={() => {
            // Download JSON functionality could be added here
            const jsonString = JSON.stringify(result, null, 2);
            const blob = new Blob([jsonString], { type: "application/json" });
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = "scrape-result.json";
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
          }}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-4 w-4 mr-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
            />
          </svg>
          Download JSON
        </button>
      </div>
    </div>
  );
};

export default ScraperResults;
