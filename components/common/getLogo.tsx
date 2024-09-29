"use client";
import { useTheme } from "next-themes";
import Image from "next/image";
import React from "react";

import LogoIcon from "@/asset/brand/logo";
import LogoDark from "@/asset/brand/logo_dark.svg";
import LogoWhite from "@/asset/brand/logo_white.svg";

type IProps = {
  className?: string;
  height?: string;
  width?: string;
  color?: string;
};

const GetLogo = ({
  className = "",
  height = "32",
  width = "32",
  color = "#1F2B3E",
}: IProps) => {
  const { resolvedTheme } = useTheme();

  return (
    <div>
      <LogoIcon
        className={className}
        height={height}
        width={width}
        color={"var(--text-100)"}
      />
    </div>
  );
};

export default GetLogo;
