"use client";

import Link from "next/link";
import { Menu, X } from "lucide-react";
import { useState } from "react";
import AppButton from "./AppButton";
import { useSession } from "next-auth/react";
import { signOut } from "next-auth/react";

const Navbar = () => {
  const { data: session, status } = useSession();
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
  };

  const handleLogout = async () => {
    setIsOpen(false);
    await signOut({ callbackUrl: "/login" });
  };

  return (
    <>
      <div className="h-15 w-full font-inter bg-cengkeh-beige fixed top-0 flex justify-between items-center px-6 md:px-70 shadow-sm shadow-cengkeh-brown/10 z-40">
        <div className="size-10 rounded-sm bg-cengkeh-brown flex justify-center items-center text-cengkeh-beige">
          B
        </div>
        <div className="gap-10 justify-center items-center hidden md:flex">
          <Link
            className="text-cengkeh-brown hover:text-cengkeh-darker-brown text-center transition-colors"
            href={"/"}
          >
            Beranda
          </Link>
          <Link
            className="text-cengkeh-brown hover:text-cengkeh-darker-brown text-center transition-colors"
            href={"/product"}
          >
            Produk
          </Link>

          {session && (
            <Link
              className="text-cengkeh-brown hover:text-cengkeh-darker-brown text-center transition-colors"
              href={"/dashboard"}
            >
              Dashboard
            </Link>
          )}
        </div>

        <button
          onClick={toggleMenu}
          className="md:hidden flex items-center justify-center"
        >
          {isOpen ? (
            <X className="size-8 text-cengkeh-brown" />
          ) : (
            <Menu className="size-8 text-cengkeh-brown" />
          )}
        </button>

        {status === "authenticated" ? (
          <AppButton
            className="text-center hidden md:block"
            onClick={handleLogout}
          >
            Logout
          </AppButton>
        ) : (
          <div className="gap-3 hidden md:flex">
            <AppButton className="w-full text-center" asChild>
              <Link href={"/login"}>Masuk</Link>
            </AppButton>
            <AppButton variant="outline" className="w-full text-center" asChild>
              <Link href={"/register"}>Daftar</Link>
            </AppButton>
          </div>
        )}
      </div>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="fixed top-15 left-0 right-0 bg-cengkeh-beige shadow-md md:hidden z-30 font-inter">
          <div className="flex flex-col gap-4 p-6">
            <Link
              className="text-cengkeh-brown hover:text-cengkeh-darker-brown transition-colors"
              href={"/"}
              onClick={() => setIsOpen(false)}
            >
              Beranda
            </Link>
            <Link
              className="text-cengkeh-brown hover:text-cengkeh-darker-brown transition-colors"
              href={"/"}
              onClick={() => setIsOpen(false)}
            >
              Produk
            </Link>
            <Link
              className="text-cengkeh-brown hover:text-cengkeh-darker-brown transition-colors"
              href={"/dashboard"}
              onClick={() => setIsOpen(false)}
            >
              Dashboard
            </Link>
            {status === "authenticated" ? (
              <div className="flex flex-col gap-2 pt-2">
                <AppButton
                  variant="outline"
                  className="w-full text-center"
                  onClick={handleLogout}
                >
                  Logout
                </AppButton>
              </div>
            ) : (
              <div className="flex flex-col gap-2 pt-2">
                <AppButton
                  variant="outline"
                  className="w-full text-center"
                  asChild
                >
                  <Link href={"/login"} onClick={() => setIsOpen(false)}>
                    Masuk
                  </Link>
                </AppButton>
                <AppButton className="w-full text-center" asChild>
                  <Link href={"/register"} onClick={() => setIsOpen(false)}>
                    Daftar
                  </Link>
                </AppButton>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
