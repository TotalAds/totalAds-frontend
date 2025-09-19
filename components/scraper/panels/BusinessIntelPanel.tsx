"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, Users, Zap } from "lucide-react";

export default function BusinessIntelPanel({ businessIntel }: { businessIntel: any }) {
  if (!businessIntel) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  {businessIntel.industry.map((industry: string, index: number) => (
                    <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                      {industry}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
            {businessIntel?.keyServices && (
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Key Services</h4>
                <div className="flex flex-wrap gap-2">
                  {businessIntel.keyServices.slice(0, 8).map((service: string, index: number) => (
                    <Badge key={index} variant="outline" className="border-blue-200 text-blue-700">
                      {service}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
              <h4 className="font-medium text-gray-900 mb-2">Employee Count</h4>
              <p className="text-gray-700 capitalize">{businessIntel.employeeCount}</p>
            </div>
          )}
          {businessIntel?.targetMarket && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Target Market</h4>
              <div className="flex flex-wrap gap-2">
                {businessIntel.targetMarket.map((market: string, index: number) => (
                  <Badge key={index} variant="secondary" className="bg-purple-100 text-purple-800">
                    {market}
                  </Badge>
                ))}
              </div>
            </div>
          )}
          {businessIntel?.competitiveAdvantages && businessIntel.competitiveAdvantages.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Competitive Advantages</h4>
              <ul className="space-y-1">
                {businessIntel.competitiveAdvantages.map((advantage: string, index: number) => (
                  <li key={index} className="text-gray-700 flex items-start gap-2">
                    <Zap className="h-4 w-4 text-yellow-500 mt-0.5 flex-shrink-0" />
                    {advantage}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

