"use client";

import { useEffect, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

type BodyPortalProps = {
  children: ReactNode;
};

/**
 * Renders on `document.body` so `position: fixed; inset: 0` covers the full viewport
 * (not clipped or offset by transformed / filtered / backdrop ancestors or scroll areas).
 */
export function BodyPortal({ children }: BodyPortalProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;
  return createPortal(children, document.body);
}
