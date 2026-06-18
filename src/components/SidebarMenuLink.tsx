"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSidebar } from "@/components/ui/sidebar";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof Link>;

export function SidebarMenuLink({ onClick, className, href, ...props }: Props) {
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
          "bg-cengkeh-brown! text-cengkeh-beige! hover:bg-cengkeh-brown! hover:text-cengkeh-beige!",
      )}
    />
  );
}
