/* eslint-disable react/no-unescaped-entities */
"use client";

import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast from 'react-hot-toast';

import ICPTemplateSelector from '@/components/icp/ICPTemplateSelector';
import { useAuthContext } from '@/context/AuthContext';
import {
    activateICPProfile, createICPProfile, CreateICPProfileRequest, deactivateICPProfile,
    deleteICPProfile, getICPProfiles, ICPProfile, updateICPProfile, UpdateICPProfileRequest
} from '@/utils/api';
import { ICPTemplate } from '@/utils/icpTemplates';
import {
    IconCheck, IconCopy, IconEdit, IconEye, IconPlayerPause, IconPlayerPlay, IconPlus, IconSparkles,
    IconTarget, IconTrash, IconX
} from '@tabler/icons-react';

interface ICPField {
  name: string;
  description: string;
}

export default function ICPProfilesPage() {
  const { state } = useAuthContext();
  const { isAuthenticated, isLoading } = state;
  const router = useRouter();
  const [profiles, setProfiles] = useState<ICPProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newProfile, setNewProfile] = useState({ name: "", description: "" });
  const [fields, setFields] = useState<ICPField[]>([]);
  const [fieldInputMode, setFieldInputMode] = useState<"keyvalue" | "json">(
    "keyvalue"
  );
  const [jsonFields, setJsonFields] = useState("");
  const [newFieldName, setNewFieldName] = useState("");
  const [newFieldDescription, setNewFieldDescription] = useState("");

  // New state for additional functionality
  const [showViewModal, setShowViewModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ICPProfile | null>(
    null
  );
  const [editingProfile, setEditingProfile] = useState<ICPProfile | null>(null);
  const [profileToDelete, setProfileToDelete] = useState<string | null>(null);
  const [copiedProfileId, setCopiedProfileId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);

  // Loading states for individual actions
  const [loadingStates, setLoadingStates] = useState<{
    [key: string]: {
      viewing?: boolean;
      editing?: boolean;
      activating?: boolean;
      deactivating?: boolean;
      deleting?: boolean;
      updating?: boolean;
    };
  }>({});

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
      const response = await getICPProfiles();
      // Handle nested response structure - cast to any to handle different response formats
      const responseData = response as any;
      const profiles =
        responseData?.payload?.data?.profiles ||
        responseData?.data?.profiles ||
        responseData?.profiles ||
        responseData;
      setProfiles(Array.isArray(profiles) ? profiles : []);
    } catch (error) {
      console.error("Failed to fetch profiles:", error);
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  };

  const handleTemplateSelect = (template: ICPTemplate) => {
    setNewProfile({
      name: template.name,
      description: template.description,
    });
    // Set template fields if available
    if (template.fields) {
      setFields(
        template.fields.map((field) => ({
          name: field.name,
          description: field.description,
        }))
      );
    }
    setShowTemplateSelector(false);
    setShowCreateModal(true);
  };

  const addField = () => {
    // For create modal - use input fields
    if (newFieldName.trim() && newFieldDescription.trim()) {
      setFields([
        ...fields,
        { name: newFieldName, description: newFieldDescription },
      ]);
      setNewFieldName("");
      setNewFieldDescription("");
    } else {
      // For edit modal - add empty field
      setFields([...fields, { name: "", description: "" }]);
    }
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (
    index: number,
    key: "name" | "description",
    value: string
  ) => {
    const updatedFields = [...fields];
    updatedFields[index] = { ...updatedFields[index], [key]: value };
    setFields(updatedFields);
  };

  const handleJsonFieldsChange = (value: string) => {
    setJsonFields(value);
    try {
      const parsed = JSON.parse(value);
      if (Array.isArray(parsed)) {
        setFields(parsed);
      }
    } catch (error) {
      // Invalid JSON, ignore
    }
  };

  const resetForm = () => {
    setNewProfile({ name: "", description: "" });
    setFields([]);
    setJsonFields("");
    setNewFieldName("");
    setNewFieldDescription("");
    setFieldInputMode("keyvalue");
  };

  // Helper functions for loading states
  const setProfileLoading = (
    profileId: string,
    action: keyof (typeof loadingStates)[string],
    loading: boolean
  ) => {
    setLoadingStates((prev) => ({
      ...prev,
      [profileId]: {
        ...prev[profileId],
        [action]: loading,
      },
    }));
  };

  const getProfileLoading = (
    profileId: string,
    action: keyof (typeof loadingStates)[string]
  ) => {
    return loadingStates[profileId]?.[action] || false;
  };

  // New handler functions
  const handleViewProfile = (profile: ICPProfile) => {
    // Use existing profile data instead of making API call
    setSelectedProfile(profile);
    setShowViewModal(true);
  };

  const handleEditProfile = (profile: ICPProfile) => {
    setEditingProfile(profile);
    setNewProfile({
      name: profile.name,
      description: profile.description || "",
    });
    setFields(profile.fields || []);
    setShowEditModal(true);
  };

  const handleUpdateProfile = async () => {
    if (!editingProfile || !newProfile.name.trim()) {
      toast.error("Profile name is required");
      return;
    }

    // Filter out empty fields
    const validFields = fields.filter(
      (field) => field.name.trim() && field.description.trim()
    );

    if (validFields.length === 0) {
      toast.error("At least one field is required");
      return;
    }

    setProfileLoading(editingProfile.id, "updating", true);
    try {
      const request: UpdateICPProfileRequest = {
        name: newProfile.name.trim(),
        description: newProfile.description?.trim(),
        fields: validFields,
      };

      await updateICPProfile(editingProfile.id, request);
      toast.success("Profile updated successfully!");
      await fetchProfiles(); // Refetch data
      setShowEditModal(false);
      setEditingProfile(null);
      resetForm();
    } catch (error: any) {
      console.error("Failed to update profile:", error);

      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.error ||
        error?.message ||
        "Failed to update profile";

      toast.error(errorMessage);
    } finally {
      setProfileLoading(editingProfile.id, "updating", false);
    }
  };

  const handleActivateProfile = async (profileId: string) => {
    setProfileLoading(profileId, "activating", true);
    try {
      await activateICPProfile(profileId);
      toast.success("Profile activated successfully!");
      await fetchProfiles(); // Refetch data
    } catch (error: any) {
      console.error("Failed to activate profile:", error);

      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.error ||
        error?.message ||
        "Failed to activate profile";

      toast.error(errorMessage);
    } finally {
      setProfileLoading(profileId, "activating", false);
    }
  };

  const handleDeactivateProfile = async (profileId: string) => {
    setProfileLoading(profileId, "deactivating", true);
    try {
      await deactivateICPProfile(profileId);
      toast.success("Profile deactivated successfully!");
      await fetchProfiles(); // Refetch data
    } catch (error: any) {
      console.error("Failed to deactivate profile:", error);

      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.error ||
        error?.message ||
        "Failed to deactivate profile";

      toast.error(errorMessage);
    } finally {
      setProfileLoading(profileId, "deactivating", false);
    }
  };

  const handleCopyProfileId = async (profileId: string) => {
    try {
      await navigator.clipboard.writeText(profileId);
      setCopiedProfileId(profileId);
      toast.success("Profile ID copied to clipboard!");

      // Reset copied state after 2 seconds
      setTimeout(() => {
        setCopiedProfileId(null);
      }, 2000);
    } catch (error) {
      console.error("Failed to copy profile ID:", error);
      toast.error("Failed to copy profile ID");
    }
  };

  const handleDeleteConfirm = (profileId: string) => {
    setProfileToDelete(profileId);
    setShowDeleteConfirm(true);
  };

  const handleDeleteProfile = async () => {
    if (!profileToDelete) return;

    setProfileLoading(profileToDelete, "deleting", true);
    try {
      await deleteICPProfile(profileToDelete);
      toast.success("Profile deleted successfully!");
      await fetchProfiles(); // Refetch data
      setShowDeleteConfirm(false);
      setProfileToDelete(null);
    } catch (error: any) {
      console.error("Failed to delete profile:", error);

      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.error ||
        error?.message ||
        "Failed to delete profile";

      toast.error(errorMessage);
    } finally {
      if (profileToDelete) {
        setProfileLoading(profileToDelete, "deleting", false);
      }
    }
  };

  const handleCreateProfile = async () => {
    if (!newProfile.name.trim()) {
      toast.error("Profile name is required");
      return;
    }

    setIsCreating(true);
    try {
      const request: CreateICPProfileRequest = {
        name: newProfile.name,
        description: newProfile.description,
        fields:
          fields.length > 0
            ? fields
            : [
                { name: "Company Size", description: "Number of employees" },
                { name: "Industry", description: "Business sector" },
                { name: "Revenue", description: "Annual revenue range" },
              ],
      };

      await createICPProfile(request);
      toast.success("ICP Profile created successfully!");
      await fetchProfiles(); // Refetch data
      setShowCreateModal(false);
      resetForm();
    } catch (error: any) {
      console.error("Failed to create profile:", error);

      // Handle different error response structures
      const errorMessage =
        error?.response?.data?.error ||
        error?.response?.data?.message ||
        error?.error ||
        error?.message ||
        "Failed to create profile";

      toast.error(errorMessage);
    } finally {
      setIsCreating(false);
    }
  };

  if (isLoading || loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
          <h3 className="text-xl font-semibold text-white mb-2">Loading...</h3>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 relative">
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-purple-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-blue-500 rounded-full mix-blend-multiply filter blur-xl opacity-10 animate-pulse"></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 py-8 max-w-4xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-white mb-4">
            Smart Profiles ✨
          </h1>
          <p className="text-xl text-gray-300 mb-8">
            Set your ideal customer criteria
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
          <button
            onClick={() => setShowTemplateSelector(true)}
            className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg transform hover:scale-105"
          >
            <IconSparkles className="w-5 h-5 mr-2" />
            Use Template
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center px-8 py-4 bg-white/10 backdrop-blur-xl border border-white/20 text-white rounded-full hover:bg-white/20 transition-all duration-200"
          >
            <IconPlus className="w-5 h-5 mr-2" />
            Create Custom
          </button>
        </div>

        {/* Create Modal */}
        {showCreateModal && (
          <div
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
            onClick={(e) => {
              if (e.target === e.currentTarget && !isCreating) {
                setShowCreateModal(false);
                resetForm();
              }
            }}
          >
            <div className="relative w-full max-w-2xl">
              <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-white/10">
                  <h3 className="text-2xl font-bold text-white">
                    Create ICP Profile
                  </h3>
                  <button
                    onClick={() => {
                      setShowCreateModal(false);
                      resetForm();
                    }}
                    className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                  >
                    <IconX className="w-5 h-5" />
                  </button>
                </div>

                {/* Content */}
                <div className="p-6">
                  {/* Basic Info */}
                  <div className="space-y-4 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Profile Name
                      </label>
                      <input
                        type="text"
                        value={newProfile.name}
                        onChange={(e) =>
                          setNewProfile({ ...newProfile, name: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="e.g., SaaS Startups"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-300 mb-2">
                        Description
                      </label>
                      <textarea
                        value={newProfile.description}
                        onChange={(e) =>
                          setNewProfile({
                            ...newProfile,
                            description: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                        placeholder="Describe your ideal customer profile..."
                        rows={3}
                      />
                    </div>
                  </div>

                  {/* Field Input Mode Toggle */}
                  <div className="mb-6">
                    <label className="block text-sm font-medium text-gray-300 mb-3">
                      Add Fields
                    </label>
                    <div className="flex gap-2 mb-4">
                      <button
                        onClick={() => setFieldInputMode("keyvalue")}
                        className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                          fieldInputMode === "keyvalue"
                            ? "bg-purple-500 text-white"
                            : "bg-white/10 text-gray-300 hover:bg-white/20"
                        }`}
                      >
                        Key-Value
                      </button>
                      <button
                        onClick={() => setFieldInputMode("json")}
                        className={`px-4 py-2 rounded-xl transition-all duration-200 ${
                          fieldInputMode === "json"
                            ? "bg-purple-500 text-white"
                            : "bg-white/10 text-gray-300 hover:bg-white/20"
                        }`}
                      >
                        JSON
                      </button>
                    </div>

                    {fieldInputMode === "keyvalue" ? (
                      <div className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={newFieldName}
                            onChange={(e) => setNewFieldName(e.target.value)}
                            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Field name"
                          />
                          <input
                            type="text"
                            value={newFieldDescription}
                            onChange={(e) =>
                              setNewFieldDescription(e.target.value)
                            }
                            className="px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                            placeholder="Field description"
                          />
                        </div>
                        <button
                          onClick={addField}
                          className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-xl transition-all duration-200"
                        >
                          Add Field
                        </button>
                      </div>
                    ) : (
                      <div>
                        <textarea
                          value={jsonFields}
                          onChange={(e) =>
                            handleJsonFieldsChange(e.target.value)
                          }
                          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono text-sm"
                          placeholder='[{"name": "Company Size", "description": "Number of employees"}, {"name": "Industry", "description": "Business sector"}]'
                          rows={6}
                        />
                        <p className="text-xs text-gray-400 mt-2">
                          Enter fields as JSON array with "name" and
                          "description" properties
                        </p>
                      </div>
                    )}

                    {/* Current Fields */}
                    {fields.length > 0 && (
                      <div className="mt-4">
                        <h4 className="text-sm font-medium text-gray-300 mb-2">
                          Current Fields:
                        </h4>
                        <div className="space-y-2">
                          {fields.map((field, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between bg-white/5 rounded-xl p-3"
                            >
                              <div>
                                <span className="text-white font-medium">
                                  {field.name}
                                </span>
                                <span className="text-gray-400 text-sm ml-2">
                                  - {field.description}
                                </span>
                              </div>
                              <button
                                onClick={() => removeField(index)}
                                className="text-red-400 hover:text-red-300 transition-colors"
                              >
                                <IconTrash className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex gap-3 pt-6 border-t border-white/10">
                    <button
                      onClick={handleCreateProfile}
                      disabled={isCreating}
                      className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                    >
                      {isCreating && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      )}
                      {isCreating ? "Creating..." : "Create Profile"}
                    </button>
                    <button
                      onClick={() => {
                        setShowCreateModal(false);
                        resetForm();
                      }}
                      disabled={isCreating}
                      className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Profiles List */}
        {profiles.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {profiles.map((profile) => (
              <div
                key={profile.id}
                className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-3xl p-6 hover:bg-white/15 transition-all duration-200"
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                        profile.status === "active"
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : "bg-gradient-to-r from-gray-500 to-gray-600"
                      }`}
                    >
                      <IconTarget className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="text-xl font-bold text-white">
                          {profile.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs rounded-full ${
                            profile.status === "active"
                              ? "bg-green-500/20 text-green-400"
                              : "bg-gray-500/20 text-gray-400"
                          }`}
                        >
                          {profile.status}
                        </span>
                      </div>
                      <p className="text-gray-300 text-sm line-clamp-2 h-[2.5rem]">
                        {profile.description}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-s text-gray-400">ID:</span>
                        <button
                          onClick={() => handleCopyProfileId(profile.id)}
                          className="text-s text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                        >
                          {profile.id}
                          {copiedProfileId === profile.id ? (
                            <IconCheck className="w-3 h-3" />
                          ) : (
                            <IconCopy className="w-3 h-3" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {profile.fields?.length || 0}
                    </div>
                    <div className="text-xs text-gray-400">Fields</div>
                  </div>
                  <div className="text-center">
                    <div className="text-lg font-bold text-white">
                      {profile.totalScrapes || 0}
                    </div>
                    <div className="text-xs text-gray-400">Scrapes</div>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={() => handleViewProfile(profile)}
                    className="flex-1 px-3 py-2 bg-blue-500/20 text-blue-400 rounded-xl hover:bg-blue-500/30 transition-all duration-200 flex items-center justify-center gap-2"
                  >
                    <IconEye className="w-4 h-4" />
                    View
                  </button>
                  <button
                    onClick={() => handleEditProfile(profile)}
                    disabled={getProfileLoading(profile.id, "editing")}
                    className="flex-1 px-3 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl hover:bg-yellow-500/30 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <IconEdit className="w-4 h-4" />
                    Edit
                  </button>
                  <button
                    onClick={() =>
                      profile.status === "active"
                        ? handleDeactivateProfile(profile.id)
                        : handleActivateProfile(profile.id)
                    }
                    disabled={
                      getProfileLoading(profile.id, "activating") ||
                      getProfileLoading(profile.id, "deactivating")
                    }
                    className={`flex-1 px-3 py-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                      profile.status === "active"
                        ? "bg-orange-500/20 text-orange-400 hover:bg-orange-500/30"
                        : "bg-green-500/20 text-green-400 hover:bg-green-500/30"
                    }`}
                  >
                    {getProfileLoading(profile.id, "activating") ||
                    getProfileLoading(profile.id, "deactivating") ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current"></div>
                    ) : profile.status === "active" ? (
                      <>
                        <IconPlayerPause className="w-4 h-4" />
                        Pause
                      </>
                    ) : (
                      <>
                        <IconPlayerPlay className="w-4 h-4" />
                        Activate
                      </>
                    )}
                  </button>
                  <button
                    onClick={() => handleDeleteConfirm(profile.id)}
                    disabled={getProfileLoading(profile.id, "deleting")}
                    className="px-3 py-2 bg-red-500/20 text-red-400 rounded-xl hover:bg-red-500/30 transition-all duration-200 flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {getProfileLoading(profile.id, "deleting") ? (
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                    ) : (
                      <IconTrash className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <IconTarget className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4">
              No profiles yet
            </h3>
            <p className="text-gray-300 mb-8">
              Create your first smart profile to get started
            </p>
            <button
              onClick={() => setShowTemplateSelector(true)}
              className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:from-purple-600 hover:to-pink-600 transition-all duration-200 shadow-lg transform hover:scale-105"
            >
              <IconSparkles className="w-5 h-5 mr-2" />
              Get Started
            </button>
          </div>
        )}
      </div>

      {/* Template Selector Modal */}
      {showTemplateSelector && (
        <ICPTemplateSelector
          isOpen={showTemplateSelector}
          onSelectTemplate={handleTemplateSelect}
          onClose={() => setShowTemplateSelector(false)}
        />
      )}

      {/* View Profile Modal */}
      {showViewModal && selectedProfile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              setShowViewModal(false);
            }
          }}
        >
          <div className="relative w-full max-w-2xl">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-2xl font-bold text-white">
                  Profile Details
                </h3>
                <button
                  onClick={() => setShowViewModal(false)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="space-y-6">
                  {/* Basic Info */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">
                      Basic Information
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Name
                        </label>
                        <div className="text-white">{selectedProfile.name}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-300 mb-1">
                          Description
                        </label>
                        <div className="text-white">
                          {selectedProfile.description || "No description"}
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Status
                          </label>
                          <span
                            className={`px-2 py-1 text-xs rounded-full ${
                              selectedProfile.status === "active"
                                ? "bg-green-500/20 text-green-400"
                                : "bg-gray-500/20 text-gray-400"
                            }`}
                          >
                            {selectedProfile.status}
                          </span>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-300 mb-1">
                            Profile ID
                          </label>
                          <button
                            onClick={() =>
                              handleCopyProfileId(selectedProfile.id)
                            }
                            className="text-purple-400 hover:text-purple-300 transition-colors flex items-center gap-1"
                          >
                            {selectedProfile.id}
                            {copiedProfileId === selectedProfile.id ? (
                              <IconCheck className="w-3 h-3" />
                            ) : (
                              <IconCopy className="w-3 h-3" />
                            )}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Fields */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">
                      Fields ({selectedProfile.fields?.length || 0})
                    </h4>
                    {selectedProfile.fields &&
                    selectedProfile.fields.length > 0 ? (
                      <div className="space-y-3">
                        {selectedProfile.fields.map((field, index) => (
                          <div
                            key={index}
                            className="bg-white/5 rounded-xl p-4"
                          >
                            <div className="font-medium text-white">
                              {field.name}
                            </div>
                            <div className="text-gray-300 text-sm mt-1">
                              {field.description}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="text-gray-400">No fields defined</div>
                    )}
                  </div>

                  {/* Stats */}
                  <div>
                    <h4 className="text-lg font-semibold text-white mb-3">
                      Statistics
                    </h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-white">
                          {selectedProfile.totalScrapes || 0}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Total Scrapes
                        </div>
                      </div>
                      <div className="bg-white/5 rounded-xl p-4 text-center">
                        <div className="text-2xl font-bold text-white">
                          {selectedProfile.successfulMatches || 0}
                        </div>
                        <div className="text-gray-400 text-sm">
                          Successful Matches
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Profile Modal */}
      {showEditModal && editingProfile && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (
              e.target === e.currentTarget &&
              !getProfileLoading(editingProfile.id, "updating")
            ) {
              setShowEditModal(false);
              setEditingProfile(null);
              resetForm();
            }
          }}
        >
          <div className="relative w-full max-w-2xl">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-white/10">
                <h3 className="text-2xl font-bold text-white">Edit Profile</h3>
                <button
                  onClick={() => {
                    setShowEditModal(false);
                    setEditingProfile(null);
                    resetForm();
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              {/* Content - Reuse the same form structure as create modal */}
              <div className="p-6">
                {/* Basic Info */}
                <div className="space-y-4 mb-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Profile Name
                    </label>
                    <input
                      type="text"
                      value={newProfile.name}
                      onChange={(e) =>
                        setNewProfile({ ...newProfile, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="e.g., SaaS Startups"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-300 mb-2">
                      Description
                    </label>
                    <textarea
                      value={newProfile.description}
                      onChange={(e) =>
                        setNewProfile({
                          ...newProfile,
                          description: e.target.value,
                        })
                      }
                      className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500"
                      placeholder="Describe your ideal customer profile..."
                      rows={3}
                    />
                  </div>
                </div>

                {/* Fields Section */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="text-sm font-medium text-gray-300">
                      Profile Fields ({fields.length})
                    </h4>
                    <button
                      onClick={addField}
                      className="px-3 py-2 bg-purple-500/20 border border-purple-500/30 text-purple-400 rounded-lg hover:bg-purple-500/30 transition-all duration-200 flex items-center gap-2 text-sm"
                    >
                      <IconPlus className="w-4 h-4" />
                      Add Field
                    </button>
                  </div>

                  {fields.length > 0 ? (
                    <div className="space-y-3">
                      {fields.map((field, index) => (
                        <div
                          key={index}
                          className="bg-white/5 rounded-xl p-4 border border-white/10"
                        >
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-2">
                                Field Name
                              </label>
                              <input
                                type="text"
                                value={field.name}
                                onChange={(e) =>
                                  updateField(index, "name", e.target.value)
                                }
                                className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                placeholder="e.g., Company Size"
                              />
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-400 mb-2">
                                Description
                              </label>
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={field.description}
                                  onChange={(e) =>
                                    updateField(
                                      index,
                                      "description",
                                      e.target.value
                                    )
                                  }
                                  className="flex-1 px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm"
                                  placeholder="What to look for in this field"
                                />
                                <button
                                  onClick={() => removeField(index)}
                                  className="px-2 py-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-all duration-200"
                                  title="Remove field"
                                >
                                  <IconTrash className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-400">
                      <IconPlus className="w-8 h-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No fields added yet</p>
                      <p className="text-xs">
                        Click "Add Field" to get started
                      </p>
                    </div>
                  )}
                </div>

                {/* Actions */}
                <div className="flex gap-3 pt-6 border-t border-white/10">
                  <button
                    onClick={handleUpdateProfile}
                    disabled={
                      editingProfile
                        ? getProfileLoading(editingProfile.id, "updating")
                        : false
                    }
                    className="px-6 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:from-purple-600 hover:to-pink-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                  >
                    {editingProfile &&
                      getProfileLoading(editingProfile.id, "updating") && (
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      )}
                    {editingProfile &&
                    getProfileLoading(editingProfile.id, "updating")
                      ? "Updating..."
                      : "Update Profile"}
                  </button>
                  <button
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingProfile(null);
                      resetForm();
                    }}
                    disabled={
                      editingProfile
                        ? getProfileLoading(editingProfile.id, "updating")
                        : false
                    }
                    className="px-6 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && profileToDelete && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4"
          onClick={(e) => {
            if (
              e.target === e.currentTarget &&
              !getProfileLoading(profileToDelete, "deleting")
            ) {
              setShowDeleteConfirm(false);
              setProfileToDelete(null);
            }
          }}
        >
          <div className="relative w-full max-w-md">
            <div className="bg-slate-900/95 backdrop-blur-xl border border-red-500/20 rounded-2xl shadow-2xl">
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-red-500/20">
                <h3 className="text-xl font-bold text-white">Delete Profile</h3>
                <button
                  onClick={() => {
                    setShowDeleteConfirm(false);
                    setProfileToDelete(null);
                  }}
                  className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-all duration-200"
                >
                  <IconX className="w-5 h-5" />
                </button>
              </div>

              {/* Content */}
              <div className="p-6">
                <div className="text-center">
                  <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <IconTrash className="w-8 h-8 text-red-400" />
                  </div>
                  <h4 className="text-lg font-semibold text-white mb-2">
                    Are you sure?
                  </h4>
                  <p className="text-gray-300 mb-6">
                    This action cannot be undone. This will permanently delete
                    the ICP profile and all associated data.
                  </p>
                  <div className="flex gap-3">
                    <button
                      onClick={() => {
                        setShowDeleteConfirm(false);
                        setProfileToDelete(null);
                      }}
                      disabled={
                        profileToDelete
                          ? getProfileLoading(profileToDelete, "deleting")
                          : false
                      }
                      className="flex-1 px-4 py-2 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleDeleteProfile}
                      disabled={
                        profileToDelete
                          ? getProfileLoading(profileToDelete, "deleting")
                          : false
                      }
                      className="flex-1 px-4 py-2 bg-red-500 text-white rounded-xl hover:bg-red-600 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      {profileToDelete &&
                        getProfileLoading(profileToDelete, "deleting") && (
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                        )}
                      {profileToDelete &&
                      getProfileLoading(profileToDelete, "deleting")
                        ? "Deleting..."
                        : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
