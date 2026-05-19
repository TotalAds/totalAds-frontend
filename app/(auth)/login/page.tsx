"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

import { LoginComponent } from "@/components/authentication/login";
import { ProductChooser } from "@/components/authentication/ProductChooser";
import { parseProduct } from "@/utils/auth/productIntent";

const Login = () => {
  const searchParams = useSearchParams();

  // Check if product is specified in URL
  const product = parseProduct(
    searchParams.get("product") || searchParams.get("app")
  );

  // If no product specified, show product chooser
  if (!product) {
    return <ProductChooser mode="login" />;
  }

  // Otherwise show the login form
  return <LoginComponent />;
};

export default Login;
