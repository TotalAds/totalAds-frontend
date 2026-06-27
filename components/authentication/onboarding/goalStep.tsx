"use client";

import type { OnboardingGoal } from "@/utils/api/apiClient";

const GOAL_CARDS: Array<{ id: OnboardingGoal; label: string }> = [
  { id: "find_new_leads", label: "Find new leads" },
  { id: "send_cold_emails", label: "Send cold emails" },
  { id: "manage_replies", label: "Manage replies" },
  { id: "verify_email_lists", label: "Verify email lists" },
  { id: "everything", label: "Everything" },
];

interface GoalStepProps {
  goals: OnboardingGoal[];
  onToggleGoal: (goal: OnboardingGoal) => void;
  onBack: () => void;
  onContinue: () => void;
  isLoading: boolean;
}

export default function GoalStep({
  goals,
  onToggleGoal,
  onBack,
  onContinue,
  isLoading,
}: GoalStepProps) {
  return (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-text-100">What are you here to do?</h2>
      <p className="text-sm text-text-200">This helps personalize your dashboard.</p>

      <div className="space-y-3">
        {GOAL_CARDS.map((goal) => {
          const selected = goals.includes(goal.id);
          return (
            <button
              key={goal.id}
              type="button"
              onClick={() => onToggleGoal(goal.id)}
              className={`w-full rounded-xl border-2 px-4 py-3 text-left transition-colors ${
                selected
                  ? "border-brand-main bg-brand-main/10 text-text-100"
                  : "border-bg-200 bg-bg-100 text-text-100 hover:border-bg-300"
              }`}
            >
              {goal.label}
            </button>
          );
        })}
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onBack}
          disabled={isLoading}
          className="flex-1 py-3 px-4 text-sm font-medium text-text-100 bg-bg-200 rounded-lg hover:bg-bg-300 transition-colors disabled:opacity-50"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={isLoading}
          className="flex-1 py-3 px-4 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 transition-colors disabled:opacity-50"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
