import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  // Base styles
  "inline-flex items-center justify-center gap-2 rounded-[10px] font-semibold text-sm transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 active:scale-95 select-none",
  {
    variants: {
      variant: {
        primary:
          "bg-[#0A1F44] text-white hover:bg-[#122558] focus-visible:ring-[#0A1F44] shadow-sm hover:shadow-md",
        gold:
          "bg-[#F5B800] text-[#0A1F44] hover:bg-[#FFD43B] focus-visible:ring-[#F5B800] shadow-sm hover:shadow-md font-bold",
        outline:
          "border-2 border-[#0A1F44] text-[#0A1F44] bg-transparent hover:bg-[#0A1F44] hover:text-white focus-visible:ring-[#0A1F44]",
        ghost:
          "text-[#0A1F44] hover:bg-[#0A1F44]/10 focus-visible:ring-[#0A1F44]",
        destructive:
          "bg-red-600 text-white hover:bg-red-700 focus-visible:ring-red-600",
      },
      size: {
        sm:   "h-8  px-3  text-xs",
        md:   "h-10 px-4  text-sm",
        lg:   "h-12 px-6  text-base",
        xl:   "h-14 px-8  text-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "md",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
