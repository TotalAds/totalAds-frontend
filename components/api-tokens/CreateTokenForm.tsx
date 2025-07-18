"use client";

import React, { useState } from 'react';

interface CreateTokenFormProps {
  onSubmit: (data: { name: string; expiresIn?: number }) => void;
  onCancel: () => void;
}

export default function CreateTokenForm({ onSubmit, onCancel }: CreateTokenFormProps) {
  const [name, setName] = useState<string>('');
  const [expiration, setExpiration] = useState<string>('never');
  const [customDays, setCustomDays] = useState<number>(30);
  const [error, setError] = useState<string | null>(null);

  // Handle form submission
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('Token name is required');
      return;
    }
    
    // Prepare expiration value (undefined for never, or days)
    let expiresIn: number | undefined;
    
    if (expiration === 'custom') {
      expiresIn = customDays;
    } else if (expiration !== 'never') {
      expiresIn = parseInt(expiration);
    }
    
    // Submit form data
    onSubmit({ name, expiresIn });
  };

  return (
    <div className="bg-white p-6 rounded-lg max-w-md mx-auto">
      <h2 className="text-xl font-semibold mb-4">Create API Token</h2>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-2 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit}>
        <div className="mb-4">
          <label htmlFor="tokenName" className="block text-sm font-medium text-gray-700 mb-1">
            Token Name *
          </label>
          <input
            id="tokenName"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Production API, Development, etc."
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            required
          />
          <p className="text-sm text-gray-500 mt-1">
            Give your token a descriptive name to remember its purpose.
          </p>
        </div>
        
        <div className="mb-6">
          <label htmlFor="tokenExpiration" className="block text-sm font-medium text-gray-700 mb-1">
            Token Expiration
          </label>
          <select
            id="tokenExpiration"
            value={expiration}
            onChange={(e) => setExpiration(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          >
            <option value="never">Never (not recommended)</option>
            <option value="7">7 Days</option>
            <option value="30">30 Days</option>
            <option value="90">90 Days</option>
            <option value="365">1 Year</option>
            <option value="custom">Custom</option>
          </select>
          
          {expiration === 'custom' && (
            <div className="mt-3">
              <label htmlFor="customDays" className="block text-sm font-medium text-gray-700 mb-1">
                Custom days until expiration
              </label>
              <input
                id="customDays"
                type="number"
                min="1"
                max="3650"
                value={customDays}
                onChange={(e) => setCustomDays(parseInt(e.target.value) || 30)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          )}
          
          <p className="text-sm text-gray-500 mt-1">
            For security, we recommend using tokens with expiration dates.
          </p>
        </div>
        
        <div className="flex justify-end space-x-2">
          <button
            type="button"
            onClick={onCancel}
            className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Cancel
          </button>
          <button
            type="submit"
            className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
          >
            Create Token
          </button>
        </div>
      </form>
    </div>
  );
}
