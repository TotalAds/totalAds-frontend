import { z } from "zod";

import { CategoryOption, CriterionForm, OperatorOption } from "./types";

export const defaultCriterion: CriterionForm = {
  category: "company",
  field: "",
  operator: "equals",
  value: "",
  weight: 1.0,
  isRequired: false,
  scoreIfMatch: 100,
  scoreIfNoMatch: 0,
  description: "",
};

export const CATEGORY_OPTIONS: CategoryOption[] = [
  { value: "company", label: "Company Info" },
  { value: "contact", label: "Contact Info" },
  { value: "technology", label: "Technology" },
  { value: "business", label: "Business Model" },
  { value: "financial", label: "Financial" },
  { value: "social", label: "Social Presence" },
];

export const OPERATOR_OPTIONS: OperatorOption[] = [
  { value: "equals", label: "Equals" },
  { value: "contains", label: "Contains" },
  { value: "greater_than", label: "Greater Than" },
  { value: "less_than", label: "Less Than" },
  { value: "in_range", label: "In Range" },
  { value: "not_equals", label: "Not Equals" },
];

// Validation schemas
export const validationSchemas = {
  name: z
    .string()
    .min(1, "Profile name is required")
    .max(100, "Name must be less than 100 characters"),
  description: z.string().optional(),
  scoringMethod: z.enum([
    "weighted_average",
    "threshold_based",
    "ai_powered",
    "custom",
  ]),
  minimumScore: z
    .number()
    .min(0, "Minimum score must be at least 0")
    .max(100, "Minimum score cannot exceed 100"),
  businessModel: z.string().optional(),
  targetMarket: z.string().optional(),
  companySize: z.string().optional(),
  technology: z.string().optional(),
  industry: z.string().optional(),
  userRemarks: z.string().optional(),
};

// Function to create validation schemas with duplicate name checking
export const createValidationSchemas = (
  existingNames: string[] = [],
  currentName?: string
) => ({
  ...validationSchemas,
  name: z
    .string()
    .min(1, "Profile name is required")
    .max(100, "Name must be less than 100 characters")
    .refine(
      (name) => {
        // Allow the current name (for editing) but prevent other duplicates
        if (currentName && name === currentName) return true;
        return !existingNames.includes(name);
      },
      {
        message:
          "A profile with this name already exists. Please choose a different name.",
      }
    ),
});
