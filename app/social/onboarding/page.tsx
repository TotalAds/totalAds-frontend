import { redirect } from "next/navigation";

/** Entry route: memory wizard only runs after admin enables access (see route guard). */
export default function SocialOnboardingPage() {
	redirect("/social/dashboard");
}
