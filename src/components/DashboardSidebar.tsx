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
  ArrowLeft,
  ChevronRight,
  ClipboardList,
  LayoutDashboard,
  MapPinned,
  Package,
  Package2,
  ShoppingBasket,
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
import { SidebarMenuLink } from "./SidebarMenuLink";
import { ActiveCollapsibleTrigger } from "./ActiveCollapsibleTrigger";

export async function DashboardSidebar() {
  const session = await auth();
  return (
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
                    <SidebarMenuLink href="/dashboard">
                      <LayoutDashboard className="size-4!" />
                      Dashboard
                    </SidebarMenuLink>
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
                  <ActiveCollapsibleTrigger
                    activePrefix="/dashboard/products"
                    className="flex w-full items-center px-2 py-1 text-cengkeh-brown! hover:bg-cengkeh-brown! hover:text-cengkeh-beige! text-opacity active:bg-cengkeh-brown active:text-cengkeh-beige"
                  >
                    <Package className="size-4! mr-2" />
                    Produk
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </ActiveCollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent className="py-2">
                  <SidebarGroupContent className="pr-12">
                    <SidebarMenu className="ml-5 border-l border-cengkeh-brown/40 pl-2">
                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <SidebarMenuLink href="/dashboard/products">
                            Semua Produk
                          </SidebarMenuLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton asChild>
                          <SidebarMenuLink href="/dashboard/products/add">
                            Tambahkan Produk
                          </SidebarMenuLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    </SidebarMenu>
                  </SidebarGroupContent>
                </CollapsibleContent>
              </SidebarGroup>
            </Collapsible>

            <SidebarGroup className="px-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold">
                    <SidebarMenuLink href="/dashboard/store-profile">
                      <Store className="size-4!" />
                      Profil Toko
                    </SidebarMenuLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            {/* <SidebarGroup className="px-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold">
                    <SidebarMenuLink href="/dashboard/order-list">
                      <ClipboardList className="size-4!" />
                      Daftar Pesanan
                    </SidebarMenuLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold">
                    <SidebarMenuLink href="/dashboard/mountly-reports">
                      <TrendingUp className="size-4!" />
                      Laporan Bulanan
                    </SidebarMenuLink>
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
            <SidebarGroup className="px-2 gap-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold">
                    <SidebarMenuLink href="/dashboard">
                      <LayoutDashboard className="size-4!" />
                      Dashboard
                    </SidebarMenuLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <Collapsible defaultOpen className="group/collapsible">
                <SidebarGroup className="p-0">
                  <SidebarGroupLabel
                    asChild
                    className="px-0 font-semibold text-cengkeh-brown"
                  >
                    <ActiveCollapsibleTrigger
                      activePrefix="/dashboard/addresses"
                      className="flex w-full items-center px-2 py-1 text-cengkeh-brown! hover:bg-cengkeh-brown! hover:text-cengkeh-beige! text-opacity active:bg-cengkeh-brown active:text-cengkeh-beige"
                    >
                      <MapPinned className="size-4! mr-2" />
                      Alamat Saya
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </ActiveCollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent className="py-2">
                    <SidebarGroupContent className="pr-12">
                      <SidebarMenu className="ml-5 border-l border-cengkeh-brown/40 pl-2">
                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <SidebarMenuLink href="/dashboard/addresses">
                              Semua Alamat
                            </SidebarMenuLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                          <SidebarMenuButton asChild>
                            <SidebarMenuLink href="/dashboard/addresses/add">
                              Tambah Alamat
                            </SidebarMenuLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>
                      </SidebarMenu>
                    </SidebarGroupContent>
                  </CollapsibleContent>
                </SidebarGroup>
              </Collapsible>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold">
                    <SidebarMenuLink href="/dashboard/chart">
                      <ShoppingBasket className="size-4!" />
                      Keranjang
                    </SidebarMenuLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton asChild className="font-semibold">
                    <SidebarMenuLink href="/dashboard/order-list">
                      <Package2 className="size-4!" />
                      Pesanan
                    </SidebarMenuLink>
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
              <User2 /> {session?.user.name}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
