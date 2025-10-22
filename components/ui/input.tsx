import { motion, useMotionTemplate, useMotionValue } from 'framer-motion';
import * as React from 'react';

import { cn } from '@/utils/cn';

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  containerClass?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, containerClass, ...props }, ref) => {
    const radius = 100; // change this to increase the rdaius of the hover effect
    const [visible, setVisible] = React.useState(false);

    let mouseX = useMotionValue(0);
    let mouseY = useMotionValue(0);

    function handleMouseMove({ currentTarget, clientX, clientY }: any) {
      let { left, top } = currentTarget.getBoundingClientRect();

      mouseX.set(clientX - left);
      mouseY.set(clientY - top);
    }
    return (
      <motion.div
        style={{
          background: useMotionTemplate`
        radial-gradient(
          ${visible ? radius + "px" : "0px"} circle at ${mouseX}px ${mouseY}px,
          var(--accent-200),
          transparent 75%
        )
      `,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setVisible(true)}
        onMouseLeave={() => setVisible(false)}
        className={`p-[2px] rounded-lg transition duration-300 group/input ${containerClass}`}
      >
        <input
          type={type}
          className={cn(
            `flex h-10 w-full border-none bg-bg-300 text-text-100 shadow-input rounded-md px-3 py-2 text-sm file:border-0 file:bg-bg-300 
          file:text-sm file:font-medium placeholder:text-text-200 placeholder:opacity-60
          focus-visible:outline-none focus-visible:ring-[2px] focus-visible:ring-neutral-400
           disabled:cursor-not-allowed disabled:opacity-50
           group-hover/input:shadow-none transition duration-400
           `,
            className
          )}
          ref={ref}
          {...props}
        />
      </motion.div>
    );
  }
);
Input.displayName = "Input";

export { Input };
