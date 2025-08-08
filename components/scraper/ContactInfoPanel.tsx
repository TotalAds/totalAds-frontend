"use client";

import { ExternalLink, Globe, Mail, MapPin, Phone } from "lucide-react";
import React from "react";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { dedupePhones } from "@/utils/phone";

interface ContactInfoPanelProps {
  contact: any;
}

const ContactInfoPanel: React.FC<ContactInfoPanelProps> = ({ contact }) => {
  const emails = Array.isArray(contact?.email)
    ? contact.email
    : contact?.email
    ? [contact.email]
    : [];
  const phonesArr = Array.isArray(contact?.phone)
    ? contact.phone
    : contact?.phone
    ? [contact.phone]
    : [];
  const phones = dedupePhones(phonesArr, 3);
  const hasAddress = "address" in (contact || {}) && contact.address;
  const social = (contact as any)?.socialLinks || (contact as any)?.social_media;
  const hasSocialMedia = Boolean(social && Object.keys(social).length > 0);

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
              {emails.map((email: string, index: number) => (
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
              {phones.map((phone: string, index: number) => (
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

      {hasSocialMedia && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-lg flex items-center gap-2">
              <Globe className="h-5 w-5 text-purple-600" />
              Social Media
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {Object.entries(social).map(([platform, url]) => (
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
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ContactInfoPanel;

