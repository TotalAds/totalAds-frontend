"use client";

import {
  Plus,
  Save,
  Settings,
  Target,
  Trash2,
  TrendingUp,
  Users,
  X,
} from "lucide-react";
import React, { useEffect, useState } from "react";

import {
  createICPProfile,
  CreateICPProfileRequest,
  deleteICPProfile,
  getICPProfiles,
  ICPProfile,
  updateICPProfile,
} from "@/utils/api";

interface FormData {
  name: string;
  description: string;
  scoringMethod:
    | "weighted_average"
    | "threshold_based"
    | "ai_powered"
    | "custom";
  minimumScore: number;
  customPrompts: {
    businessModel: string;
    targetMarket: string;
    companySize: string;
    technology: string;
    industry: string;
    userRemarks: string;
  };
  requiredDataPoints: {
    contactInfo: boolean;
    companySize: boolean;
    industry: boolean;
    revenue: boolean;
    location: boolean;
    technology: boolean;
    socialPresence: boolean;
    fundingStage: boolean;
    businessModel: boolean;
    targetMarket: boolean;
  };
}

const ICPProfileManager: React.FC = () => {
  const [profiles, setProfiles] = useState<ICPProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ICPProfile | null>(
    null
  );
  const [formData, setFormData] = useState<FormData>({
    name: "",
    description: "",
    scoringMethod: "weighted_average",
    minimumScore: 70,
    customPrompts: {
      businessModel: "",
      targetMarket: "",
      companySize: "",
      technology: "",
      industry: "",
      userRemarks: "",
    },
    requiredDataPoints: {
      contactInfo: true,
      companySize: true,
      industry: true,
      revenue: false,
      location: true,
      technology: false,
      socialPresence: false,
      fundingStage: false,
      businessModel: false,
      targetMarket: false,
    },
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await getICPProfiles();
      setProfiles(response.profiles);
    } catch (error) {
      console.error("Failed to fetch ICP profiles:", error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!confirm("Are you sure you want to delete this ICP profile?")) {
      return;
    }

    try {
      await deleteICPProfile(profileId);
      setProfiles(profiles.filter((p) => p.id !== profileId));
    } catch (error) {
      console.error("Failed to delete profile:", error);
    }
  };

  const getSuccessRate = (profile: ICPProfile) => {
    if (profile.totalScrapes === 0) return 0;
    return Math.round((profile.successfulMatches / profile.totalScrapes) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "draft":
        return "bg-yellow-100 text-yellow-800";
      case "archived":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      scoringMethod: "weighted_average",
      minimumScore: 70,
      customPrompts: {
        businessModel: "",
        targetMarket: "",
        companySize: "",
        technology: "",
        industry: "",
        userRemarks: "",
      },
      requiredDataPoints: {
        contactInfo: true,
        companySize: true,
        industry: true,
        revenue: false,
        location: true,
        technology: false,
        socialPresence: false,
        fundingStage: false,
        businessModel: false,
        targetMarket: false,
      },
    });
  };

  const handleCreateProfile = () => {
    resetForm();
    setSelectedProfile(null);
    setShowCreateForm(true);
  };

  const handleEditProfile = (profile: ICPProfile) => {
    setFormData({
      name: profile.name,
      description: profile.description || "",
      scoringMethod: profile.scoringMethod,
      minimumScore: profile.minimumScore,
      customPrompts: {
        businessModel: profile.customPrompts?.businessModel || "",
        targetMarket: profile.customPrompts?.targetMarket || "",
        companySize: profile.customPrompts?.companySize || "",
        technology: profile.customPrompts?.technology || "",
        industry: profile.customPrompts?.industry || "",
        userRemarks: profile.customPrompts?.userRemarks || "",
      },
      requiredDataPoints: profile.requiredDataPoints || {
        contactInfo: true,
        companySize: true,
        industry: true,
        revenue: false,
        location: true,
        technology: false,
        socialPresence: false,
        fundingStage: false,
        businessModel: false,
        targetMarket: false,
      },
    });
    setSelectedProfile(profile);
    setShowCreateForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    setSubmitting(true);
    try {
      if (selectedProfile) {
        await updateICPProfile(selectedProfile.id, formData);
      } else {
        await createICPProfile(formData);
      }
      await fetchProfiles();
      setShowCreateForm(false);
      resetForm();
      setSelectedProfile(null);
    } catch (error) {
      console.error("Failed to save profile:", error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">ICP Profiles</h1>
          <p className="text-gray-600 mt-1">
            Manage your Ideal Customer Profiles for intelligent lead
            qualification
          </p>
        </div>
        <button
          onClick={handleCreateProfile}
          className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
        >
          <Plus className="w-4 h-4 mr-2" />
          Create ICP Profile
        </button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Target className="w-8 h-8 text-blue-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Total Profiles
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {profiles.length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Active Profiles
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {profiles.filter((p) => p.status === "active").length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Users className="w-8 h-8 text-purple-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Total Scrapes</p>
              <p className="text-2xl font-bold text-gray-900">
                {profiles.reduce((sum, p) => sum + p.totalScrapes, 0)}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <Settings className="w-8 h-8 text-orange-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">
                Avg Success Rate
              </p>
              <p className="text-2xl font-bold text-gray-900">
                {profiles.length > 0
                  ? Math.round(
                      profiles.reduce((sum, p) => sum + getSuccessRate(p), 0) /
                        profiles.length
                    )
                  : 0}
                %
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profiles List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">
            Your ICP Profiles
          </h2>
        </div>

        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No ICP Profiles Yet
            </h3>
            <p className="text-gray-600 mb-4">
              Create your first Ideal Customer Profile to start intelligent lead
              qualification
            </p>
            <button
              onClick={handleCreateProfile}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First ICP Profile
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="p-6 hover:bg-gray-50 transition-colors"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">
                        {profile.name}
                      </h3>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(
                          profile.status
                        )}`}
                      >
                        {profile.status}
                      </span>
                    </div>

                    {profile.description && (
                      <p className="text-gray-600 mt-1">
                        {profile.description}
                      </p>
                    )}

                    <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                      <span>
                        Scoring: {profile.scoringMethod.replace("_", " ")}
                      </span>
                      <span>Min Score: {profile.minimumScore}%</span>
                      <span>Criteria: {profile.criteria?.length || 0}</span>
                      <span>Scrapes: {profile.totalScrapes}</span>
                      <span>Success Rate: {getSuccessRate(profile)}%</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => handleEditProfile(profile)}
                      className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Edit Profile"
                    >
                      <Settings className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => deleteProfile(profile.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete Profile"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Form Modal */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <form onSubmit={handleSubmit}>
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-gray-900">
                    {selectedProfile
                      ? "Edit ICP Profile"
                      : "Create New ICP Profile"}
                  </h2>
                  <button
                    type="button"
                    onClick={() => {
                      setShowCreateForm(false);
                      setSelectedProfile(null);
                      resetForm();
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                {/* Basic Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Basic Information
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Profile Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            name: e.target.value,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., SaaS Startups"
                        required
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Minimum Score (%)
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        value={formData.minimumScore}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            minimumScore: parseInt(e.target.value) || 0,
                          }))
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Description
                    </label>
                    <textarea
                      value={formData.description}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          description: e.target.value,
                        }))
                      }
                      rows={3}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      placeholder="Describe your ideal customer profile..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Scoring Method
                    </label>
                    <select
                      value={formData.scoringMethod}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          scoringMethod: e.target.value as any,
                        }))
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="weighted_average">Weighted Average</option>
                      <option value="threshold_based">Threshold Based</option>
                      <option value="ai_powered">AI Powered</option>
                      <option value="custom">Custom</option>
                    </select>
                  </div>
                </div>

                {/* Custom AI Prompts */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Custom AI Prompts
                  </h3>
                  <p className="text-sm text-gray-600">
                    Define specific criteria for AI to analyze when scoring
                    prospects
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Business Model
                      </label>
                      <textarea
                        value={formData.customPrompts.businessModel}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customPrompts: {
                              ...prev.customPrompts,
                              businessModel: e.target.value,
                            },
                          }))
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., SaaS, B2B, subscription-based..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Target Market
                      </label>
                      <textarea
                        value={formData.customPrompts.targetMarket}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customPrompts: {
                              ...prev.customPrompts,
                              targetMarket: e.target.value,
                            },
                          }))
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., SMBs, enterprises, specific industries..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Company Size
                      </label>
                      <textarea
                        value={formData.customPrompts.companySize}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customPrompts: {
                              ...prev.customPrompts,
                              companySize: e.target.value,
                            },
                          }))
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., 10-50 employees, $1M-$10M revenue..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Technology Stack
                      </label>
                      <textarea
                        value={formData.customPrompts.technology}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customPrompts: {
                              ...prev.customPrompts,
                              technology: e.target.value,
                            },
                          }))
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., React, AWS, Salesforce..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Industry
                      </label>
                      <textarea
                        value={formData.customPrompts.industry}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customPrompts: {
                              ...prev.customPrompts,
                              industry: e.target.value,
                            },
                          }))
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="e.g., fintech, healthcare, e-commerce..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        User Remarks
                      </label>
                      <textarea
                        value={formData.customPrompts.userRemarks}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            customPrompts: {
                              ...prev.customPrompts,
                              userRemarks: e.target.value,
                            },
                          }))
                        }
                        rows={2}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Additional criteria or notes for AI analysis..."
                      />
                    </div>
                  </div>
                </div>

                {/* Required Data Points */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-900">
                    Required Data Points
                  </h3>
                  <p className="text-sm text-gray-600">
                    Select which data points should always be extracted during
                    scraping
                  </p>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    {Object.entries(formData.requiredDataPoints).map(
                      ([key, value]) => (
                        <label
                          key={key}
                          className="flex items-center space-x-2 cursor-pointer"
                        >
                          <input
                            type="checkbox"
                            checked={value}
                            onChange={(e) =>
                              setFormData((prev) => ({
                                ...prev,
                                requiredDataPoints: {
                                  ...prev.requiredDataPoints,
                                  [key]: e.target.checked,
                                },
                              }))
                            }
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm text-gray-700 capitalize">
                            {key.replace(/([A-Z])/g, " $1").trim()}
                          </span>
                        </label>
                      )
                    )}
                  </div>
                </div>
              </div>

              {/* Form Actions */}
              <div className="p-6 border-t border-gray-200 bg-gray-50 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedProfile(null);
                    resetForm();
                  }}
                  className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || !formData.name.trim()}
                  className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      {selectedProfile ? "Updating..." : "Creating..."}
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4 mr-2" />
                      {selectedProfile ? "Update Profile" : "Create Profile"}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ICPProfileManager;
