"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ExternalLink } from "lucide-react";

export default function LinksPanel({ links }: { links: string[] }) {
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

