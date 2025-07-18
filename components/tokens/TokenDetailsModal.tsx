"use client";

import React, { useState } from 'react';
import { ApiToken, TokenUsage } from '@/utils/api/tokenClient';
import { useTokenContext } from '@/context/TokenContext';
import { formatDistanceToNow, format } from 'date-fns';

interface TokenDetailsModalProps {
  token: ApiToken;
  onClose: () => void;
  onDelete: () => Promise<void>;
}

const TokenDetailsModal: React.FC<TokenDetailsModalProps> = ({ token, onClose, onDelete }) => {
  const { state, fetchTokenUsage, updateSelectedToken } = useTokenContext();
  const { tokenUsage, isLoading } = state;
  
  const [isEditing, setIsEditing] = useState(false);
  const [newName, setNewName] = useState(token.name);
  const [usagePeriod, setUsagePeriod] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [isDeleting, setIsDeleting] = useState(false);
  const [updateError, setUpdateError] = useState<string | null>(null);

  // Format date for display
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return format(new Date(dateString), 'PPpp');
  };
  
  // Format relative date for display
  const formatRelativeDate = (dateString: string | null) => {
    if (!dateString) return 'Never';
    return formatDistanceToNow(new Date(dateString), { addSuffix: true });
  };

  const handleUpdateName = async () => {
    if (newName.trim() === '') {
      setUpdateError('Token name cannot be empty');
      return;
    }
    
    if (newName.trim() === token.name) {
      setIsEditing(false);
      return;
    }
    
    try {
      await updateSelectedToken(newName.trim());
      setIsEditing(false);
      setUpdateError(null);
    } catch (error) {
      setUpdateError('Failed to update token name');
    }
  };

  const handleChangePeriod = (period: 'daily' | 'weekly' | 'monthly') => {
    setUsagePeriod(period);
    fetchTokenUsage(token.id, period);
  };

  const handleDeleteConfirmation = async () => {
    try {
      await onDelete();
    } catch (error) {
      console.error('Error deleting token:', error);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold">Token Details</h2>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700"
            >
              &times;
            </button>
          </div>

          <div className="mb-6">
            <div className="mb-4">
              {isEditing ? (
                <div>
                  <label htmlFor="token-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Token Name
                  </label>
                  <div className="flex">
                    <input
                      id="token-name"
                      type="text"
                      value={newName}
                      onChange={(e) => setNewName(e.target.value)}
                      className="flex-1 px-3 py-2 border rounded-l-md border-gray-300 focus:outline-none focus:ring-1 focus:ring-primary-500"
                      placeholder="Enter token name"
                      autoFocus
                    />
                    <button
                      onClick={handleUpdateName}
                      disabled={isLoading}
                      className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-r-md disabled:opacity-50"
                    >
                      Save
                    </button>
                  </div>
                  {updateError && <p className="text-red-500 text-xs mt-1">{updateError}</p>}
                </div>
              ) : (
                <div className="flex justify-between items-center">
                  <div>
                    <span className="text-sm text-gray-500">Token Name</span>
                    <h3 className="text-lg font-medium">{token.name}</h3>
                  </div>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="text-gray-600 hover:text-gray-900 text-sm"
                  >
                    Edit
                  </button>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <span className="text-sm text-gray-500">Created</span>
                <p className="text-md">{formatDate(token.createdAt)}</p>
                <p className="text-sm text-gray-500">{formatRelativeDate(token.createdAt)}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Last Used</span>
                <p className="text-md">{formatDate(token.lastUsed)}</p>
                <p className="text-sm text-gray-500">{formatRelativeDate(token.lastUsed)}</p>
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Expires</span>
                {token.expiresAt ? (
                  <>
                    <p className="text-md">{formatDate(token.expiresAt)}</p>
                    <p className="text-sm text-amber-600">{formatRelativeDate(token.expiresAt)}</p>
                  </>
                ) : (
                  <p className="text-md text-green-600">Never</p>
                )}
              </div>
              
              <div>
                <span className="text-sm text-gray-500">Token ID</span>
                <p className="text-md font-mono text-sm">{token.id}</p>
              </div>
            </div>
          </div>

          {/* Usage Stats Section */}
          <div className="mb-6">
            <h3 className="text-md font-semibold mb-2">Usage Statistics</h3>
            
            <div className="flex mb-3 space-x-2 border-b">
              <button 
                onClick={() => handleChangePeriod('daily')}
                className={`px-3 py-1 ${usagePeriod === 'daily' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
              >
                Daily
              </button>
              <button 
                onClick={() => handleChangePeriod('weekly')}
                className={`px-3 py-1 ${usagePeriod === 'weekly' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
              >
                Weekly
              </button>
              <button 
                onClick={() => handleChangePeriod('monthly')}
                className={`px-3 py-1 ${usagePeriod === 'monthly' ? 'border-b-2 border-primary-600 text-primary-600' : 'text-gray-500'}`}
              >
                Monthly
              </button>
            </div>
            
            {isLoading ? (
              <div className="py-8 flex justify-center items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
              </div>
            ) : !tokenUsage || tokenUsage.length === 0 ? (
              <div className="py-8 text-center border rounded-md bg-gray-50">
                <p className="text-gray-500">No usage data available for this period.</p>
              </div>
            ) : (
              <div className="bg-white border rounded-md overflow-hidden">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Total Requests
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Successful
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                        Failed
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tokenUsage.map((usage) => (
                      <tr key={usage.id}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {format(new Date(usage.date), 'PP')}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {usage.requests}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="text-green-600">{usage.successfulRequests}</span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className="text-red-600">{usage.failedRequests}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="border-t pt-4 flex justify-between">
            {isDeleting ? (
              <div className="w-full">
                <p className="text-red-600 text-sm mb-3">
                  Are you sure you want to delete this token? This action cannot be undone.
                </p>
                <div className="flex space-x-3">
                  <button
                    onClick={() => setIsDeleting(false)}
                    className="flex-1 bg-gray-200 hover:bg-gray-300 py-2 px-4 rounded"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDeleteConfirmation}
                    className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 px-4 rounded"
                  >
                    Yes, Delete
                  </button>
                </div>
              </div>
            ) : (
              <>
                <button
                  onClick={() => setIsDeleting(true)}
                  className="text-red-600 hover:text-red-800"
                >
                  Delete Token
                </button>
                <button
                  onClick={onClose}
                  className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
                >
                  Close
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TokenDetailsModal;
