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
  Ticket,
  User2,
  Sparkles,
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
  const isPenjual = session?.user?.role === "penjual";

  return (
    <Sidebar
      className={
        isPenjual
          ? "[&_[data-sidebar=sidebar]]:bg-gradient-to-b [&_[data-sidebar=sidebar]]:from-emerald-50 [&_[data-sidebar=sidebar]]:to-emerald-100/50"
          : "[&_[data-sidebar=sidebar]]:bg-gradient-to-b [&_[data-sidebar=sidebar]]:from-blue-50 [&_[data-sidebar=sidebar]]:to-blue-100/50"
      }
    >
      {/* header */}
      <SidebarHeader>
        <div className="flex items-center justify-between">
          <SidebarMenuLink
            href="/"
            className={`flex items-center gap-2 text-sm transition-colors ${
              isPenjual
                ? "text-emerald-700 hover:text-emerald-900"
                : "text-blue-700 hover:text-blue-900"
            }`}
          >
            <ArrowLeft className="size-4" />
            <span>Beranda</span>
          </SidebarMenuLink>
        </div>
        <div
          className={`rounded-md py-5 flex gap-3 items-center ${
            isPenjual ? "text-emerald-800" : "text-blue-800"
          }`}
        >
          {isPenjual ? (
            <div className="size-10 rounded-full bg-gradient-to-br from-emerald-600 to-emerald-800 flex items-center justify-center">
              <Store className="size-5 text-white" />
            </div>
          ) : (
            <div className="size-10 rounded-full bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center">
              <Sparkles className="size-5 text-white" />
            </div>
          )}
          <div className="flex flex-col font-bold">
            Dashboard
            {isPenjual ? (
              <span className="inline-flex items-center gap-1 text-xs font-semibold">
                <span className="size-1.5 rounded-full bg-emerald-500 inline-block" />
                <span className="capitalize text-emerald-700">
                  {session?.user.role}
                </span>
              </span>
            ) : (
              <span className="inline-flex items-center gap-1 text-xs font-semibold">
                <span className="size-1.5 rounded-full bg-blue-500 inline-block" />
                <span className="capitalize text-blue-600">
                  {session?.user.role}
                </span>
              </span>
            )}
          </div>
        </div>
      </SidebarHeader>
      {isPenjual ? (
        <>
          {/* sidebar penjual */}
          <SidebarContent>
            <SidebarGroup className="px-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="font-semibold hover:bg-emerald-700! hover:text-white!"
                  >
                    <SidebarMenuLink
                      href="/dashboard"
                      activeClassName="bg-emerald-700! text-white! hover:bg-emerald-700! hover:text-white!"
                    >
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
                  className="px-0 font-semibold text-emerald-800"
                >
                  <ActiveCollapsibleTrigger
                    activePrefix="/dashboard/products"
                    activeClassName="bg-emerald-700! text-white! hover:bg-emerald-700! hover:text-white!"
                    className="flex w-full items-center px-2 py-1 text-cengkeh-brown! hover:bg-emerald-700! hover:text-white! text-opacity active:bg-emerald-700 active:text-white"
                  >
                    <Package className="size-4! mr-2" />
                    Produk
                    <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                  </ActiveCollapsibleTrigger>
                </SidebarGroupLabel>
                <CollapsibleContent className="py-2">
                  <SidebarGroupContent className="pr-12">
                    <SidebarMenu className="ml-5 border-l border-emerald-300/60 pl-2">
                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="hover:bg-emerald-700! hover:text-white!"
                        >
                          <SidebarMenuLink
                            href="/dashboard/products"
                            activeClassName="bg-emerald-700! text-white! hover:bg-emerald-700! hover:text-white!"
                          >
                            Semua Produk
                          </SidebarMenuLink>
                        </SidebarMenuButton>
                      </SidebarMenuItem>

                      <SidebarMenuItem>
                        <SidebarMenuButton
                          asChild
                          className="hover:bg-emerald-700! hover:text-white!"
                        >
                          <SidebarMenuLink
                            href="/dashboard/products/add"
                            activeClassName="bg-emerald-700! text-white! hover:bg-emerald-700! hover:text-white!"
                          >
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
                  <SidebarMenuButton
                    asChild
                    className="font-semibold hover:bg-emerald-700! hover:text-white!"
                  >
                    <SidebarMenuLink
                      href="/dashboard/store-profile"
                      activeClassName="bg-emerald-700! text-white! hover:bg-emerald-700! hover:text-white!"
                    >
                      <Store className="size-4!" />
                      Profil Toko
                    </SidebarMenuLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="px-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="font-semibold hover:bg-emerald-700! hover:text-white!"
                  >
                    <SidebarMenuLink
                      href="/dashboard/orders"
                      activeClassName="bg-emerald-700! text-white! hover:bg-emerald-700! hover:text-white!"
                    >
                      <ClipboardList className="size-4!" />
                      Pesanan Masuk
                    </SidebarMenuLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>

            <SidebarGroup className="px-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="font-semibold hover:bg-emerald-700! hover:text-white!"
                  >
                    <SidebarMenuLink
                      href="/dashboard/vouchers"
                      activeClassName="bg-emerald-700! text-white! hover:bg-emerald-700! hover:text-white!"
                    >
                      <Ticket className="size-4!" />
                      Voucher
                    </SidebarMenuLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </>
      ) : session?.user.role === "pembeli" ? (
        <>
          {/* sidebar pembeli */}
          <SidebarContent>
            <SidebarGroup className="px-2 gap-2">
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="font-semibold hover:bg-blue-600! hover:text-white!"
                  >
                    <SidebarMenuLink
                      href="/dashboard"
                      activeClassName="bg-blue-600! text-white! hover:bg-blue-600! hover:text-white!"
                    >
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
                    className="px-0 font-semibold text-blue-700"
                  >
                    <ActiveCollapsibleTrigger
                      activePrefix="/dashboard/addresses"
                      activeClassName="bg-blue-600! text-white! hover:bg-blue-600! hover:text-white!"
                      className="flex w-full items-center px-2 py-1 text-blue-700! hover:bg-blue-600! hover:text-white! text-opacity active:bg-blue-600 active:text-white"
                    >
                      <MapPinned className="size-4! mr-2" />
                      Alamat Saya
                      <ChevronRight className="ml-auto transition-transform group-data-[state=open]/collapsible:rotate-90" />
                    </ActiveCollapsibleTrigger>
                  </SidebarGroupLabel>
                  <CollapsibleContent className="py-2">
                    <SidebarGroupContent className="pr-12">
                      <SidebarMenu className="ml-5 border-l border-blue-300/60 pl-2">
                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            className="hover:bg-blue-600! hover:text-white!"
                          >
                            <SidebarMenuLink
                              href="/dashboard/addresses"
                              activeClassName="bg-blue-600! text-white! hover:bg-blue-600! hover:text-white!"
                            >
                              Semua Alamat
                            </SidebarMenuLink>
                          </SidebarMenuButton>
                        </SidebarMenuItem>

                        <SidebarMenuItem>
                          <SidebarMenuButton
                            asChild
                            className="hover:bg-blue-600! hover:text-white!"
                          >
                            <SidebarMenuLink
                              href="/dashboard/addresses/add"
                              activeClassName="bg-blue-600! text-white! hover:bg-blue-600! hover:text-white!"
                            >
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
                  <SidebarMenuButton
                    asChild
                    className="font-semibold hover:bg-blue-600! hover:text-white!"
                  >
                    <SidebarMenuLink
                      href="/dashboard/chart"
                      activeClassName="bg-blue-600! text-white! hover:bg-blue-600! hover:text-white!"
                    >
                      <ShoppingBasket className="size-4!" />
                      Keranjang
                    </SidebarMenuLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    asChild
                    className="font-semibold hover:bg-blue-600! hover:text-white!"
                  >
                    <SidebarMenuLink
                      href="/dashboard/order-list"
                      activeClassName="bg-blue-600! text-white! hover:bg-blue-600! hover:text-white!"
                    >
                      <Package2 className="size-4!" />
                      Pesanan
                    </SidebarMenuLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroup>
          </SidebarContent>
        </>
      ) : null}
      {/* footer */}
      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={
                isPenjual
                  ? "hover:bg-emerald-700! hover:text-white!"
                  : "hover:bg-blue-600! hover:text-white!"
              }
            >
              <User2 /> {session?.user.name}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
