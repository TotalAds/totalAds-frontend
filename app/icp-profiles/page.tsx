"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import ICPProfileForm from "@/components/icp/ICPProfileForm";
import OnboardingProtectedLayout from "@/components/layout/OnboardingProtectedLayout";
import ConfirmDialog from "@/components/ui/ConfirmDialog";
import { useAuthContext } from "@/context/AuthContext";
import {
  activateICPProfile,
  createICPProfile,
  CreateICPProfileRequest,
  deactivateICPProfile,
  deleteICPProfile,
  getICPProfiles,
  ICPProfile,
  updateICPProfile,
} from "@/utils/api";
import {
  IconClock,
  IconCopy,
  IconEdit,
  IconExternalLink,
  IconEye,
  IconPlus,
  IconTarget,
  IconToggleLeft,
  IconToggleRight,
  IconTrash,
  IconTrendingUp,
  IconUsers,
  IconX,
} from "@tabler/icons-react";

interface ICPProfilesPageState {
  profiles: ICPProfile[];
  loading: boolean;
  error: string | null;
  selectedProfile: ICPProfile | null;
  showCreateForm: boolean;
  showEditForm: boolean;
  showViewModal: boolean;
  showDeleteConfirm: boolean;
  profileToDelete: ICPProfile | null;
  formLoading: boolean;
  formError: string | null;
  actionLoading: boolean;
  toastMessage: string | null;
}

export default function ICPProfilesPage() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading } = state;
  const router = useRouter();

  const [pageState, setPageState] = useState<ICPProfilesPageState>({
    profiles: [],
    loading: true,
    error: null,
    selectedProfile: null,
    showCreateForm: false,
    showEditForm: false,
    showViewModal: false,
    showDeleteConfirm: false,
    profileToDelete: null,
    formLoading: false,
    formError: null,
    actionLoading: false,
    toastMessage: null,
  });

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchProfiles();
    }
  }, [isAuthenticated]);

  const fetchProfiles = async () => {
    try {
      setPageState((prev) => ({ ...prev, loading: true, error: null }));
      const response = await getICPProfiles();
      setPageState((prev) => ({
        ...prev,
        profiles: response?.profiles || [],
        loading: false,
      }));
    } catch (error) {
      console.error("Error fetching ICP profiles:", error);
      setPageState((prev) => ({
        ...prev,
        error:
          error instanceof Error ? error.message : "Failed to fetch profiles",
        loading: false,
      }));
    }
  };

  const handleCreateProfile = () => {
    setPageState((prev) => ({
      ...prev,
      showCreateForm: true,
      selectedProfile: null,
    }));
  };

  const handleEditProfile = (profile: ICPProfile) => {
    setPageState((prev) => ({
      ...prev,
      showEditForm: true,
      selectedProfile: profile,
    }));
  };

  const handleDeleteProfile = (profile: ICPProfile) => {
    setPageState((prev) => ({
      ...prev,
      showDeleteConfirm: true,
      profileToDelete: profile,
    }));
  };

  const confirmDeleteProfile = async () => {
    if (!pageState.profileToDelete) return;

    try {
      setPageState((prev) => ({ ...prev, actionLoading: true }));
      await deleteICPProfile(pageState.profileToDelete.id);
      setPageState((prev) => ({
        ...prev,
        profiles: prev.profiles.filter(
          (p) => p.id !== prev.profileToDelete?.id
        ),
        showDeleteConfirm: false,
        profileToDelete: null,
        actionLoading: false,
      }));
      showToast("ICP profile deleted successfully!");
    } catch (error) {
      console.error("Error deleting profile:", error);
      setPageState((prev) => ({ ...prev, actionLoading: false }));
      showToast("Failed to delete profile. Please try again.");
    }
  };

  const handleToggleStatus = async (profile: ICPProfile) => {
    try {
      setPageState((prev) => ({ ...prev, actionLoading: true }));

      let updatedProfile: ICPProfile;
      if (profile.status === "active") {
        updatedProfile = await deactivateICPProfile(profile.id);
        showToast("ICP profile deactivated successfully!");
      } else {
        updatedProfile = await activateICPProfile(profile.id);
        showToast("ICP profile activated successfully!");
      }

      setPageState((prev) => ({
        ...prev,
        profiles: prev.profiles.map((p) =>
          p.id === profile.id ? updatedProfile : p
        ),
        actionLoading: false,
      }));
    } catch (error) {
      console.error("Error toggling profile status:", error);
      setPageState((prev) => ({ ...prev, actionLoading: false }));
      showToast("Failed to update profile status. Please try again.");
    }
  };

  const handleViewProfile = (profile: ICPProfile) => {
    setPageState((prev) => ({
      ...prev,
      selectedProfile: profile,
      showViewModal: true,
    }));
  };

  const handleFormSubmit = async (data: CreateICPProfileRequest) => {
    try {
      // Set loading state and clear any previous errors
      setPageState((prev) => ({
        ...prev,
        formLoading: true,
        formError: null,
        error: null,
      }));

      if (pageState.selectedProfile) {
        // Update existing profile
        const updatedProfile = await updateICPProfile(
          pageState.selectedProfile.id,
          data
        );
        setPageState((prev) => ({
          ...prev,
          profiles: prev.profiles.map((p) =>
            p.id === pageState.selectedProfile?.id ? updatedProfile : p
          ),
          formLoading: false,
        }));
      } else {
        // Create new profile
        const newProfile = await createICPProfile(data);
        setPageState((prev) => ({
          ...prev,
          profiles: [...prev?.profiles, newProfile],
          formLoading: false,
        }));
      }

      closeModals();
    } catch (error) {
      console.error("Error saving ICP profile:", error);

      let errorMessage = "Failed to save profile";

      if (error instanceof Error) {
        // Handle specific error cases
        if (
          error.message.includes(
            "duplicate key value violates unique constraint"
          ) ||
          error.message.includes("already exists")
        ) {
          errorMessage = `A profile with the name "${data.name}" already exists. Please choose a different name.`;
        } else if (error.message.includes("idx_icp_profiles_user_name")) {
          errorMessage = `A profile with the name "${data.name}" already exists. Please choose a different name.`;
        } else if (
          error.message.includes("Network Error") ||
          error.message.includes("fetch")
        ) {
          errorMessage =
            "Network error. Please check your connection and try again.";
        } else if (error.message.includes("timeout")) {
          errorMessage = "Request timed out. Please try again.";
        } else if (error.message.includes("500")) {
          errorMessage = "Server error. Please try again later.";
        } else if (
          error.message.includes("401") ||
          error.message.includes("unauthorized")
        ) {
          errorMessage =
            "You are not authorized to perform this action. Please log in again.";
        } else if (
          error.message.includes("403") ||
          error.message.includes("forbidden")
        ) {
          errorMessage = "You don't have permission to perform this action.";
        } else {
          errorMessage = error.message;
        }
      }

      setPageState((prev) => ({
        ...prev,
        formLoading: false,
        formError: errorMessage,
      }));
    }
  };

  const closeModals = () => {
    setPageState((prev) => ({
      ...prev,
      showCreateForm: false,
      showEditForm: false,
      showViewModal: false,
      showDeleteConfirm: false,
      selectedProfile: null,
      formLoading: false,
      formError: null,
    }));
  };

  const clearFormError = () => {
    setPageState((prev) => ({
      ...prev,
      formError: null,
    }));
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast(`${label} copied to clipboard!`);
    } catch (error) {
      console.error("Failed to copy to clipboard:", error);
      // Fallback for older browsers
      try {
        const textArea = document.createElement("textarea");
        textArea.value = text;
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand("copy");
        document.body.removeChild(textArea);
        showToast(`${label} copied to clipboard!`);
      } catch (fallbackError) {
        showToast(`Failed to copy ${label}. Please copy manually.`);
      }
    }
  };

  const showToast = (message: string) => {
    setPageState((prev) => ({ ...prev, toastMessage: message }));
    setTimeout(() => {
      setPageState((prev) => ({ ...prev, toastMessage: null }));
    }, 3000);
  };

  const handleUseInScraper = (profileId: string) => {
    // Navigate to scraper page with the ICP profile ID
    router.push(`/scraper?icpProfileId=${profileId}`);
  };

  const getMatchRate = (profile: ICPProfile) => {
    if (profile.totalScrapes === 0) return 0;
    return Math.round((profile.successfulMatches / profile.totalScrapes) * 100);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="relative">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500 mx-auto mb-4"></div>
            <div
              className="absolute inset-0 rounded-full h-16 w-16 border-4 border-transparent border-t-pink-500 animate-spin mx-auto"
              style={{
                animationDirection: "reverse",
                animationDuration: "1.5s",
              }}
            ></div>
          </div>
          <h3 className="text-xl font-semibold text-white mb-2">
            Loading ICP Profiles
          </h3>
          <p className="text-gray-400">
            Preparing your intelligent lead qualification system...
          </p>
        </div>
      </div>
    );
  }

  return (
    <OnboardingProtectedLayout>
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
        {/* Background decoration */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
          <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
          <div className="absolute top-40 left-40 w-80 h-80 bg-pink-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        </div>

        <div className="relative z-10 container mx-auto px-4 py-8">
          {/* Header */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between mb-8 gap-6">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-white mb-3">
                🎯 ICP Profiles
              </h1>
              <p className="text-gray-300 text-lg leading-relaxed">
                Create intelligent lead qualification profiles to identify your
                perfect customers automatically
              </p>
            </div>
            <button
              onClick={handleCreateProfile}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:scale-105"
            >
              <IconPlus className="w-5 h-5 mr-2" />
              Create ICP Profile
            </button>
          </div>

          {/* Value Proposition Section */}
          <div className="backdrop-blur-xl bg-gradient-to-r from-purple-500/10 to-pink-500/10 border border-purple-500/20 rounded-3xl p-8 mb-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
              <div>
                <h2 className="text-2xl font-bold text-white mb-4">
                  🚀 Why Create ICP Profiles?
                </h2>
                <p className="text-gray-300 mb-6 leading-relaxed">
                  Transform your lead generation with AI-powered customer
                  profiling. Define your ideal customer once, and let our
                  intelligent scraper automatically score and qualify every
                  prospect against your criteria.
                </p>
                <div className="space-y-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <IconTrendingUp className="w-4 h-4 text-green-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        Smart Lead Scoring
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Automatically score prospects from 0-100% based on your
                        custom criteria
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <IconTarget className="w-4 h-4 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        Custom AI Analysis
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Define specific prompts for business model, market, and
                        technology analysis
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mt-0.5 flex-shrink-0">
                      <IconUsers className="w-4 h-4 text-purple-400" />
                    </div>
                    <div>
                      <h3 className="text-white font-semibold mb-1">
                        Actionable Insights
                      </h3>
                      <p className="text-gray-400 text-sm">
                        Get detailed recommendations on why prospects match or
                        don&apos;t match
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-white font-semibold">
                      Sample ICP Score
                    </h3>
                    <span className="text-green-400 font-bold text-xl">
                      87%
                    </span>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">
                        Business Model
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="w-4/5 h-full bg-green-400 rounded-full"></div>
                        </div>
                        <span className="text-green-400 text-sm font-medium">
                          95%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">
                        Company Size
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="w-3/5 h-full bg-yellow-400 rounded-full"></div>
                        </div>
                        <span className="text-yellow-400 text-sm font-medium">
                          78%
                        </span>
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-300 text-sm">
                        Technology Stack
                      </span>
                      <div className="flex items-center space-x-2">
                        <div className="w-20 h-2 bg-gray-700 rounded-full overflow-hidden">
                          <div className="w-4/5 h-full bg-blue-400 rounded-full"></div>
                        </div>
                        <span className="text-blue-400 text-sm font-medium">
                          92%
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 p-3 bg-green-500/10 border border-green-500/20 rounded-lg">
                    <p className="text-green-300 text-sm">
                      <strong>Recommendation:</strong> High-quality lead! Strong
                      SaaS model alignment with target market.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Error State */}
          {pageState.error && (
            <div className="backdrop-blur-xl bg-red-500/10 border border-red-500/20 rounded-3xl p-6 mb-8">
              <p className="text-red-300">{pageState.error}</p>
              <button
                onClick={fetchProfiles}
                className="mt-4 px-4 py-2 bg-red-500/20 text-red-300 rounded-lg hover:bg-red-500/30 transition-colors"
              >
                Retry
              </button>
            </div>
          )}

          {/* Loading State */}
          {pageState.loading ? (
            <div className="backdrop-blur-xl bg-white/10 border border-white/20 rounded-3xl p-12 text-center">
              <div className="relative mb-6">
                <div className="animate-spin rounded-full h-16 w-16 border-4 border-purple-500/30 border-t-purple-500 mx-auto"></div>
                <div
                  className="absolute inset-0 animate-spin rounded-full h-16 w-16 border-4 border-transparent border-t-pink-500 mx-auto"
                  style={{
                    animationDirection: "reverse",
                    animationDuration: "1.5s",
                  }}
                ></div>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">
                Loading ICP Profiles
              </h3>
              <p className="text-gray-300">
                Fetching your intelligent lead qualification profiles...
              </p>
              <div className="flex justify-center space-x-1 mt-4">
                <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"></div>
                <div
                  className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.1s" }}
                ></div>
                <div
                  className="w-2 h-2 bg-purple-500 rounded-full animate-bounce"
                  style={{ animationDelay: "0.2s" }}
                ></div>
              </div>
            </div>
          ) : pageState.profiles?.length === 0 ? (
            /* Enhanced Empty State */
            <div className="backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-12 text-center">
              <div className="relative mb-6">
                <div className="w-24 h-24 bg-gradient-to-br from-purple-500/20 to-pink-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <IconTarget className="w-12 h-12 text-purple-400" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                  <IconPlus className="w-3 h-3 text-white" />
                </div>
              </div>
              <h3 className="text-2xl font-bold text-white mb-3">
                Ready to Find Your Perfect Customers?
              </h3>
              <p className="text-gray-300 mb-8 max-w-md mx-auto leading-relaxed">
                Create your first ICP Profile to unlock intelligent lead
                qualification. Our AI will automatically score every prospect
                against your ideal customer criteria.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8 max-w-2xl mx-auto">
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="w-8 h-8 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-green-400 font-bold text-sm">1</span>
                  </div>
                  <h4 className="text-white font-medium text-sm mb-1">
                    Define Criteria
                  </h4>
                  <p className="text-gray-400 text-xs">
                    Set your ideal customer parameters
                  </p>
                </div>
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="w-8 h-8 bg-blue-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-blue-400 font-bold text-sm">2</span>
                  </div>
                  <h4 className="text-white font-medium text-sm mb-1">
                    AI Analysis
                  </h4>
                  <p className="text-gray-400 text-xs">
                    Let AI score every prospect
                  </p>
                </div>
                <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-4">
                  <div className="w-8 h-8 bg-purple-500/20 rounded-full flex items-center justify-center mx-auto mb-2">
                    <span className="text-purple-400 font-bold text-sm">3</span>
                  </div>
                  <h4 className="text-white font-medium text-sm mb-1">
                    Get Results
                  </h4>
                  <p className="text-gray-400 text-xs">
                    Receive qualified leads instantly
                  </p>
                </div>
              </div>

              <button
                onClick={handleCreateProfile}
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg shadow-purple-500/25 hover:shadow-purple-500/40 transform hover:scale-105 font-semibold"
              >
                <IconPlus className="w-5 h-5 mr-2" />
                Create Your First ICP Profile
              </button>

              <p className="text-gray-400 text-sm mt-4">
                ✨ Start with our smart templates or build from scratch
              </p>
            </div>
          ) : (
            /* Enhanced Profiles Grid */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {pageState.profiles?.map((profile) => (
                <div
                  key={profile.id}
                  className="group backdrop-blur-xl bg-gradient-to-br from-white/10 to-white/5 border border-white/20 rounded-3xl p-6 shadow-2xl hover:bg-gradient-to-br hover:from-white/15 hover:to-white/10 transition-all duration-300 hover:scale-105 hover:shadow-purple-500/20"
                >
                  {/* Profile Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center space-x-2 mb-2">
                        <div className="w-3 h-3 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full"></div>
                        <h3 className="text-lg font-bold text-white">
                          {profile?.name}
                        </h3>
                      </div>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          profile?.status === "active"
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : profile?.status === "draft"
                            ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                            : profile?.status === "inactive"
                            ? "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                            : "bg-red-500/20 text-red-300 border border-red-500/30"
                        }`}
                      >
                        {profile?.status.toUpperCase()}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                      <button
                        onClick={() => handleViewProfile(profile)}
                        className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all duration-200"
                        title="View Details"
                      >
                        <IconEye className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleToggleStatus(profile)}
                        disabled={pageState.actionLoading}
                        className={`p-2 rounded-lg transition-all duration-200 disabled:opacity-50 ${
                          profile?.status === "active"
                            ? "text-green-400 hover:text-green-300 hover:bg-green-500/10"
                            : "text-gray-400 hover:text-green-400 hover:bg-green-500/10"
                        }`}
                        title={
                          profile?.status === "active"
                            ? "Deactivate Profile"
                            : "Activate Profile"
                        }
                      >
                        {profile?.status === "active" ? (
                          <IconToggleRight className="w-4 h-4" />
                        ) : (
                          <IconToggleLeft className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleEditProfile(profile)}
                        className="p-2 text-gray-400 hover:text-purple-400 hover:bg-purple-500/10 rounded-lg transition-all duration-200"
                        title="Edit Profile"
                      >
                        <IconEdit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteProfile(profile)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                        title="Delete Profile"
                      >
                        <IconTrash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Profile Description */}
                  {profile.description && (
                    <div className="mb-4">
                      <p className="text-gray-300 text-sm leading-relaxed line-clamp-2">
                        {profile.description}
                      </p>
                    </div>
                  )}

                  {/* Profile ID Section */}
                  <div className="mb-4 p-3 bg-gray-900/50 border border-gray-700/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <label className="text-xs text-gray-400 font-medium mb-1 block">
                          Profile ID
                        </label>
                        <div className="flex items-center space-x-2">
                          <code className="text-sm text-gray-300 font-mono bg-gray-800/50 px-2 py-1 rounded border">
                            {profile.id}
                          </code>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                profile.id.toString(),
                                "Profile ID"
                              )
                            }
                            className="p-1 text-gray-400 hover:text-blue-400 hover:bg-blue-500/10 rounded transition-all duration-200"
                            title="Copy Profile ID"
                          >
                            <IconCopy className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Profile Stats */}
                  <div className="grid grid-cols-3 gap-3 mb-6">
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <IconUsers className="w-4 h-4 text-blue-400 mr-1" />
                        <div className="text-lg font-bold text-white">
                          {profile.totalScrapes}
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        Total Scrapes
                      </div>
                    </div>
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <IconTrendingUp className="w-4 h-4 text-green-400 mr-1" />
                        <div className="text-lg font-bold text-green-400">
                          {getMatchRate(profile)}%
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        Match Rate
                      </div>
                    </div>
                    <div className="backdrop-blur-xl bg-white/5 border border-white/10 rounded-xl p-3 text-center">
                      <div className="flex items-center justify-center mb-1">
                        <IconTarget className="w-4 h-4 text-purple-400 mr-1" />
                        <div className="text-lg font-bold text-purple-400">
                          {profile.minimumScore}%
                        </div>
                      </div>
                      <div className="text-xs text-gray-400 font-medium">
                        Min Score
                      </div>
                    </div>
                  </div>

                  {/* Enhanced Last Used */}
                  <div className="flex items-center justify-between pt-4 border-t border-white/10 mb-4">
                    <div className="flex items-center text-xs text-gray-400">
                      <IconClock className="w-3 h-3 mr-1" />
                      <span>
                        Last used:{" "}
                        {profile.lastUsedAt
                          ? new Date(profile.lastUsedAt).toLocaleDateString()
                          : "Never"}
                      </span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <div
                        className={`w-2 h-2 rounded-full ${
                          profile.status === "active"
                            ? "bg-green-400"
                            : profile.status === "draft"
                            ? "bg-yellow-400"
                            : profile.status === "inactive"
                            ? "bg-gray-400"
                            : "bg-red-400"
                        }`}
                      ></div>
                      <span className="text-xs text-gray-400 capitalize">
                        {profile.status}
                      </span>
                    </div>
                  </div>

                  {/* Use in Scraper Button */}
                  <button
                    onClick={() => handleUseInScraper(profile.id.toString())}
                    className="w-full flex items-center justify-center space-x-2 px-4 py-3 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white rounded-xl transition-all duration-200 transform hover:scale-105 shadow-lg hover:shadow-purple-500/25"
                  >
                    <IconExternalLink className="w-4 h-4" />
                    <span className="font-semibold">Use in Scraper</span>
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* ICP Profile Form Modal */}
        <ICPProfileForm
          isOpen={pageState.showCreateForm || pageState.showEditForm}
          onClose={closeModals}
          onSubmit={handleFormSubmit}
          initialData={pageState.selectedProfile}
          isLoading={pageState.formLoading}
          existingProfiles={pageState.profiles || []}
          formError={pageState.formError}
          onClearFormError={clearFormError}
        />

        {/* Delete Confirmation Modal */}
        <ConfirmDialog
          isOpen={pageState.showDeleteConfirm}
          onClose={() =>
            setPageState((prev) => ({
              ...prev,
              showDeleteConfirm: false,
              profileToDelete: null,
            }))
          }
          onConfirm={confirmDeleteProfile}
          title="Delete ICP Profile"
          message={`Are you sure you want to delete "${pageState.profileToDelete?.name}"? This action cannot be undone and will permanently remove all associated data.`}
          confirmText="Delete Profile"
          cancelText="Cancel"
          type="danger"
          isLoading={pageState.actionLoading}
        />

        {/* View Profile Modal */}
        {pageState.showViewModal && pageState.selectedProfile && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
                  <div className="flex items-center space-x-3">
                    <div className="p-2 rounded-lg bg-blue-500/20">
                      <IconEye className="w-5 h-5 text-blue-400" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-white">
                        {pageState.selectedProfile.name}
                      </h3>
                      <p className="text-sm text-gray-400">
                        ICP Profile Details
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() =>
                      setPageState((prev) => ({
                        ...prev,
                        showViewModal: false,
                      }))
                    }
                    className="p-2 text-gray-400 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-6">
                  {/* Basic Info */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Status
                      </label>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold ${
                          pageState.selectedProfile.status === "active"
                            ? "bg-green-500/20 text-green-300 border border-green-500/30"
                            : pageState.selectedProfile.status === "draft"
                            ? "bg-yellow-500/20 text-yellow-300 border border-yellow-500/30"
                            : "bg-gray-500/20 text-gray-300 border border-gray-500/30"
                        }`}
                      >
                        {pageState.selectedProfile.status.toUpperCase()}
                      </span>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Scoring Method
                      </label>
                      <p className="text-white capitalize">
                        {pageState.selectedProfile.scoringMethod.replace(
                          "_",
                          " "
                        )}
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Minimum Score
                      </label>
                      <p className="text-white">
                        {pageState.selectedProfile.minimumScore}%
                      </p>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Total Scrapes
                      </label>
                      <p className="text-white">
                        {pageState.selectedProfile.totalScrapes}
                      </p>
                    </div>
                  </div>

                  {/* Description */}
                  {pageState.selectedProfile.description && (
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <p className="text-gray-300 bg-gray-800/50 p-3 rounded-lg">
                        {pageState.selectedProfile.description}
                      </p>
                    </div>
                  )}

                  {/* Criteria */}
                  {pageState.selectedProfile.criteria &&
                    pageState.selectedProfile.criteria.length > 0 && (
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-3">
                          Criteria ({pageState.selectedProfile.criteria.length})
                        </label>
                        <div className="space-y-2">
                          {pageState.selectedProfile.criteria.map(
                            (criterion, index) => (
                              <div
                                key={criterion.id || index}
                                className="bg-gray-800/50 p-3 rounded-lg border border-gray-700/50"
                              >
                                <div className="flex items-center justify-between">
                                  <span className="text-white font-medium">
                                    {criterion.field} {criterion.operator}{" "}
                                    {criterion.value}
                                  </span>
                                  <span className="text-xs text-gray-400">
                                    Weight: {criterion.weight}
                                  </span>
                                </div>
                              </div>
                            )
                          )}
                        </div>
                      </div>
                    )}
                </div>

                {/* Actions */}
                <div className="flex items-center justify-end space-x-3 p-6 border-t border-gray-700/50">
                  <button
                    onClick={() =>
                      setPageState((prev) => ({
                        ...prev,
                        showViewModal: false,
                      }))
                    }
                    className="px-4 py-2 text-gray-300 hover:text-white hover:bg-gray-700/50 rounded-lg transition-all duration-200"
                  >
                    Close
                  </button>
                  <button
                    onClick={() => {
                      setPageState((prev) => ({
                        ...prev,
                        showViewModal: false,
                        showEditForm: true,
                      }));
                    }}
                    className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-all duration-200"
                  >
                    Edit Profile
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Toast Notification */}
        {pageState.toastMessage && (
          <div className="fixed bottom-4 right-4 z-50 animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-green-600 text-white px-4 py-3 rounded-lg shadow-lg flex items-center space-x-2">
              <IconCopy className="w-4 h-4" />
              <span className="font-medium">{pageState.toastMessage}</span>
            </div>
          </div>
        )}
      </div>
    </OnboardingProtectedLayout>
  );
}
