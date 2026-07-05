"use client";

import { signOut } from "next-auth/react";

export function SignOutButton() {
  return (
    <button
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      className="w-full text-left text-xs text-muted-foreground hover:text-red-600 transition-colors px-2 py-0.5"
    >
      Keluar
    </button>
  );
}
