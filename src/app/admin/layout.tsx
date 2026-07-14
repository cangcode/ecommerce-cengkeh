import { auth } from "@/auth";
import { redirect } from "next/navigation";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import {
  ShieldAlert,
  LayoutDashboard,
  Users,
  MessageSquare,
  ArrowLeft,
  ShoppingCart,
} from "lucide-react";
import { SidebarMenuLink } from "@/components/SidebarMenuLink";
import { SignOutButton } from "./SignOutButton";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect("/admin/login");
  }

  if (session.user.role !== "admin") {
    redirect("/login");
  }

  const sidebarLinks = [
    { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
    { href: "/admin/users", label: "Pengguna", icon: Users },
    { href: "/admin/products", label: "Produk", icon: ShoppingCart },
    { href: "/admin/testimonials", label: "Testimoni", icon: MessageSquare },
  ];

  return (
    <div className="font-inter min-h-svh">
      <SidebarProvider>
        <Sidebar>
          {/* header */}
          <SidebarHeader>
            <div className="flex items-center justify-between">
              <SidebarMenuLink
                href="/"
                className="flex items-center gap-2 text-sm text-cengkeh-brown hover:text-cengkeh-brown/90 transition-colors"
              >
                <ArrowLeft className="size-4" />
                <span>Beranda</span>
              </SidebarMenuLink>
            </div>
            <div className="rounded-md py-5 text-cengkeh-brown flex gap-3 items-center">
              <div className="size-10 rounded-full bg-red-100 flex items-center justify-center">
                <ShieldAlert className="size-5 text-red-700" />
              </div>
              <div className="flex flex-col font-bold">
                Admin Panel
                <span className="text-[10px] font-normal text-red-600 uppercase tracking-wide">
                  Administrator
                </span>
              </div>
            </div>
          </SidebarHeader>

          <SidebarContent>
            <SidebarGroup className="px-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold">
                    <SidebarMenuLink href="/admin">
                      <LayoutDashboard className="size-4!" />
                      Dashboard
                    </SidebarMenuLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
            <SidebarGroup className="px-2 gap-2">
              <SidebarMenu>
                {sidebarLinks.slice(1).map((link) => (
                  <SidebarMenuItem key={link.href}>
                    <SidebarMenuButton asChild className="font-semibold">
                      <SidebarMenuLink href={link.href}>
                        <link.icon className="size-4!" />
                        {link.label}
                      </SidebarMenuLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>

          {/* footer */}
          <SidebarFooter>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton>
                  <ShieldAlert className="size-4" /> {session.user.name}
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
            <div className="px-2 pb-2">
              <SignOutButton />
            </div>
          </SidebarFooter>
        </Sidebar>

        <main className="w-full min-h-svh min-w-0 overflow-y-auto bg-cengkeh-beige/20">
          <SidebarTrigger className="mt-2 ml-2" />
          <div className="min-w-0">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
}
