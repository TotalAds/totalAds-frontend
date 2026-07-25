"use client";

import Link from "next/link";

import { Checkbox } from "@/components/ui/checkbox";
import { LEGAL_URLS, LEGAL_VERSION } from "@/lib/legal";
import { ProductType } from "@/utils/auth/productIntent";

type LegalAcceptanceCheckboxProps = {
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  product?: ProductType;
  error?: string;
};

export function LegalAcceptanceCheckbox({
  checked,
  onCheckedChange,
  disabled,
  product,
  error,
}: LegalAcceptanceCheckboxProps) {
  return (
    <div className="space-y-1">
      <div className="flex items-start gap-2">
        <Checkbox
          id="acceptLegal"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          disabled={disabled}
          className="mt-0.5 shrink-0"
          aria-describedby="acceptLegal-description"
        />
        <label
          htmlFor="acceptLegal"
          id="acceptLegal-description"
          className="text-[11px] leading-snug text-gray-600 dark:text-text-200 cursor-pointer"
        >
          I agree to the{" "}
          <Link
            href={LEGAL_URLS.terms}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-main hover:text-brand-secondary underline"
          >
            Terms
          </Link>
          ,{" "}
          <Link
            href={LEGAL_URLS.privacy}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-main hover:text-brand-secondary underline"
          >
            Privacy
          </Link>
          ,{" "}
          <Link
            href={LEGAL_URLS.refund}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-main hover:text-brand-secondary underline"
          >
            Refund
          </Link>
          , and{" "}
          <Link
            href={LEGAL_URLS.dataUse}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-main hover:text-brand-secondary underline"
          >
            Data Use
          </Link>{" "}
          policies.
          {product === "socialsnipper" && (
            <> I will follow LinkedIn&apos;s terms.</>
          )}
        </label>
      </div>
      {error && <p className="text-red-400 text-[11px]">{error}</p>}
      <input type="hidden" name="acceptedLegalVersion" value={LEGAL_VERSION} />
    </div>
  );
}
