import { CreateICPProfileRequest, ICPProfile } from "@/utils/api";

export interface ICPProfileFormProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: CreateICPProfileRequest) => Promise<void>;
  initialData?: ICPProfile | null;
  isLoading?: boolean;
  existingProfiles?: ICPProfile[];
  formError?: string | null;
  onClearFormError?: () => void;
}

export interface CriterionForm {
  category: string;
  field: string;
  operator: string;
  value: string;
  weight: number;
  isRequired: boolean;
  scoreIfMatch: number;
  scoreIfNoMatch: number;
  description: string;
}

export interface StepProps {
  formData: CreateICPProfileRequest;
  setFormData: (data: CreateICPProfileRequest) => void;
  validationErrors: Record<string, string[]>;
  validationStarted: boolean;
  criteria?: CriterionForm[];
  setCriteria?: (criteria: CriterionForm[]) => void;
  addCriterion?: () => void;
  removeCriterion?: (index: number) => void;
  updateCriterion?: (
    index: number,
    field: keyof CriterionForm,
    value: any
  ) => void;
  clearFormError?: () => void;
}

export interface Step {
  id: number;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
}

export interface CategoryOption {
  value: string;
  label: string;
}

export interface OperatorOption {
  value: string;
  label: string;
}
