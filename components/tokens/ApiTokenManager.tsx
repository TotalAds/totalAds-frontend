"use client";

import React, { useCallback, useEffect, useState } from "react";

import { useTokenContext } from "@/context/TokenContext";
import { CreateTokenRequest } from "@/utils/api/tokenClient";

import CreateTokenForm from "./CreateTokenForm";
import TokenDetailsModal from "./TokenDetailsModal";
import TokenList from "./TokenList";

const ApiTokenManager: React.FC = () => {
  const {
    state,
    fetchTokens,
    selectToken,
    clearSelectedToken,
    createNewToken,
    deleteSelectedToken,
    clearNewToken,
    clearError,
  } = useTokenContext();
  const { tokens, selectedToken, newlyCreatedToken, isLoading, error } = state;

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  // If there's a new token created, show it in the UI
  useEffect(() => {
    if (newlyCreatedToken) {
      setIsCreateModalOpen(false);
      // We don't immediately clear the newly created token to allow users to see it
    }
  }, [newlyCreatedToken]);

  // When selectedToken changes, open the details modal
  useEffect(() => {
    if (selectedToken) {
      setIsDetailsModalOpen(true);
    }
  }, [selectedToken]);

  const handleCreateToken = async (tokenData: CreateTokenRequest) => {
    try {
      await createNewToken(tokenData);
    } catch (error) {
      console.error("Failed to create token:", error);
    }
  };

  const handleDeleteToken = async () => {
    try {
      await deleteSelectedToken();
      setIsDetailsModalOpen(false);
    } catch (error) {
      console.error("Failed to delete token:", error);
    }
  };

  const handleCloseDetailsModal = () => {
    setIsDetailsModalOpen(false);
    clearSelectedToken();
  };

  const handleCloseNewTokenModal = () => {
    clearNewToken();
  };

  useEffect(() => {
    // Fetch tokens when component mounts
    fetchTokens();
  }, [fetchTokens]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">API Token Management</h1>
        <button
          className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create New Token
        </button>
      </div>

      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6"
          role="alert"
        >
          <div className="flex justify-between">
            <div>
              <p className="font-medium">Error</p>
              <p>{error}</p>
            </div>
            <button onClick={clearError} className="text-red-500">
              &times;
            </button>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6 mb-8">
        <h2 className="text-lg font-semibold mb-4">Your API Tokens</h2>
        <TokenList
          tokens={tokens}
          isLoading={isLoading}
          onSelectToken={(id) => selectToken(id)}
        />
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-lg p-6">
        <h2 className="text-lg font-semibold mb-4">API Usage Documentation</h2>
        <div className="prose max-w-none">
          <p>
            These tokens allow you to access the Leadsnipper API
            programmatically. Make API requests using your token in the
            Authorization header:
          </p>
          <pre className="bg-slate-800 text-slate-50 p-4 rounded overflow-x-auto">
            {`curl -X POST https://api.leadsnipper.com/api/scraper \\
  -H "Authorization: Bearer YOUR_API_TOKEN" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com", "enableAI": false}'`}
          </pre>
          <h3 className="text-md font-semibold mt-4">
            Security Best Practices
          </h3>
          <ul>
            <li>Keep your API tokens secure and never share them publicly</li>
            <li>Set appropriate expiration dates for your tokens</li>
            <li>Revoke tokens that are no longer needed</li>
            <li>Monitor your token usage regularly</li>
          </ul>
        </div>
      </div>

      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold">Create API Token</h2>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <CreateTokenForm
              onSubmit={handleCreateToken}
              isLoading={isLoading}
            />
          </div>
        </div>
      )}

      {newlyCreatedToken && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-lg font-semibold text-green-600">
                Token Created Successfully
              </h2>
              <button
                onClick={handleCloseNewTokenModal}
                className="text-gray-500 hover:text-gray-700"
              >
                &times;
              </button>
            </div>
            <div className="mb-4">
              <p className="text-sm text-red-600 font-semibold mb-2">
                Important: Copy this token now. You won&apos;t be able to see it
                again!
              </p>
              <div className="bg-gray-100 p-3 rounded-md font-mono text-sm break-all">
                {newlyCreatedToken.token}
              </div>
            </div>
            <div className="flex justify-end">
              <button
                onClick={handleCloseNewTokenModal}
                className="bg-primary-600 hover:bg-primary-700 text-white font-medium py-2 px-4 rounded"
              >
                I&apos;ve Copied It
              </button>
            </div>
          </div>
        </div>
      )}

      {isDetailsModalOpen && selectedToken && (
        <TokenDetailsModal
          token={selectedToken}
          onClose={handleCloseDetailsModal}
          onDelete={handleDeleteToken}
        />
      )}
    </div>
  );
};

export default ApiTokenManager;
