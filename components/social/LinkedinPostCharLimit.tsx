"use client";

import { InlineAlert } from "@/components/social/SocialUi";
import {
	getLinkedinPostCharCountColor,
	getLinkedinPostLengthError,
	LINKEDIN_POST_MAX_CHARS,
	LINKEDIN_POST_SWEET_SPOT_MAX,
	LINKEDIN_POST_SWEET_SPOT_MIN,
} from "@/utils/social/linkedinPostLimits";

export function LinkedinPostCharLimit({
	charCount,
	className = "",
	showAlert = true,
}: {
	charCount: number;
	className?: string;
	showAlert?: boolean;
}) {
	const overLimit = charCount > LINKEDIN_POST_MAX_CHARS;
	const color = getLinkedinPostCharCountColor(charCount);
	const lengthError = getLinkedinPostLengthError(charCount);

	return (
		<div className={className}>
			<div className="flex flex-wrap items-center justify-between gap-2 text-xs">
				<span className={color}>
					<span className="font-semibold">{charCount.toLocaleString()}</span>
					{" / "}
					{LINKEDIN_POST_MAX_CHARS.toLocaleString()} characters
				</span>
				<span className="text-slate-500">
					Sweet spot: {LINKEDIN_POST_SWEET_SPOT_MIN.toLocaleString()}–
					{LINKEDIN_POST_SWEET_SPOT_MAX.toLocaleString()}
				</span>
			</div>
			{showAlert && overLimit && lengthError ? (
				<div className="mt-2">
					<InlineAlert
						tone="danger"
						title="Post exceeds LinkedIn limit"
						description={lengthError}
					/>
				</div>
			) : null}
		</div>
	);
}