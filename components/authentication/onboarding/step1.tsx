"use client";

interface Step1Props {
  isLoading: boolean;
  onContinue: () => void;
  onSkip: () => void;
}

export default function OnboardingStep1({ isLoading, onContinue, onSkip }: Step1Props) {
  return (
    <div className="space-y-6 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-semibold text-text-100">Welcome to LeadSnipper</h2>
        <p className="text-sm text-text-200">
          Let&apos;s launch your first campaign in less than 3 minutes.
        </p>
      </div>

      <button
        type="button"
        onClick={onContinue}
        disabled={isLoading}
        className="w-full py-3 px-4 text-sm font-medium text-white bg-brand-main rounded-lg hover:bg-brand-main/90 transition-colors disabled:opacity-50"
      >
        Continue
      </button>

      <button
        type="button"
        onClick={onSkip}
        disabled={isLoading}
        className="text-sm text-text-200 hover:text-text-100 transition-colors"
      >
        Already have everything configured? Skip setup
      </button>
    </div>
  );
}
