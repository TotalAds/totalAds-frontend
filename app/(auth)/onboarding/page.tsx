import React from "react";
import { redirect } from "next/navigation";

import OnboardingComponent from "@/components/authentication/onboarding";

const OnboardingPage = ({
	searchParams,
}: {
	searchParams?: { product?: string; app?: string };
}) => {
	const target = (searchParams?.product || searchParams?.app || "").toLowerCase();
	if (target === "socialsniper" || target === "social") {
		redirect("/social/memory/onboarding");
	}
  return <OnboardingComponent />;
};

export default OnboardingPage;

