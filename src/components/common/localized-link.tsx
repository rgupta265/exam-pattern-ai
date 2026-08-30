"use client";

import * as React from "react";
import NextLink, { LinkProps as NextLinkProps } from "next/link";
import { usePathname } from "next/navigation";
import { getLocaleFromPath, localizePath } from "@/lib/i18n";

export interface LocalizedLinkProps
  extends Omit<React.AnchorHTMLAttributes<HTMLAnchorElement>, keyof NextLinkProps>,
    Omit<NextLinkProps, "href"> {
  href: string;
  children?: React.ReactNode;
}

export const LocalizedLink = React.forwardRef<HTMLAnchorElement, LocalizedLinkProps>(
  ({ href, children, ...props }, ref) => {
    const pathname = usePathname();
    const locale = getLocaleFromPath(pathname);
    const resolvedHref = localizePath(href, locale);

    return (
      <NextLink ref={ref} href={resolvedHref} {...props}>
        {children}
      </NextLink>
    );
  }
);

LocalizedLink.displayName = "LocalizedLink";
