"use client";

import { useEffect } from "react";

/** Lock page scroll while a modal overlay is visible. */
export function useBodyScrollLock(locked: boolean) {
	useEffect(() => {
		if (!locked) return;

		const { overflow: bodyOverflow, paddingRight } = document.body.style;
		const scrollbarWidth = window.innerWidth - document.documentElement.clientWidth;
		const mainEl = document.querySelector("main");
		const mainOverflow = mainEl?.style.overflow ?? "";

		document.body.style.overflow = "hidden";
		if (scrollbarWidth > 0) {
			document.body.style.paddingRight = `${scrollbarWidth}px`;
		}
		if (mainEl) {
			mainEl.style.overflow = "hidden";
		}

		return () => {
			document.body.style.overflow = bodyOverflow;
			document.body.style.paddingRight = paddingRight;
			if (mainEl) {
				mainEl.style.overflow = mainOverflow;
			}
		};
	}, [locked]);
}
