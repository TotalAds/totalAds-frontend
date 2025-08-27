"use client";

import { AnimatePresence, motion } from "framer-motion";
import {
  MessageSquare,
  Send,
  Star,
  ThumbsDown,
  ThumbsUp,
  X,
} from "lucide-react";
import React, { useState } from "react";

import { FeedbackData } from "@/utils/api/feedbackClient";

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (feedback: FeedbackData) => void;
  title?: string;
  context?: {
    url?: string;
    extractionId?: string;
    feature?: string;
  };
}

// FeedbackData interface is imported from feedbackClient

const feedbackCategories = [
  { id: "extraction", label: "Data Extraction", icon: "🔍" },
  { id: "accuracy", label: "Data Accuracy", icon: "🎯" },
  { id: "ui", label: "User Interface", icon: "🎨" },
  { id: "performance", label: "Performance", icon: "⚡" },
  { id: "feature", label: "Feature Request", icon: "💡" },
  { id: "other", label: "Other", icon: "💬" },
];

const FeedbackModal: React.FC<FeedbackModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  title = "Share Your Feedback",
  context,
}) => {
  const [step, setStep] = useState(1);
  const [feedbackData, setFeedbackData] = useState<Partial<FeedbackData>>({
    type: "positive",
    rating: 5,
    accuracy: 5,
    completeness: 5,
    relevance: 5,
    message: "",
    category: "extraction",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleTypeSelect = (type: FeedbackData["type"]) => {
    setFeedbackData({ ...feedbackData, type });
    setStep(2);
  };

  const handleRatingChange = (field: string, value: number) => {
    setFeedbackData({ ...feedbackData, [field]: value });
  };

  const handleSubmit = async () => {
    if (!feedbackData.message?.trim()) return;

    setIsSubmitting(true);
    try {
      await onSubmit({
        ...feedbackData,
        context,
      } as FeedbackData);
      onClose();
      resetForm();
    } catch (error) {
      console.error("Error submitting feedback:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setStep(1);
    setFeedbackData({
      type: "positive",
      rating: 5,
      accuracy: 5,
      completeness: 5,
      relevance: 5,
      message: "",
      category: "extraction",
    });
  };

  const StarRating = ({
    value,
    onChange,
    label,
  }: {
    value: number;
    onChange: (value: number) => void;
    label: string;
  }) => (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <div className="flex space-x-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            type="button"
            onClick={() => onChange(star)}
            className={`p-1 transition-colors ${
              star <= value
                ? "text-yellow-400"
                : "text-gray-600 hover:text-yellow-300"
            }`}
          >
            <Star className="w-5 h-5 fill-current" />
          </button>
        ))}
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-[50vw] bg-gray-900/95 backdrop-blur-xl border border-gray-700/50 rounded-2xl shadow-2xl max-h-[90vh] overflow-x-hidden overflow-y-auto"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-gray-700/50">
            <h2 className="text-xl font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-lg hover:bg-gray-800/50"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6">
            {step === 1 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <p className="text-gray-300 text-sm mb-6">
                  What type of feedback would you like to share?
                </p>

                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => handleTypeSelect("positive")}
                    className="p-4 bg-green-500/10 border border-green-500/20 rounded-xl hover:bg-green-500/20 transition-colors group"
                  >
                    <ThumbsUp className="w-6 h-6 text-green-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-green-300">
                      Positive
                    </span>
                  </button>

                  <button
                    onClick={() => handleTypeSelect("negative")}
                    className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl hover:bg-red-500/20 transition-colors group"
                  >
                    <ThumbsDown className="w-6 h-6 text-red-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-red-300">
                      Issue
                    </span>
                  </button>

                  <button
                    onClick={() => handleTypeSelect("suggestion")}
                    className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl hover:bg-blue-500/20 transition-colors group"
                  >
                    <MessageSquare className="w-6 h-6 text-blue-400 mx-auto mb-2 group-hover:scale-110 transition-transform" />
                    <span className="text-sm font-medium text-blue-300">
                      Suggestion
                    </span>
                  </button>

                  <button
                    onClick={() => handleTypeSelect("bug")}
                    className="p-4 bg-orange-500/10 border border-orange-500/20 rounded-xl hover:bg-orange-500/20 transition-colors group"
                  >
                    <span className="text-xl mx-auto mb-2 block group-hover:scale-110 transition-transform">
                      🐛
                    </span>
                    <span className="text-sm font-medium text-orange-300">
                      Bug Report
                    </span>
                  </button>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                {/* Category Selection */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-gray-300">
                    Category
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {feedbackCategories.map((category) => (
                      <button
                        key={category.id}
                        onClick={() =>
                          setFeedbackData({
                            ...feedbackData,
                            category: category.id,
                          })
                        }
                        className={`p-3 rounded-lg border transition-colors text-left ${
                          feedbackData.category === category.id
                            ? "bg-purple-500/20 border-purple-500/50 text-purple-300"
                            : "bg-gray-800/50 border-gray-700/50 text-gray-300 hover:bg-gray-700/50"
                        }`}
                      >
                        <span className="text-sm">
                          {category.icon} {category.label}
                        </span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Ratings for extraction feedback */}
                {feedbackData.category === "extraction" && (
                  <div className="space-y-4">
                    <StarRating
                      value={feedbackData.accuracy || 5}
                      onChange={(value) =>
                        handleRatingChange("accuracy", value)
                      }
                      label="Data Accuracy"
                    />
                    <StarRating
                      value={feedbackData.completeness || 5}
                      onChange={(value) =>
                        handleRatingChange("completeness", value)
                      }
                      label="Data Completeness"
                    />
                    <StarRating
                      value={feedbackData.relevance || 5}
                      onChange={(value) =>
                        handleRatingChange("relevance", value)
                      }
                      label="Data Relevance"
                    />
                  </div>
                )}

                {/* Overall Rating */}
                <StarRating
                  value={feedbackData.rating || 5}
                  onChange={(value) => handleRatingChange("rating", value)}
                  label="Overall Experience"
                />

                {/* Message */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300">
                    Tell us more about your experience
                  </label>
                  <textarea
                    value={feedbackData.message}
                    onChange={(e) =>
                      setFeedbackData({
                        ...feedbackData,
                        message: e.target.value,
                      })
                    }
                    placeholder="Share your thoughts, suggestions, or describe any issues you encountered..."
                    className="w-full h-24 px-4 py-3 bg-gray-800/50 border border-gray-700/50 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-purple-500/50 focus:border-purple-500/50 resize-none"
                  />
                </div>

                {/* Actions */}
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setStep(1)}
                    className="flex-1 px-4 py-2 bg-gray-800/50 border border-gray-700/50 text-gray-300 rounded-lg hover:bg-gray-700/50 transition-colors"
                  >
                    Back
                  </button>
                  <button
                    onClick={handleSubmit}
                    disabled={!feedbackData.message?.trim() || isSubmitting}
                    className="flex-1 px-4 py-2 bg-gradient-to-r from-purple-600 to-pink-600 text-white rounded-lg hover:from-purple-700 hover:to-pink-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isSubmitting ? (
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Send Feedback</span>
                      </>
                    )}
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};

export default FeedbackModal;
