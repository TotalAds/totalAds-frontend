"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import toast from "react-hot-toast";

import {
	createSocialSubscription,
	SocialPricingTier,
	verifySocialPayment,
	validateSocialCoupon,
} from "@/utils/api/socialBillingClient";
import { formatPriceInr } from "@/utils/social/formatPrice";
import { tierFeatureLines } from "@/utils/social/planCopy";
import { openRazorpayCheckout } from "@/utils/social/razorpayCheckout";
import { dispatchSocialSubscriptionUpdated } from "@/utils/social/socialSubscriptionEvents";
import { IconCheck, IconLoader2, IconX } from "@tabler/icons-react";

interface SocialCheckoutModalProps {
	tier: SocialPricingTier | null;
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export default function SocialCheckoutModal({
	tier,
	open,
	onClose,
	onSuccess,
}: SocialCheckoutModalProps) {
	const router = useRouter();
	const [hasPromo, setHasPromo] = useState<boolean | null>(null);
	const [promoCode, setPromoCode] = useState("");
	const [promoValid, setPromoValid] = useState<{
		valid: boolean;
		message?: string;
		freeMonths?: number;
	} | null>(null);
	const [validatingPromo, setValidatingPromo] = useState(false);
	const [processing, setProcessing] = useState(false);

	useEffect(() => {
		if (!open) {
			setHasPromo(null);
			setPromoCode("");
			setPromoValid(null);
			setProcessing(false);
		}
	}, [open]);

	const refreshAfterUpgrade = async () => {
		await onSuccess?.();
		dispatchSocialSubscriptionUpdated();
		router.refresh();
	};

	const handleValidatePromo = async () => {
		if (!tier || !promoCode.trim()) return;
		setValidatingPromo(true);
		try {
			const result = await validateSocialCoupon(promoCode.trim(), tier.id);
			setPromoValid(result);
			if (result.valid) {
				toast.success(result.message || "Promo code applied");
			} else {
				toast.error(result.message || "Invalid promo code");
			}
		} catch {
			toast.error("Could not validate promo code");
		} finally {
			setValidatingPromo(false);
		}
	};

	const handleCheckout = async () => {
		if (!tier || processing) return;
		setProcessing(true);

		try {
			const code =
				hasPromo === true && promoValid?.valid ? promoCode.trim() : undefined;
			const orderData = await createSocialSubscription(tier.id, code);

			if (orderData.freeTier || orderData.promoApplied) {
				toast.success(
					orderData.promoApplied
						? `Promo applied — ${orderData.freeMonths} month(s) activated`
						: "Plan updated"
				);
				await refreshAfterUpgrade();
				onClose();
				return;
			}

			if (!orderData.orderId || !orderData.key) {
				throw new Error("Checkout could not be started — missing order details");
			}

			// Close our modal before Razorpay opens so it isn't blocked by our overlay
			onClose();

			await openRazorpayCheckout({
				key: orderData.key,
				amount: orderData.amount ?? tier.monthlyPriceInPaise,
				currency: orderData.currency ?? "INR",
				orderId: orderData.orderId,
				name: "SocialSnipper",
				description: `${tier.displayName} plan`,
				email: orderData.email,
				prefillName: orderData.name,
				onSuccess: async (response) => {
					await verifySocialPayment({
						razorpayOrderId: response.razorpay_order_id,
						razorpayPaymentId: response.razorpay_payment_id,
						razorpaySignature: response.razorpay_signature,
						tierId: tier.id,
						paidAmountInPaise: tier.monthlyPriceInPaise,
					});
					toast.success("Plan upgraded!");
					await refreshAfterUpgrade();
				},
				onDismiss: () => setProcessing(false),
			});
		} catch (err) {
			if (err instanceof Error && err.message !== "Payment cancelled") {
				toast.error(err.message || "Checkout failed");
			}
		} finally {
			setProcessing(false);
		}
	};

	if (!open || !tier) return null;

	const features = tierFeatureLines(tier).slice(0, 4);
	const priceLabel = formatPriceInr(tier.monthlyPriceInPaise);

	return (
		<div className="pointer-events-none fixed inset-0 z-[100] flex items-center justify-center p-4 md:left-64">
			<div
				className="pointer-events-auto absolute inset-0 bg-black/60 backdrop-blur-sm"
				onClick={onClose}
				aria-hidden
			/>
			<div
				role="dialog"
				aria-modal="true"
				className="pointer-events-auto relative w-full max-w-lg rounded-2xl border border-bg-300 bg-bg-100 shadow-2xl"
			>
				<button
					type="button"
					onClick={onClose}
					className="absolute right-4 top-4 rounded-lg p-2 text-text-300 hover:bg-bg-200 hover:text-text-100"
				>
					<IconX className="h-5 w-5" />
				</button>

				<div className="border-b border-bg-300 px-6 py-5">
					<p className="text-xs font-semibold uppercase tracking-wide text-brand-main">
						Checkout
					</p>
					<h2 className="mt-1 text-xl font-bold text-text-100">
						Upgrade to {tier.displayName}
					</h2>
					<p className="mt-1 text-sm text-text-300">
						{priceLabel}
						{tier.isFreeTier ? "" : " · billed monthly · cancel anytime"}
					</p>
				</div>

				<div className="space-y-5 px-6 py-5">
					<ul className="space-y-2">
						{features.map((f) => (
							<li key={f} className="flex items-start gap-2 text-sm text-text-200">
								<IconCheck className="mt-0.5 h-4 w-4 shrink-0 text-emerald-500" />
								{f}
							</li>
						))}
					</ul>

					{hasPromo === null && !tier.isFreeTier && (
						<div className="rounded-xl border border-bg-300 bg-bg-200/50 p-4">
							<p className="text-sm font-medium text-text-100">
								Do you have a promo code?
							</p>
							<p className="mt-1 text-xs text-text-300">
								Enter it before payment if you have one from a partner or campaign.
							</p>
							<div className="mt-4 flex gap-2">
								<button
									type="button"
									onClick={() => setHasPromo(true)}
									className="flex-1 rounded-lg border border-brand-main/40 bg-brand-main/10 px-3 py-2 text-sm font-medium text-brand-main hover:bg-brand-main/20"
								>
									Yes, I have a code
								</button>
								<button
									type="button"
									onClick={() => setHasPromo(false)}
									className="flex-1 rounded-lg border border-bg-300 px-3 py-2 text-sm font-medium text-text-200 hover:bg-bg-200"
								>
									No, continue
								</button>
							</div>
						</div>
					)}

					{hasPromo === true && (
						<div className="space-y-3 rounded-xl border border-bg-300 bg-bg-200/50 p-4">
							<label className="block text-sm font-medium text-text-100">
								Promo code
							</label>
							<div className="flex gap-2">
								<input
									type="text"
									value={promoCode}
									onChange={(e) => {
										setPromoCode(e.target.value.toUpperCase());
										setPromoValid(null);
									}}
									placeholder="Enter code"
									className="flex-1 rounded-lg border border-bg-300 bg-bg-100 px-3 py-2 text-sm uppercase text-text-100"
								/>
								<button
									type="button"
									disabled={validatingPromo || !promoCode.trim()}
									onClick={handleValidatePromo}
									className="rounded-lg border border-bg-300 px-4 py-2 text-sm font-medium text-text-200 hover:bg-bg-200 disabled:opacity-50"
								>
									{validatingPromo ? (
										<IconLoader2 className="h-4 w-4 animate-spin" />
									) : (
										"Verify"
									)}
								</button>
							</div>
							{promoValid && (
								<p
									className={`text-xs ${promoValid.valid ? "text-emerald-500" : "text-amber-500"}`}
								>
									{promoValid.valid
										? promoValid.freeMonths
											? `${promoValid.freeMonths} month(s) free will be applied at checkout.`
											: "Code verified — continue to checkout."
										: promoValid.message || "Invalid code"}
								</p>
							)}
							<button
								type="button"
								onClick={() => {
									setHasPromo(false);
									setPromoCode("");
									setPromoValid(null);
								}}
								className="text-xs text-text-300 hover:text-text-200"
							>
								Skip promo code
							</button>
						</div>
					)}
				</div>

				<div className="flex gap-3 border-t border-bg-300 px-6 py-4">
					<button
						type="button"
						onClick={onClose}
						className="flex-1 rounded-xl border border-bg-300 px-4 py-3 text-sm font-semibold text-text-200 hover:bg-bg-200"
					>
						Cancel
					</button>
					<button
						type="button"
						disabled={
							processing ||
							(!tier.isFreeTier && hasPromo === null) ||
							(hasPromo === true && promoCode.trim() !== "" && !promoValid?.valid)
						}
						onClick={() => {
							if (tier.isFreeTier) {
								void handleCheckout();
								return;
							}
							if (hasPromo === true && promoCode.trim() && !promoValid?.valid) {
								toast.error("Verify your promo code first");
								return;
							}
							void handleCheckout();
						}}
						className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-brand-main px-4 py-3 text-sm font-semibold text-white hover:bg-brand-main/90 disabled:opacity-50"
					>
						{processing ? (
							<IconLoader2 className="h-4 w-4 animate-spin" />
						) : tier.isFreeTier ? (
							"Activate Free plan"
						) : promoValid?.valid && promoValid.freeMonths ? (
							"Apply promo & activate"
						) : (
							`Pay ${priceLabel}`
						)}
					</button>
				</div>
			</div>
		</div>
	);
}
