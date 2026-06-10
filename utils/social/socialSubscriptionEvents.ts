export const SOCIAL_SUBSCRIPTION_UPDATED_EVENT = "social-subscription-updated";

export function dispatchSocialSubscriptionUpdated() {
	if (typeof window !== "undefined") {
		window.dispatchEvent(new CustomEvent(SOCIAL_SUBSCRIPTION_UPDATED_EVENT));
	}
}
