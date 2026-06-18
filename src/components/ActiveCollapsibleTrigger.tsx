"use client";

import { usePathname } from "next/navigation";
import { CollapsibleTrigger } from "./ui/collapsible";
import { cn } from "@/lib/utils";
import type { ComponentProps } from "react";

type Props = ComponentProps<typeof CollapsibleTrigger> & {
  /** Route prefix untuk menandai aktif, misal "/dashboard/products" */
  activePrefix: string;
};

export function ActiveCollapsibleTrigger({
  className,
  activePrefix,
  children,
  ...props
}: Props) {
  const pathname = usePathname();
  const isActive = pathname.startsWith(activePrefix);

  return (
    <CollapsibleTrigger
      {...props}
      className={cn(
        className,
        isActive &&
          "bg-cengkeh-brown! text-cengkeh-beige! hover:bg-cengkeh-brown! hover:text-cengkeh-beige!",
      )}
    >
      {children}
    </CollapsibleTrigger>
  );
}
