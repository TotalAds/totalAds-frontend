"use client";

import React, { useState, useEffect } from 'react';
import { Search, Target, TrendingUp, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface ICPProfile {
  id: string;
  name: string;
  status: string;
}

interface ICPScrapeResult {
  jobId: string;
  url: string;
  status: 'completed' | 'failed';
  icpScore?: number;
  icpMatchLevel?: 'excellent' | 'good' | 'fair' | 'poor' | 'no_match';
  icpRecommendation?: string;
  insights?: {
    strengths: string[];
    weaknesses: string[];
    opportunities: string[];
    redFlags: string[];
  };
  actionableRecommendations?: string[];
  processingTime?: number;
  error?: string;
}

const ICPScraperTest: React.FC = () => {
  const [profiles, setProfiles] = useState<ICPProfile[]>([]);
  const [selectedProfileId, setSelectedProfileId] = useState<string>('');
  const [url, setUrl] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ICPScrapeResult | null>(null);
  const [apiToken, setApiToken] = useState<string>('');

  useEffect(() => {
    fetchProfiles();
    fetchApiToken();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/icp-management/profiles', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        const activeProfiles = data.data.profiles.filter((p: ICPProfile) => p.status === 'active');
        setProfiles(activeProfiles);
        if (activeProfiles.length > 0) {
          setSelectedProfileId(activeProfiles[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to fetch ICP profiles:', error);
    }
  };

  const fetchApiToken = async () => {
    try {
      const response = await fetch('/api/api-management/tokens', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.data.tokens.length > 0) {
          setApiToken(data.data.tokens[0].token);
        }
      }
    } catch (error) {
      console.error('Failed to fetch API token:', error);
    }
  };

  const handleScrape = async () => {
    if (!url || !selectedProfileId || !apiToken) {
      alert('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setResult(null);

    try {
      const response = await fetch('/api/icp-scraper', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiToken}`,
        },
        body: JSON.stringify({
          url: url,
          icpProfileId: selectedProfileId,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult(data.data);
      } else {
        setResult({
          jobId: '',
          url: url,
          status: 'failed',
          error: data.message || 'Scraping failed',
        });
      }
    } catch (error) {
      setResult({
        jobId: '',
        url: url,
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    } finally {
      setLoading(false);
    }
  };

  const getMatchLevelColor = (level?: string) => {
    switch (level) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-orange-600 bg-orange-100';
      case 'no_match': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const getScoreColor = (score?: number) => {
    if (!score) return 'text-gray-600';
    if (score >= 90) return 'text-green-600';
    if (score >= 70) return 'text-blue-600';
    if (score >= 50) return 'text-yellow-600';
    if (score >= 30) return 'text-orange-600';
    return 'text-red-600';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">ICP Scraper Test</h1>
        <p className="text-gray-600 mt-1">
          Test intelligent lead qualification with your ICP profiles
        </p>
      </div>

      {/* Scraper Form */}
      <div className="bg-white rounded-lg border border-gray-200 p-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Test ICP Scraping</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select ICP Profile
            </label>
            <select
              value={selectedProfileId}
              onChange={(e) => setSelectedProfileId(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select an ICP profile...</option>
              {profiles.map((profile) => (
                <option key={profile.id} value={profile.id}>
                  {profile.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Website URL
            </label>
            <input
              type="url"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://example.com"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>

          <button
            onClick={handleScrape}
            disabled={loading || !url || !selectedProfileId || !apiToken}
            className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Processing...
              </>
            ) : (
              <>
                <Search className="w-4 h-4 mr-2" />
                Scrape & Analyze
              </>
            )}
          </button>
        </div>
      </div>

      {/* Results */}
      {result && (
        <div className="bg-white rounded-lg border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Scraping Results</h2>
          
          {result.status === 'failed' ? (
            <div className="flex items-center p-4 bg-red-50 rounded-lg">
              <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
              <div>
                <p className="text-red-800 font-medium">Scraping Failed</p>
                <p className="text-red-600 text-sm">{result.error}</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Score Overview */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`text-3xl font-bold ${getScoreColor(result.icpScore)}`}>
                    {result.icpScore || 0}%
                  </div>
                  <p className="text-sm text-gray-600 mt-1">ICP Score</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className={`inline-flex px-3 py-1 rounded-full text-sm font-medium ${getMatchLevelColor(result.icpMatchLevel)}`}>
                    {result.icpMatchLevel?.replace('_', ' ').toUpperCase() || 'UNKNOWN'}
                  </div>
                  <p className="text-sm text-gray-600 mt-2">Match Level</p>
                </div>
                
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="flex items-center justify-center text-gray-600">
                    <Clock className="w-4 h-4 mr-1" />
                    <span className="text-lg font-semibold">{result.processingTime || 0}ms</span>
                  </div>
                  <p className="text-sm text-gray-600 mt-1">Processing Time</p>
                </div>
              </div>

              {/* Recommendation */}
              {result.icpRecommendation && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2">AI Recommendation</h3>
                  <p className="text-blue-800">{result.icpRecommendation}</p>
                </div>
              )}

              {/* Insights */}
              {result.insights && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {result.insights.strengths.length > 0 && (
                    <div className="p-4 bg-green-50 rounded-lg">
                      <h3 className="font-medium text-green-900 mb-2 flex items-center">
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Strengths
                      </h3>
                      <ul className="text-green-800 text-sm space-y-1">
                        {result.insights.strengths.map((strength, index) => (
                          <li key={index}>• {strength}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.insights.opportunities.length > 0 && (
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <h3 className="font-medium text-yellow-900 mb-2 flex items-center">
                        <TrendingUp className="w-4 h-4 mr-2" />
                        Opportunities
                      </h3>
                      <ul className="text-yellow-800 text-sm space-y-1">
                        {result.insights.opportunities.map((opportunity, index) => (
                          <li key={index}>• {opportunity}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.insights.weaknesses.length > 0 && (
                    <div className="p-4 bg-orange-50 rounded-lg">
                      <h3 className="font-medium text-orange-900 mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Weaknesses
                      </h3>
                      <ul className="text-orange-800 text-sm space-y-1">
                        {result.insights.weaknesses.map((weakness, index) => (
                          <li key={index}>• {weakness}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.insights.redFlags.length > 0 && (
                    <div className="p-4 bg-red-50 rounded-lg">
                      <h3 className="font-medium text-red-900 mb-2 flex items-center">
                        <AlertCircle className="w-4 h-4 mr-2" />
                        Red Flags
                      </h3>
                      <ul className="text-red-800 text-sm space-y-1">
                        {result.insights.redFlags.map((flag, index) => (
                          <li key={index}>• {flag}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              )}

              {/* Actionable Recommendations */}
              {result.actionableRecommendations && result.actionableRecommendations.length > 0 && (
                <div className="p-4 bg-purple-50 rounded-lg">
                  <h3 className="font-medium text-purple-900 mb-2 flex items-center">
                    <Target className="w-4 h-4 mr-2" />
                    Next Steps
                  </h3>
                  <ul className="text-purple-800 text-sm space-y-1">
                    {result.actionableRecommendations.map((recommendation, index) => (
                      <li key={index}>• {recommendation}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ICPScraperTest;
