"use client";

import React from "react";
import { 
  IconAlertTriangle, 
  IconClock, 
  IconGlobe, 
  IconInfoCircle,
  IconX 
} from "@tabler/icons-react";

interface WebsiteStatusAlertProps {
  error: {
    message: string;
    details?: {
      url: string;
      statusCode?: number;
      error?: string;
      responseTime?: number;
    };
  };
  onClose?: () => void;
}

const WebsiteStatusAlert: React.FC<WebsiteStatusAlertProps> = ({ 
  error, 
  onClose 
}) => {
  const getErrorIcon = (errorType?: string) => {
    switch (errorType) {
      case 'DNS_NOT_FOUND':
        return <IconGlobe className="w-5 h-5 text-orange-500" />;
      case 'CONNECTION_REFUSED':
        return <IconX className="w-5 h-5 text-red-500" />;
      case 'TIMEOUT':
        return <IconClock className="w-5 h-5 text-yellow-500" />;
      default:
        return <IconAlertTriangle className="w-5 h-5 text-orange-500" />;
    }
  };

  const getErrorTitle = (errorType?: string) => {
    switch (errorType) {
      case 'DNS_NOT_FOUND':
        return 'Domain Not Found';
      case 'CONNECTION_REFUSED':
        return 'Connection Refused';
      case 'TIMEOUT':
        return 'Request Timeout';
      case 'HTTP_ERROR':
        return 'HTTP Error';
      case 'NETWORK_ERROR':
        return 'Network Error';
      default:
        return 'Website Unavailable';
    }
  };

  const getErrorDescription = (errorType?: string, statusCode?: number) => {
    switch (errorType) {
      case 'DNS_NOT_FOUND':
        return 'The domain name could not be resolved. The website may be offline, the domain may have expired, or there may be DNS issues.';
      case 'CONNECTION_REFUSED':
        return 'The server is refusing connections. The website may be temporarily down for maintenance or experiencing technical issues.';
      case 'TIMEOUT':
        return 'The website is taking too long to respond. This could indicate server overload or network connectivity issues.';
      case 'HTTP_ERROR':
        return `The server returned an error (${statusCode}). The website may be experiencing technical difficulties.`;
      case 'NETWORK_ERROR':
        return 'A network error occurred while trying to reach the website. Please check your internet connection.';
      default:
        return 'The website appears to be inactive or unreachable at this time.';
    }
  };

  const getSuggestions = (errorType?: string) => {
    const commonSuggestions = [
      'Verify the URL is correct and complete',
      'Try again in a few minutes',
    ];

    switch (errorType) {
      case 'DNS_NOT_FOUND':
        return [
          ...commonSuggestions,
          'Check if the domain name is spelled correctly',
          'Verify the domain hasn\'t expired',
        ];
      case 'CONNECTION_REFUSED':
        return [
          ...commonSuggestions,
          'The website may be under maintenance',
          'Try accessing the website directly in your browser',
        ];
      case 'TIMEOUT':
        return [
          ...commonSuggestions,
          'Check your internet connection',
          'The website may be experiencing high traffic',
        ];
      default:
        return commonSuggestions;
    }
  };

  return (
    <div className="bg-gradient-to-r from-orange-50 to-yellow-50 border border-orange-200 rounded-lg p-4 mb-4">
      <div className="flex items-start justify-between">
        <div className="flex items-start space-x-3 flex-1">
          <div className="flex-shrink-0 mt-0.5">
            {getErrorIcon(error.details?.error)}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-sm font-semibold text-orange-800">
                {getErrorTitle(error.details?.error)}
              </h3>
              {error.details?.statusCode && (
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">
                  HTTP {error.details.statusCode}
                </span>
              )}
            </div>
            
            <p className="text-sm text-orange-700 mb-3">
              {error.message}
            </p>
            
            <div className="text-xs text-orange-600 mb-3">
              <p>{getErrorDescription(error.details?.error, error.details?.statusCode)}</p>
            </div>

            {error.details?.url && (
              <div className="text-xs text-gray-600 mb-3">
                <span className="font-medium">URL:</span> {error.details.url}
              </div>
            )}

            <div className="bg-orange-50 rounded-md p-3 border border-orange-100">
              <div className="flex items-start space-x-2">
                <IconInfoCircle className="w-4 h-4 text-orange-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-xs font-medium text-orange-800 mb-1">
                    Suggestions:
                  </h4>
                  <ul className="text-xs text-orange-700 space-y-1">
                    {getSuggestions(error.details?.error).map((suggestion, index) => (
                      <li key={index} className="flex items-start space-x-1">
                        <span className="text-orange-400 mt-1">•</span>
                        <span>{suggestion}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {onClose && (
          <button
            onClick={onClose}
            className="flex-shrink-0 ml-3 text-orange-400 hover:text-orange-600 transition-colors"
            aria-label="Close alert"
          >
            <IconX className="w-4 h-4" />
          </button>
        )}
      </div>
    </div>
  );
};

export default WebsiteStatusAlert;
