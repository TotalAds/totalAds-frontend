import * as React from "react";

import { cn } from "@/utils/cn";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClass?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, containerClass, ...props }, ref) => {
    return (
      <div className={cn("w-full", containerClass)}>
        <input
          type={type}
          className={cn(
            "flex h-11 w-full rounded-lg border border-slate-200 bg-white px-4 py-2.5 text-sm text-slate-700",
            "placeholder:text-slate-400",
            "focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500",
            "disabled:cursor-not-allowed disabled:bg-slate-50 disabled:text-slate-400",
            "transition-colors duration-200",
            className
          )}
          ref={ref}
          {...props}
        />
      </div>
    );
  }
);
Input.displayName = "Input";

export { Input };
