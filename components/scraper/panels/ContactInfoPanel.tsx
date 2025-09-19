"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Contact, ExternalLink, Users } from "lucide-react";
import { ExtractedData } from "@/components/scraper/utils/scraperTypes";

export default function ContactInfoPanel({ data }: { data: ExtractedData }) {
  const contact = data?.contactInfo;
  const socialPresence = data?.socialPresence || {};

  if (!contact && !Object.values(socialPresence).some(Boolean)) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-gray-500 text-center">No contact information found.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <a href={`mailto:${contact.email}`} className="text-blue-600 hover:underline">
                {contact.email}
              </a>
            </div>
          )}

          {contact?.phone && contact.phone.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Phone</h4>
              {contact.phone.map((phone: string, index: number) => (
                <a key={index} href={`tel:${phone}`} className="text-blue-600 hover:underline block">
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

      {Object.values(socialPresence).some(Boolean) && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-purple-600" />
              Social Media
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {Object.entries(socialPresence).map(([platform, url]: [string, any]) =>
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

