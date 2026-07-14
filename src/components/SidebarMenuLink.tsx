"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link> & {
  activeClassName?: string;
};

export function SidebarMenuLink({
  onClick,
  className,
  href,
  activeClassName,
  ...props
}: Props) {
  const pathname = usePathname();
  const { isMobile, setOpenMobile } = useSidebar();

  const hrefStr = typeof href === "string" ? href : "";
  const isActive = hrefStr ? pathname === hrefStr : false;

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (isMobile) {
      setOpenMobile(false);
    }
  };

  return (
    <Link
      {...props}
      href={href}
      onClick={handleClick}
      className={cn(
        className,
        isActive &&
          (activeClassName ??
            "bg-emerald-700! text-white! hover:bg-emerald-700! hover:text-white!"),
      )}
    />
  );
}
