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
  const productLabel =
    product === "socialsnipper" ? "SocialSnipper" : "LeadSnipper";

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-3">
        <Checkbox
          id="acceptLegal"
          checked={checked}
          onCheckedChange={(value) => onCheckedChange(value === true)}
          disabled={disabled}
          className="mt-0.5"
          aria-describedby="acceptLegal-description"
        />
        <label
          htmlFor="acceptLegal"
          id="acceptLegal-description"
          className="text-xs leading-relaxed text-gray-600 dark:text-text-200 cursor-pointer"
        >
          I agree to the{" "}
          <Link
            href={LEGAL_URLS.terms}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-main hover:text-brand-secondary underline"
          >
            Terms of Service
          </Link>
          ,{" "}
          <Link
            href={LEGAL_URLS.privacy}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-main hover:text-brand-secondary underline"
          >
            Privacy Policy
          </Link>
          ,{" "}
          <Link
            href={LEGAL_URLS.refund}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-main hover:text-brand-secondary underline"
          >
            Refund Policy
          </Link>
          , and{" "}
          <Link
            href={LEGAL_URLS.dataUse}
            target="_blank"
            rel="noopener noreferrer"
            className="text-brand-main hover:text-brand-secondary underline"
          >
            Data Use Policy
          </Link>
          . I understand that {productLabel} may process my data and that paid
          plans are billed through Razorpay per the Refund Policy.
          {product === "socialsnipper" && (
            <>
              {" "}
              I will comply with LinkedIn&apos;s terms when using SocialSnipper.
            </>
          )}
        </label>
      </div>
      {error && <p className="text-red-400 text-xs">{error}</p>}
      <input type="hidden" name="acceptedLegalVersion" value={LEGAL_VERSION} />
    </div>
  );
}
