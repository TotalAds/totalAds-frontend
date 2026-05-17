import { redirect } from "next/navigation";

/** Article management hidden from UI — backend routes remain for future use. */
export default function SocialArticlesPage() {
	redirect("/social/posts");
}
