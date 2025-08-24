"use client";

import { Award, Building2, TrendingUp, Users, Zap } from 'lucide-react';
import React from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import { BusinessIntelligence } from './utils/scraperTypes';

interface AboutProfilePanelProps {
  title?: string;
  description?: string;
  about?: any;
  businessIntel?: BusinessIntelligence;
}

const AboutProfilePanel: React.FC<AboutProfilePanelProps> = ({
  title,
  description,
  about,
  businessIntel,
}) => {
  return (
    <div className="space-y-6">
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

      {businessIntel && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                  .map((adv, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <div className="w-2 h-2 bg-yellow-600 rounded-full mt-2 flex-shrink-0"></div>
                      <span className="text-gray-700">{adv}</span>
                    </li>
                  ))}
              </ul>
            </CardContent>
          </Card>
        )}

      {businessIntel?.technologies && businessIntel.technologies.length > 0 && (
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
                <Badge key={index} variant="outline" className="bg-orange-50">
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

export { AboutProfilePanel };
export default AboutProfilePanel;
