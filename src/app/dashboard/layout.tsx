import { DashboardSidebar } from "@/components/DashboardSidebar";
import Navbar from "@/components/Navbar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";

export default function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <div className="font-inter min-h-svh">
      <SidebarProvider>
        <DashboardSidebar />
        <main className="w-full min-h-svh min-w-0 overflow-y-auto">
          <SidebarTrigger />
          <div className="min-w-0">{children}</div>
        </main>
      </SidebarProvider>
    </div>
  );
}
