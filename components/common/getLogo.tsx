"use client";
import React from "react";

import LogoIcon from "@/asset/brand/logo";

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
  color = "#fff",
}: IProps) => {
  return (
    <div>
      <LogoIcon
        className={className}
        height={height}
        width={width}
        color={color}
      />
    </div>
  );
};

export default GetLogo;
