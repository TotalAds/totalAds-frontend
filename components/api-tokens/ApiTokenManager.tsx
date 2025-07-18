"use client";

import React, { useEffect, useState } from "react";

import { Dialog } from "@/components/ui/dialog";
import { ApiToken, tokenService } from "@/utils/api/tokenService";

import CreateTokenForm from "./CreateTokenForm";
import TokenDetailsModal from "./TokenDetailsModal";
import TokenList from "./TokenList";

export default function ApiTokenManager() {
  const [tokens, setTokens] = useState<ApiToken[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showNewTokenDialog, setShowNewTokenDialog] = useState<boolean>(false);
  const [selectedToken, setSelectedToken] = useState<ApiToken | null>(null);
  const [newlyCreatedToken, setNewlyCreatedToken] = useState<ApiToken | null>(
    null
  );

  // Fetch tokens on component mount
  useEffect(() => {
    fetchTokens();
  }, []);

  // Function to fetch all tokens
  const fetchTokens = async () => {
    try {
      setLoading(true);
      setError(null);
      const fetchedTokens = await tokenService.getTokens();
      setTokens(fetchedTokens);
    } catch (err) {
      console.error("Error fetching API tokens:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch API tokens"
      );
    } finally {
      setLoading(false);
    }
  };

  // Function to create a new token
  const handleCreateToken = async (tokenData: {
    name: string;
    expiresIn?: number;
  }) => {
    try {
      setError(null);
      const newToken = await tokenService.createToken({
        name: tokenData.name,
        expiresIn: tokenData.expiresIn,
        scopes: ["scraper:read", "scraper:write"], // Default scopes for the scraper API
      });

      // Store the newly created token to display its value (only available once)
      setNewlyCreatedToken(newToken);

      // Add the new token to the list
      setTokens([...tokens, newToken]);

      // Close the create token form
      setShowNewTokenDialog(false);
    } catch (err) {
      console.error("Error creating API token:", err);
      setError(
        err instanceof Error ? err.message : "Failed to create API token"
      );
    }
  };

  // Function to delete a token
  const handleDeleteToken = async (tokenId: string) => {
    try {
      setError(null);
      await tokenService.deleteToken(tokenId);

      // Remove the deleted token from the list
      setTokens(tokens.filter((token) => token.id !== tokenId));

      // If the deleted token was selected, clear selection
      if (selectedToken && selectedToken.id === tokenId) {
        setSelectedToken(null);
      }
    } catch (err) {
      console.error("Error deleting API token:", err);
      setError(
        err instanceof Error ? err.message : "Failed to delete API token"
      );
    }
  };

  // Function to view token details
  const handleViewTokenDetails = (token: ApiToken) => {
    setSelectedToken(token);
  };

  // Function to close the newly created token modal
  const handleNewTokenModalClose = () => {
    setNewlyCreatedToken(null);
  };

  // Function to close the token details modal
  const handleTokenDetailsModalClose = () => {
    setSelectedToken(null);
  };

  return (
    <div className="space-y-6">
      {error && (
        <div
          className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded"
          role="alert"
        >
          <p>{error}</p>
        </div>
      )}

      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Your API Tokens</h2>
        <button
          onClick={() => setShowNewTokenDialog(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
        >
          Create New Token
        </button>
      </div>

      <div className="bg-white shadow-sm rounded-lg border">
        {loading ? (
          <div className="p-6 text-center">Loading tokens...</div>
        ) : tokens.length === 0 ? (
          <div className="p-6 text-center text-gray-500">
            You haven&apos;t created any API tokens yet. Create your first token
            to integrate with the Leadsnipper scraper API.
          </div>
        ) : (
          <TokenList
            tokens={tokens}
            onView={handleViewTokenDetails}
            onDelete={handleDeleteToken}
          />
        )}
      </div>

      {/* Documentation section */}
      <div className="mt-8 bg-white shadow-sm rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">API Documentation</h2>
        <div className="prose max-w-full">
          <h3>Using Your API Token</h3>
          <p>
            Your API token must be included in all API requests to the server as
            a bearer token in an Authorization header.
          </p>
          <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
            <code>{`Authorization: Bearer your_api_token_here`}</code>
          </pre>

          <h3 className="mt-6">Scraper API Endpoints</h3>
          <ul>
            <li>
              <strong>POST /api/scraper</strong>
              <p>Submit a URL to be scraped.</p>
              <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
                <code>
                  {`curl -X POST https://api.leadsnipper.com/api/scraper \\
  -H "Authorization: Bearer your_api_token_here" \\
  -H "Content-Type: application/json" \\
  -d '{"url": "https://example.com", "enableAI": true}'`}
                </code>
              </pre>
            </li>
            <li className="mt-4">
              <strong>GET /api/scraper/health</strong>
              <p>Check the health status of the scraper service.</p>
              <pre className="bg-gray-100 p-3 rounded overflow-x-auto">
                <code>
                  {`curl -X GET https://api.leadsnipper.com/api/scraper/health \\
  -H "Authorization: Bearer your_api_token_here"`}
                </code>
              </pre>
            </li>
          </ul>

          <h3 className="mt-6">Rate Limits</h3>
          <p>
            API requests are limited to 100 requests per hour per token. If you
            exceed this limit, you will receive a 429 Too Many Requests
            response.
          </p>
        </div>
      </div>

      {/* Create token dialog */}
      <Dialog open={showNewTokenDialog} onOpenChange={setShowNewTokenDialog}>
        <CreateTokenForm
          onSubmit={handleCreateToken}
          onCancel={() => setShowNewTokenDialog(false)}
        />
      </Dialog>

      {/* Show token details modal */}
      {selectedToken && (
        <TokenDetailsModal
          token={selectedToken}
          onClose={handleTokenDetailsModalClose}
        />
      )}

      {/* Show newly created token modal with the token value */}
      {newlyCreatedToken && (
        <Dialog
          open={!!newlyCreatedToken}
          onOpenChange={handleNewTokenModalClose}
        >
          <div className="p-6 bg-white rounded-lg max-w-md mx-auto">
            <h3 className="text-lg font-semibold mb-2">
              Token Created Successfully
            </h3>
            <p className="text-sm text-red-600 mb-4">
              <strong>Important:</strong> This is the only time your full token
              will be displayed. Please copy it now.
            </p>

            <div className="bg-gray-100 p-3 rounded mb-4 break-all">
              <code>{newlyCreatedToken.token}</code>
            </div>

            <div className="flex justify-end">
              <button
                onClick={handleNewTokenModalClose}
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded"
              >
                I&apos;ve Copied My Token
              </button>
            </div>
          </div>
        </Dialog>
      )}
    </div>
  );
}
