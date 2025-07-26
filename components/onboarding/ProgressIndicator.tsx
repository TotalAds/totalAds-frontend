"use client";

import React from "react";
import { IconCheck } from "@tabler/icons-react";

interface ProgressIndicatorProps {
  currentStep: number;
  totalSteps: number;
}

const stepLabels = [
  "Business Info",
  "Goals & Use Case", 
  "Welcome"
];

export default function ProgressIndicator({ currentStep, totalSteps }: ProgressIndicatorProps) {
  return (
    <div className="mb-8">
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, index) => {
          const isCompleted = index < currentStep;
          const isCurrent = index === currentStep;
          const isUpcoming = index > currentStep;

          return (
            <React.Fragment key={index}>
              {/* Step Circle */}
              <div className="flex flex-col items-center">
                <div
                  className={`
                    w-12 h-12 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300
                    ${
                      isCompleted
                        ? "bg-gradient-to-r from-green-500 to-emerald-500 text-white"
                        : isCurrent
                        ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white"
                        : "bg-white/20 text-gray-400 border-2 border-white/30"
                    }
                  `}
                >
                  {isCompleted ? (
                    <IconCheck className="w-6 h-6" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>
                
                {/* Step Label */}
                <span
                  className={`
                    mt-2 text-xs font-medium transition-colors duration-300
                    ${
                      isCompleted || isCurrent
                        ? "text-white"
                        : "text-gray-400"
                    }
                  `}
                >
                  {stepLabels[index]}
                </span>
              </div>

              {/* Connector Line */}
              {index < totalSteps - 1 && (
                <div className="flex-1 mx-4">
                  <div
                    className={`
                      h-1 rounded-full transition-all duration-300
                      ${
                        index < currentStep
                          ? "bg-gradient-to-r from-green-500 to-emerald-500"
                          : "bg-white/20"
                      }
                    `}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>

      {/* Progress Percentage */}
      <div className="mt-4">
        <div className="flex justify-between items-center text-sm text-gray-300 mb-2">
          <span>Progress</span>
          <span>{Math.round(((currentStep + 1) / totalSteps) * 100)}%</span>
        </div>
        <div className="w-full bg-white/20 rounded-full h-2">
          <div
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full transition-all duration-500 ease-out"
            style={{
              width: `${((currentStep + 1) / totalSteps) * 100}%`,
            }}
          />
        </div>
      </div>
    </div>
  );
}
