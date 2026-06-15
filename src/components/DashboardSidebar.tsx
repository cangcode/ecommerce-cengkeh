import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  Package,
  Store,
  TrendingUp,
  User2,
} from "lucide-react";
import { auth } from "@/auth";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "./ui/collapsible";
import Link from "next/link";
import { Separator } from "./ui/separator";

export async function DashboardSidebar() {
  const session = await auth();
  return (
    <Sidebar>
      {/* header */}
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-sm text-cengkeh-brown hover:text-cengkeh-brown/90 transition-colors"
          >
            <ArrowLeft className="size-4" />
            <span>Beranda</span>
          </Link>
        </div>
        <div className="rounded-md py-5 text-cengkeh-brown flex gap-3 items-center">
          <div className="size-10 rounded-full bg-cengkeh-brown"></div>
          <div className="flex flex-col font-bold">
            Dashboard
            <span className="capitalize text-xs font-medium">
              {session?.user.role}
            </span>
          </div>
        </div>
      </SidebarHeader>
      {session?.user.role === "penjual" ? (
        <>
          {/* sidebar penjual */}
          <SidebarContent>
            <SidebarGroup className="px-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold">
                    <Link href="/dashboard">
                      <LayoutDashboard className="size-4!" />
                      Dashboard
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <Collapsible defaultOpen className="group/collapsible px-2">
              <SidebarGroup className="p-0">
                <SidebarGroupLabel
                  asChild
                  className="px-0 font-semibold text-cengkeh-brown"
                >
                  <CollapsibleTrigger className="flex w-full items-center px-2 py-1 text-cengkeh-brown hover:bg-cengkeh-brown! hover:text-cengkeh-beige text-opacity active:bg-cengkeh-brown active:text-cengkeh-beige">
                    <Package className="size-4! mr-2" />
                    Produk
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </CollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent>
                  <SidebarGroupContent className="pr-12">
                    <SidebarMenu className="ml-5 border-l border-cengkeh-brown/40 pl-2">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/dashboard/products">Semua Produk</Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <Link href="/dashboard/products/add">
                            Tambahkan Produk
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            {/* <SidebarGroup className="px-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold">
                    <Link href="/dashboard/order-list">
                      <ClipboardList className="size-4!" />
                      Daftar Pesanan
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold">
                    <Link href="/dashboard/mountly-reports">
                      <TrendingUp className="size-4!" />
                      Laporan Bulanan
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup> */}
          </SidebarContent>
        </>
      ) : session?.user.role === "pembeli" ? (
        <>
          {/* sidebar pembeli */}
          <SidebarContent>
            <SidebarGroup className="px-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold text-md">
                    <Link href="/dashboard">
                      <LayoutDashboard className="size-6!" />
                      Dashboard
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="px-2 gap-5">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold text-md">
                    <Link href="/dashboard/order-list">
                      <Package className="size-6!" /> Lihat Produk
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>

              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold text-md">
                    <Link href="/dashboard/order-list">
                      {" "}
                      <ClipboardList className="size-6!" />
                      Daftar Pesanan
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>

              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold size-md">
                    <Link href="/dashboard/mountly-reports">
                      <TrendingUp className="size-6!" />
                      Laporan Bulanan
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>

              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold size-md">
                    <Link href="/dashboard/mountly-reports">
                      <Store className="size-6!" />
                      Profile Toko
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </>
      ) : null}{" "}
      {/* footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton>
              <User2 /> Username
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
