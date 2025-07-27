"use client";

import React, { useMemo, useState } from "react";

import { Button } from "@/components/ui/button";
import useValidators from "@/hooks/useValidators";
import { CreateICPProfileRequest } from "@/utils/api";
import {
  IconAlertCircle,
  IconBrain,
  IconCheck,
  IconSettings,
  IconTarget,
  IconX,
} from "@tabler/icons-react";

import AIPromptsStep from "./AIPromptsStep";
import BasicInfoStep from "./BasicInfoStep";
import { createValidationSchemas, defaultCriterion } from "./constants";
import CriteriaStep from "./CriteriaStep";
import { CriterionForm, ICPProfileFormProps, Step } from "./types";

export default function ICPProfileForm({
  isOpen,
  onClose,
  onSubmit,
  initialData,
  isLoading = false,
  existingProfiles = [],
  formError = null,
  onClearFormError,
}: ICPProfileFormProps) {
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<CreateICPProfileRequest>({
    name: initialData?.name || "",
    description: initialData?.description || "",
    scoringMethod: initialData?.scoringMethod || "weighted_average",
    minimumScore: initialData?.minimumScore || 70,
    customPrompts: {
      businessModel: initialData?.customPrompts?.businessModel || "",
      targetMarket: initialData?.customPrompts?.targetMarket || "",
      companySize: initialData?.customPrompts?.companySize || "",
      technology: initialData?.customPrompts?.technology || "",
      industry: initialData?.customPrompts?.industry || "",
      userRemarks: initialData?.customPrompts?.userRemarks || "",
    },
    requiredDataPoints: {
      contactInfo: true,
      companySize: true,
      industry: true,
      revenue: false,
      location: true,
      technology: false,
      socialPresence: false,
      fundingStage: false,
      businessModel: false,
      targetMarket: false,
      ...initialData?.requiredDataPoints,
    },
    criteria:
      initialData?.criteria?.map((c) => ({
        category: c.category,
        field: c.field,
        operator: c.operator,
        value: c.value,
        weight: c.weight,
        isRequired: c.isRequired,
        scoreIfMatch: c.scoreIfMatch,
        scoreIfNoMatch: c.scoreIfNoMatch,
        description: c.description || "",
      })) || [],
  });

  const [criteria, setCriteria] = useState<CriterionForm[]>(
    initialData?.criteria?.map((c) => ({
      category: c.category,
      field: c.field,
      operator: c.operator,
      value: typeof c.value === "string" ? c.value : JSON.stringify(c.value),
      weight: c.weight,
      isRequired: c.isRequired,
      scoreIfMatch: c.scoreIfMatch,
      scoreIfNoMatch: c.scoreIfNoMatch,
      description: c.description || "",
    })) || []
  );

  // Memoize validation values to prevent infinite re-renders
  const validationValues = useMemo(
    () => ({
      name: formData.name,
      description: formData.description,
      scoringMethod: formData.scoringMethod,
      minimumScore: formData.minimumScore,
      businessModel: formData.customPrompts?.businessModel || "",
      targetMarket: formData.customPrompts?.targetMarket || "",
      companySize: formData.customPrompts?.companySize || "",
      technology: formData.customPrompts?.technology || "",
      industry: formData.customPrompts?.industry || "",
      userRemarks: formData.customPrompts?.userRemarks || "",
    }),
    [
      formData.name,
      formData.description,
      formData.scoringMethod,
      formData.minimumScore,
      formData.customPrompts?.businessModel,
      formData.customPrompts?.targetMarket,
      formData.customPrompts?.companySize,
      formData.customPrompts?.technology,
      formData.customPrompts?.industry,
      formData.customPrompts?.userRemarks,
    ]
  );

  // Create validation schemas with duplicate name checking
  const existingNames = existingProfiles.map((profile) => profile.name);
  const validationSchemas = createValidationSchemas(
    existingNames,
    initialData?.name
  );

  const {
    validationErrors,
    hasValidationErrors,
    startValidation,
    validationStarted,
  } = useValidators({
    schemas: validationSchemas,
    values: validationValues,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Start validation
    const { hasValidationErrors: hasErrors } = await startValidation();

    if (hasErrors) {
      return; // Don't submit if there are validation errors
    }

    const submitData: CreateICPProfileRequest = {
      ...formData,
      criteria: criteria.map((c) => ({
        category: c.category,
        field: c.field,
        operator: c.operator,
        value: c.value,
        weight: c.weight,
        isRequired: c.isRequired,
        scoreIfMatch: c.scoreIfMatch,
        scoreIfNoMatch: c.scoreIfNoMatch,
        description: c.description,
      })),
    };

    await onSubmit(submitData);
  };

  const addCriterion = () => {
    setCriteria([...criteria, { ...defaultCriterion }]);
  };

  const removeCriterion = (index: number) => {
    setCriteria(criteria.filter((_, i) => i !== index));
  };

  const updateCriterion = (
    index: number,
    field: keyof CriterionForm,
    value: any
  ) => {
    try {
      const updated = [...criteria];
      updated[index] = { ...updated[index], [field]: value };
      setCriteria(updated);
    } catch (error) {
      console.error("Error updating criterion:", error);
    }
  };

  const handleStepChange = (step: number) => {
    try {
      setCurrentStep(step);
    } catch (error) {
      console.error("Error changing step:", error);
    }
  };

  if (!isOpen) {
    return null;
  }

  const steps: Step[] = [
    { id: 1, name: "Basic Info", icon: IconTarget },
    { id: 2, name: "AI Prompts", icon: IconBrain },
    { id: 3, name: "Criteria", icon: IconSettings },
  ];

  const clearFormError = () => {
    if (onClearFormError) {
      onClearFormError();
    }
  };

  const stepProps = {
    formData,
    setFormData,
    validationErrors,
    validationStarted,
    criteria,
    setCriteria,
    addCriterion,
    removeCriterion,
    updateCriterion,
    clearFormError,
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-5xl w-full max-h-[92vh] overflow-x-hidden overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
              <IconTarget className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">
                {initialData ? "Edit ICP Profile" : "Create New ICP Profile"}
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Define your ideal customer criteria for intelligent lead scoring
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isLoading}
            className="text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg h-10 w-10 p-0 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <IconX className="w-5 h-5" />
          </Button>
        </div>

        {/* Step Navigation */}
        <div className="flex items-center justify-center p-6 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-8">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div
                  className={`flex items-center space-x-3 px-4 py-2 rounded-lg transition-all duration-300 cursor-pointer ${
                    currentStep === step.id
                      ? "bg-purple-100 text-purple-700 border-2 border-purple-300"
                      : "text-gray-500 hover:text-gray-700 hover:bg-gray-100"
                  }`}
                  onClick={() => handleStepChange(step.id)}
                >
                  <step.icon className="w-5 h-5" />
                  <span className="font-medium">{step.name}</span>
                  {currentStep === step.id && (
                    <IconCheck className="w-4 h-4 text-purple-600" />
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className="w-8 h-px bg-gray-300 mx-4"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Form Content */}
        <form onSubmit={handleSubmit} className="flex flex-col h-full">
          <div className="flex-1 overflow-y-auto p-8">
            {/* Error Display */}
            {formError && (
              <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
                <IconAlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <h4 className="text-red-800 font-semibold text-sm">Error</h4>
                  <p className="text-red-700 text-sm mt-1">{formError}</p>
                </div>
              </div>
            )}
            {/* Step 1: Basic Info */}
            {currentStep === 1 && <BasicInfoStep {...stepProps} />}

            {/* Step 2: AI Prompts */}
            {currentStep === 2 && <AIPromptsStep {...stepProps} />}

            {/* Step 3: Criteria */}
            {currentStep === 3 && <CriteriaStep {...stepProps} />}
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t border-gray-200 bg-gray-50">
            <div className="flex space-x-4">
              {currentStep > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => handleStepChange(currentStep - 1)}
                  disabled={isLoading}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 rounded-lg px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </Button>
              )}
            </div>
            <div className="flex space-x-4">
              {currentStep < steps.length ? (
                <Button
                  type="button"
                  onClick={() => handleStepChange(currentStep + 1)}
                  disabled={isLoading}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </Button>
              ) : (
                <Button
                  type="submit"
                  disabled={isLoading || hasValidationErrors}
                  className="bg-purple-600 hover:bg-purple-700 text-white rounded-lg px-6 py-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isLoading
                    ? "Creating..."
                    : initialData
                    ? "Update Profile"
                    : "Create Profile"}
                </Button>
              )}
            </div>
          </div>
        </form>

        {/* Loading Overlay */}
        {isLoading && (
          <div className="absolute inset-0 bg-white/80 backdrop-blur-sm flex items-center justify-center z-10 rounded-2xl">
            <div className="flex flex-col items-center space-y-4">
              <div className="w-8 h-8 border-4 border-purple-200 border-t-purple-600 rounded-full animate-spin"></div>
              <p className="text-gray-700 font-medium">
                {initialData ? "Updating profile..." : "Creating profile..."}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
