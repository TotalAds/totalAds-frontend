"use client";

import { useSearchParams } from "next/navigation";
import React from "react";

import { ProductChooser } from "@/components/authentication/ProductChooser";
import { SignupComponent } from "@/components/authentication/signup";
import { parseProduct } from "@/utils/auth/productIntent";

const Signup = () => {
  const searchParams = useSearchParams();

  /*
  // Check if product is specified in URL
  const product = parseProduct(
    searchParams.get("product") || searchParams.get("app")
  );

  // If no product specified, show product chooser
  if (!product) {
    return <ProductChooser mode="signup" />;
  }
  */

  // Otherwise show the signup form
  return <SignupComponent />;
};

export default Signup;
