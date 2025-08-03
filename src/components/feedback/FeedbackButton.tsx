"use client";

import { motion } from "framer-motion";
import { MessageCircle, Zap } from "lucide-react";
import React, { useState } from "react";
import { toast } from "react-hot-toast";

import { FeedbackData, submitFeedback } from "@/utils/api/feedbackClient";

import FeedbackModal from "./FeedbackModal";

interface FeedbackButtonProps {
  variant?: "floating" | "inline" | "compact";
  context?: {
    url?: string;
    extractionId?: string;
    feature?: string;
    page?: string;
  };
  className?: string;
}

const FeedbackButton: React.FC<FeedbackButtonProps> = ({
  variant = "floating",
  context,
  className = "",
}) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleFeedbackSubmit = async (feedbackData: FeedbackData) => {
    setIsSubmitting(true);
    try {
      await submitFeedback({
        ...feedbackData,
        context: {
          ...context,
          timestamp: new Date().toISOString(),
          userAgent: navigator.userAgent,
          url: window.location.href,
        },
      });

      toast.success("Thank you for your feedback! 🙏", {
        duration: 4000,
        style: {
          background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
          color: "white",
          border: "1px solid rgba(255, 255, 255, 0.1)",
        },
      });
    } catch (error) {
      console.error("Error submitting feedback:", error);
      toast.error("Failed to submit feedback. Please try again.", {
        duration: 4000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (variant === "floating") {
    return (
      <>
        <motion.button
          onClick={() => setIsModalOpen(true)}
          className={`fixed bottom-6 right-6 z-40 p-4 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-full shadow-lg hover:shadow-xl transition-all duration-300 group ${className}`}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, y: 100 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <div className="relative">
            <MessageCircle className="w-6 h-6 group-hover:scale-110 transition-transform" />
            <motion.div
              className="absolute -top-1 -right-1 w-3 h-3 bg-yellow-400 rounded-full"
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>

          {/* Tooltip */}
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1 bg-gray-900 text-white text-sm rounded-lg opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
            Share Feedback
            <div className="absolute top-full right-4 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900" />
          </div>
        </motion.button>

        <FeedbackModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFeedbackSubmit}
          context={context}
        />
      </>
    );
  }

  if (variant === "compact") {
    return (
      <>
        <button
          onClick={() => setIsModalOpen(true)}
          className={`inline-flex items-center space-x-2 px-3 py-1.5 bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700/50 hover:text-white transition-colors text-sm ${className}`}
        >
          <MessageCircle className="w-4 h-4" />
          <span>Feedback</span>
        </button>

        <FeedbackModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onSubmit={handleFeedbackSubmit}
          context={context}
        />
      </>
    );
  }

  // Inline variant
  return (
    <>
      <motion.button
        onClick={() => setIsModalOpen(true)}
        className={`inline-flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-purple-600/20 to-pink-600/20 border border-purple-500/30 text-purple-300 rounded-lg hover:from-purple-600/30 hover:to-pink-600/30 hover:border-purple-500/50 transition-all group ${className}`}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        <MessageCircle className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="font-medium">Share Feedback</span>
        <Zap className="w-4 h-4 text-yellow-400 opacity-75" />
      </motion.button>

      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleFeedbackSubmit}
        context={context}
      />
    </>
  );
};

export default FeedbackButton;
