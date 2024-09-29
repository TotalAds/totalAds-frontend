"use client";
import React from "react";

import DarkModeToggle from "@/components/common/darkModeToggle";
import GetLogo from "@/components/common/getLogo";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/utils/cn";
import { IconLogin, IconUserCircle } from "@tabler/icons-react";

import { BottomGradient, LabelInputContainer } from "./signup";

type Props = {};

const ForgotPasswordComponent = (props: Props) => {
  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    console.log("Form submitted");
  };
  return (
    <div>
      <div className=" w-full h-[100vh] flex justify-center items-center ">
        <div className="max-w-md w-full rounded-none md:rounded-2xl p-4 md:p-8 shadow-input bg-bg-200 ">
          <div className="flex items-center mb-6 text-2xl font-semibold text-gray-900 dark:text-white">
            <GetLogo className="w-8 h-8 mr-2" />
            TotalAds
          </div>
          {/* <h1 className="text-xl font-bold leading-tight tracking-tight text-text md:text-2xl ">
            Account Not Found
          </h1>

          <p className="text-text text-sm max-w-sm mt-2">
            Yay! An account has been found. <br /> Please verify your email for
            a password reset. An OTP will be sent to your email.
            -------------------------- Unfortunately,an account could not be
            found. <br />
            Please check your email address and try again, or sign up for a new
            account.
          </p> */}
          <form className="my-8" onSubmit={handleSubmit}>
            {/* <LabelInputContainer className="mb-4">
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                placeholder="projectmayhem@fc.com"
                type="email"
              />
            </LabelInputContainer>
            <button
              className="bg-gradient-to-br relative group/btn from-black  to-primary-200 hover:from-primary-200 hover:to-black transition delay-300 ease-linear   block  w-full text-white rounded-md h-10 font-medium shadow-[0px_1px_0px_0px_#ffffff40_inset,0px_-1px_0px_0px_#ffffff40_inset] dark:shadow-[0px_1px_0px_0px_var(--zinc-800)_inset,0px_-1px_0px_0px_var(--zinc-800)_inset]"
              type="submit"
            >
               Search Account &rarr;
              <BottomGradient />

              loading div
              <div className="flex justify-center items-center gap-4 text-white">
                <div className="flex justify-center items-center">
                  <div className="relative inline-flex">
                    <div className="w-4 h-4 bg-white rounded-full"></div>
                    <div className="w-4 h-4 bg-white rounded-full absolute top-0 left-0 animate-ping"></div>
                    <div className="w-4 h-4 bg-white rounded-full absolute top-0 left-0 animate-pulse"></div>
                  </div>
                </div>
                Loading...
              </div>
            </button> */}

            <div className="bg-gradient-to-r from-transparent via-neutral-300 dark:via-neutral-700 to-transparent my-8 h-[1px] w-full" />

            <div className="flex flex-col space-y-4">
              <button
                className=" relative group/btn flex space-x-2 items-center justify-start px-4 w-full text-text rounded-md h-10 font-medium shadow-input bg-gray-50 dark:bg-zinc-900 dark:shadow-[0px_0px_1px_1px_var(--neutral-800)]"
                type="submit"
              >
                &larr;
                <span className="text-neutral-700 dark:text-neutral-300 text-sm">
                  Back to login
                </span>
                <BottomGradient />
              </button>
            </div>
          </form>
        </div>
      </div>
      <DarkModeToggle />
    </div>
  );
};

export default ForgotPasswordComponent;
