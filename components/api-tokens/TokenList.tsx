"use client";

import { formatDistanceToNow } from "date-fns";
import React from "react";

import { ApiToken } from "@/utils/api/tokenService";

interface TokenListProps {
  tokens: ApiToken[];
  onView: (token: ApiToken) => void;
  onDelete: (tokenId: string) => void;
}

export default function TokenList({
  tokens,
  onView,
  onDelete,
}: TokenListProps) {
  // Format date for display
  const formatDate = (dateString?: string) => {
    if (!dateString) return "Never";
    try {
      return formatDistanceToNow(new Date(dateString), { addSuffix: true });
    } catch (err) {
      return "Invalid date";
    }
  };

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Name
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Created
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Last Used
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Expiration
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Usage
            </th>
            <th
              scope="col"
              className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider"
            >
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {tokens.map((token) => (
            <tr key={token.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  <div>
                    <div className="text-sm font-medium text-gray-900">
                      {token.name}
                    </div>
                    <div className="text-sm text-gray-500">••••••••••••</div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(token.createdAt)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {formatDate(token.lastUsed || undefined)}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                {token.expiresAt ? formatDate(token.expiresAt) : "Never"}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                - requests
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-center">
                <button
                  onClick={() => onView(token)}
                  className="text-blue-600 hover:text-blue-800 font-medium mr-3"
                >
                  Details
                </button>
                <button
                  onClick={() => onDelete(token.id)}
                  className="text-red-600 hover:text-red-800 font-medium"
                >
                  Revoke
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
