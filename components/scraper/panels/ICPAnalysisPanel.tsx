"use client";

import React from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp } from "lucide-react";

export default function ICPAnalysisPanel({
  score,
  matchLevel,
  fields,
}: {
  score: number;
  matchLevel: string;
  fields: any;
}) {
  return (
    <>
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

