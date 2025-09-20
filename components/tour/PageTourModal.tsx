"use client";

import { usePathname } from "next/navigation";
import React, { useEffect, useState } from "react";

import { useTour } from "@/context/TourContext";
import { IconRoute, IconSparkles, IconX } from "@tabler/icons-react";

interface PageTourModalProps {
  isVisible: boolean;
  onClose: () => void;
  onStartTour: () => void;
}

const PageTourModal: React.FC<PageTourModalProps> = ({
  isVisible,
  onClose,
  onStartTour,
}) => {
  const pathname = usePathname();

  const getPageContent = () => {
    switch (pathname) {
      case "/dashboard":
        return {
          title: "🎉 Welcome to Leadsnipper!",
          description:
            "You're all set up! Would you like a quick 2-minute tour to learn how to find leads from any website in seconds?",
          benefits: [
            "🔍 Extract business data from any website",
            "🎯 Create ideal customer profiles",
            "📊 Get AI-powered lead scoring",
            "⚡ Save hours of manual research",
          ],
        };
      case "/scraper":
        return {
          title: "🔍 Sales Intelligence Tour",
          description:
            "Want to learn how to extract comprehensive business data from any website?",
          benefits: [
            "🌐 Paste any website URL",
            "🤖 AI-powered data extraction",
            "📋 Get contact info, company details",
            "💾 Export results instantly",
          ],
        };
      case "/icp-profiles":
        return {
          title: "🎯 ICP Profiles Tour",
          description:
            "Learn how to create Ideal Customer Profiles for smarter lead generation.",
          benefits: [
            "👥 Define your ideal customers",
            "🎯 Smart lead scoring",
            "📈 Better conversion rates",
            "🔄 Reusable profile templates",
          ],
        };
      default:
        return {
          title: "🚀 Product Tour",
          description:
            "Take a quick tour to learn about Leadsnipper's features.",
          benefits: [
            "🔍 Lead generation tools",
            "🎯 Customer profiling",
            "📊 Data extraction",
            "⚡ Fast results",
          ],
        };
    }
  };

  const content = getPageContent();

  if (!isVisible) {
    return null;
  }

  return (
    <>
      {/* Backdrop */}
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4 h-[100vh]">
        {/* Modal */}
        <div className="bg-slate-900/95 backdrop-blur-xl border border-white/10 rounded-2xl p-8 max-w-md w-full shadow-2xl">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
          >
            <IconX className="w-5 h-5" />
          </button>

          {/* Content */}
          <div className="text-center">
            {/* Icon */}
            <div className="w-16 h-16 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center mx-auto mb-6">
              <IconSparkles className="w-8 h-8 text-white" />
            </div>

            {/* Title */}
            <h2 className="text-2xl font-bold text-white mb-4">
              {content.title}
            </h2>

            {/* Description */}
            <p className="text-gray-300 mb-6 leading-relaxed">
              {content.description}
            </p>

            {/* Benefits */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-4 mb-6">
              <p className="text-sm text-gray-400 mb-2">
                You&apos;ll learn how to:
              </p>
              <ul className="text-sm text-gray-300 space-y-1">
                {content.benefits.map((benefit, index) => (
                  <li key={index}>{benefit}</li>
                ))}
              </ul>
            </div>

            {/* Buttons */}
            <div className="flex gap-3">
              <button
                onClick={onClose}
                className="flex-1 px-4 py-3 bg-white/10 border border-white/20 text-white rounded-xl hover:bg-white/20 transition-all duration-200"
              >
                Skip for Now
              </button>
              <button
                onClick={onStartTour}
                className="flex-1 px-4 py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-xl hover:shadow-lg hover:scale-105 transition-all duration-200 flex items-center justify-center gap-2"
              >
                <IconRoute className="w-4 h-4" />
                Take Tour
              </button>
            </div>

            {/* Footer */}
            <p className="text-xs text-gray-500 mt-4">
              You can always access the tour later from the Help menu
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default PageTourModal;
