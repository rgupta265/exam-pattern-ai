"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-lg text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 disabled:pointer-events-none disabled:opacity-50 min-h-[44px] px-4 py-2 cursor-pointer select-none",
  {
    variants: {
      variant: {
        default: "bg-blue-600 text-white hover:bg-blue-700 active:bg-blue-800 shadow-sm",
        destructive: "bg-red-600 text-white hover:bg-red-700 active:bg-red-800 shadow-sm",
        outline: "border border-slate-300 bg-white hover:bg-slate-100 hover:text-slate-900 text-slate-700 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800",
        secondary: "bg-slate-100 text-slate-900 hover:bg-slate-200 dark:bg-slate-800 dark:text-white dark:hover:bg-slate-700",
        ghost: "hover:bg-slate-100 text-slate-700 hover:text-slate-900 dark:text-slate-200 dark:hover:bg-slate-800 dark:hover:text-white",
        link: "text-blue-600 underline-offset-4 hover:underline min-h-0 p-0",
      },
      size: {
        default: "h-11 px-4 py-2",
        sm: "h-9 rounded-md px-3 text-xs min-h-[36px]",
        lg: "h-12 rounded-lg px-8 text-base min-h-[48px]",
        icon: "h-11 w-11 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  isLoading?: boolean;
  href?: string;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, isLoading, children, disabled, href, ...props }, ref) => {
    const pathname = usePathname();
    const locale = getLocaleFromPath(pathname);

    if (href) {
      const resolvedHref = localizePath(href, locale);
      return (
        <Link
          href={resolvedHref}
          className={cn(buttonVariants({ variant, size, className }))}
          aria-disabled={disabled || isLoading}
        >
          {isLoading && (
            <svg
              className="mr-2 h-4 w-4 animate-spin"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24"
            >
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              ></path>
            </svg>
          )}
          {children}
        </Link>
      );
    }

    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="mr-2 h-4 w-4 animate-spin"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {children}
      </button>
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
