"use client";

import React, { useState, useEffect } from 'react';
import { Plus, Target, TrendingUp, Users, Settings, Trash2 } from 'lucide-react';

interface ICPProfile {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'inactive' | 'draft' | 'archived';
  scoringMethod: string;
  minimumScore: number;
  totalScrapes: number;
  successfulMatches: number;
  lastUsedAt?: string;
  createdAt: string;
  criteria?: Array<{
    id: string;
    category: string;
    field: string;
    operator: string;
    value: any;
    weight: number;
  }>;
}

const ICPProfileManager: React.FC = () => {
  const [profiles, setProfiles] = useState<ICPProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedProfile, setSelectedProfile] = useState<ICPProfile | null>(null);

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    try {
      const response = await fetch('/api/icp-management/profiles', {
        credentials: 'include',
      });
      
      if (response.ok) {
        const data = await response.json();
        setProfiles(data.data.profiles);
      }
    } catch (error) {
      console.error('Failed to fetch ICP profiles:', error);
    } finally {
      setLoading(false);
    }
  };

  const deleteProfile = async (profileId: string) => {
    if (!confirm('Are you sure you want to delete this ICP profile?')) {
      return;
    }

    try {
      const response = await fetch(`/api/icp-management/profiles/${profileId}`, {
        method: 'DELETE',
        credentials: 'include',
      });

      if (response.ok) {
        setProfiles(profiles.filter(p => p.id !== profileId));
      }
    } catch (error) {
      console.error('Failed to delete profile:', error);
    }
  };

  const getSuccessRate = (profile: ICPProfile) => {
    if (profile.totalScrapes === 0) return 0;
    return Math.round((profile.successfulMatches / profile.totalScrapes) * 100);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-gray-100 text-gray-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
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
            Manage your Ideal Customer Profiles for intelligent lead qualification
          </p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
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
              <p className="text-sm font-medium text-gray-500">Total Profiles</p>
              <p className="text-2xl font-bold text-gray-900">{profiles.length}</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg border border-gray-200 p-4">
          <div className="flex items-center">
            <TrendingUp className="w-8 h-8 text-green-600" />
            <div className="ml-3">
              <p className="text-sm font-medium text-gray-500">Active Profiles</p>
              <p className="text-2xl font-bold text-gray-900">
                {profiles.filter(p => p.status === 'active').length}
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
              <p className="text-sm font-medium text-gray-500">Avg Success Rate</p>
              <p className="text-2xl font-bold text-gray-900">
                {profiles.length > 0 
                  ? Math.round(profiles.reduce((sum, p) => sum + getSuccessRate(p), 0) / profiles.length)
                  : 0}%
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Profiles List */}
      <div className="bg-white rounded-lg border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Your ICP Profiles</h2>
        </div>
        
        {profiles.length === 0 ? (
          <div className="text-center py-12">
            <Target className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No ICP Profiles Yet</h3>
            <p className="text-gray-600 mb-4">
              Create your first Ideal Customer Profile to start intelligent lead qualification
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Your First ICP Profile
            </button>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {profiles.map((profile) => (
              <div key={profile.id} className="p-6 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3">
                      <h3 className="text-lg font-medium text-gray-900">{profile.name}</h3>
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getStatusColor(profile.status)}`}>
                        {profile.status}
                      </span>
                    </div>
                    
                    {profile.description && (
                      <p className="text-gray-600 mt-1">{profile.description}</p>
                    )}
                    
                    <div className="flex items-center space-x-6 mt-3 text-sm text-gray-500">
                      <span>Scoring: {profile.scoringMethod.replace('_', ' ')}</span>
                      <span>Min Score: {profile.minimumScore}%</span>
                      <span>Criteria: {profile.criteria?.length || 0}</span>
                      <span>Scrapes: {profile.totalScrapes}</span>
                      <span>Success Rate: {getSuccessRate(profile)}%</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => setSelectedProfile(profile)}
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
      {(showCreateForm || selectedProfile) && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">
                {selectedProfile ? 'Edit ICP Profile' : 'Create New ICP Profile'}
              </h2>
              
              <div className="text-center py-8 text-gray-500">
                <p>ICP Profile creation form will be implemented here.</p>
                <p className="text-sm mt-2">This includes:</p>
                <ul className="text-sm mt-2 space-y-1">
                  <li>• Profile name and description</li>
                  <li>• Custom AI prompts</li>
                  <li>• Scoring criteria and weights</li>
                  <li>• Required data points selection</li>
                </ul>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateForm(false);
                    setSelectedProfile(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Cancel
                </button>
                <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors">
                  {selectedProfile ? 'Update Profile' : 'Create Profile'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ICPProfileManager;
