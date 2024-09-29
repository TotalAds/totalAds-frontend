"use client";
import Image from "next/image";
import React from "react";

import DarkModeToggle from "@/components/common/darkModeToggle";
import GetLogo from "@/components/common/getLogo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { IconLogin } from "@tabler/icons-react";

export function SignUpComponent() {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted");
  };
  return (
    <div className="w-full h-[100vh] flex justify-center items-center">
      <div className="max-w-md w-full rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-bg-200 ">
        <div className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
          <GetLogo className="w-8 h-8 mr-2" />
          TotalAds
        </div>

        <form className="mt-8" onSubmit={handleSubmit}>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="firstname">Full Name</Label>
            <Input id="firstname" placeholder="Full Name" type="text" />
          </LabelInputContainer>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="email">Email Address</Label>
            <Input id="email" placeholder="yourmail@email.com" type="number" />
          </LabelInputContainer>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="mobile">Mobile Number</Label>
            <Input id="mobile" placeholder="99999 99999" type="mobile" />
          </LabelInputContainer>
          <LabelInputContainer className="mb-4">
            <Label htmlFor="password">Password</Label>
            <Input id="password" placeholder="••••••••" type="password" />
          </LabelInputContainer>
          <LabelInputContainer className="mb-8">
            <Label htmlFor="confirmPassword">Confirm Password</Label>
            <Input
              id="confirmPassword"
              placeholder="••••••••"
              type="confirmPassword"
            />
          </LabelInputContainer>

          <button
            className="bg-gradient-to-br relative group/btn from-black  to-primary-200 hover:from-primary-200 hover:to-black transition delay-300 ease-linear   block  w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
            type="submit"
          >
            SignUp &rarr;
            <BottomGradient />
          </button>

          <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

          <div className="flex flex-col space-y-4">
            <button
              className=" relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-text rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
              type="submit"
            >
              <IconLogin className="h-4 w-4 text-text dark:text-neutral-300" />
              <span className="text-neutral-700 dark:text-neutral-300 text-sm">
                Login
              </span>
              <BottomGradient />
            </button>
          </div>
        </form>
      </div>
      <DarkModeToggle />
    </div>
  );
}

export const BottomGradient = () => {
  return (
    <>
      <span className="group-hover/btn:opacity-100 block transition duration-500 opacity-0 absolute h-px w-full -bottom-px inset-x-0 bg-gradient-to-r from-transparent via-cyan-500 to-transparent" />
      <span className="group-hover/btn:opacity-100 blur-sm block transition duration-500 opacity-0 absolute h-px w-1/2 mx-auto -bottom-px inset-x-10 bg-gradient-to-r from-transparent via-indigo-500 to-transparent" />
    </>
  );
};

export const LabelInputContainer = ({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) => {
  return (
    <div className={cn("flex flex-col space-y-2 w-full", className)}>
      {children}
    </div>
  );
};
