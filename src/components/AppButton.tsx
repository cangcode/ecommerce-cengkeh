import { cn } from "@/lib/utils";
import { Slot } from "@radix-ui/react-slot";
import React from "react";

type AppButtonProps = React.ButtonHTMLAttributes<HTMLButtonElement> & {
  children: React.ReactNode;
  variant?: "solid" | "outline";
  asChild?: boolean;
};

const AppButton = React.forwardRef<HTMLButtonElement, AppButtonProps>(
  (
    { children, variant = "solid", className, asChild = false, ...props },
    ref,
  ) => {
    const baseClass = "px-3 py-1 rounded-sm transition-colors cursor-pointer";

    const variantClass =
      variant === "outline"
        ? "border-2 border-cengkeh-brown text-cengkeh-brown hover:scale-102"
        : "bg-cengkeh-brown border-2 border-cengkeh-brown text-cengkeh-beige hover:scale-102";

    const Comp = asChild ? Slot : "button";

    return (
      <Comp
        ref={asChild ? undefined : ref}
        className={cn(baseClass, variantClass, className)}
        {...props}
      >
        {children}
      </Comp>
    );
  },
);

AppButton.displayName = "AppButton";

export default AppButton;
