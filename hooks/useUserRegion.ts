"use client";

import { useEffect, useState } from "react";

import {
  detectIndiaFromBrowser,
  resolveUserRegion,
  type UserRegion,
} from "@/lib/userRegion";

export function useUserRegion() {
  const [region, setRegion] = useState<UserRegion>(() => {
    const browser = detectIndiaFromBrowser();
    return browser ?? { isIndia: true, source: "default" };
  });
  const [isResolving, setIsResolving] = useState(true);

  useEffect(() => {
    let cancelled = false;

    resolveUserRegion()
      .then((resolved) => {
        if (!cancelled) setRegion(resolved);
      })
      .finally(() => {
        if (!cancelled) setIsResolving(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return {
    isIndia: region.isIndia,
    countryCode: region.countryCode,
    source: region.source,
    isResolving,
  };
}
