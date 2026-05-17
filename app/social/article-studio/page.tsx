import { redirect } from "next/navigation";

/** Article flow hidden from UI — backend routes remain for future use. */
export default function ArticleStudioPage() {
	redirect("/social/posts");
}
