import { auth } from "@/auth";
import DashboardPenjual from "@/components/pages/DashboardPenjual";
import DashboardPembeli from "@/components/pages/DashboardPembeli";
import {
  getDashboardStats,
  getSellerProfileForDashboard,
  getBuyerDashboardData,
} from "@/db/data/dashboard/dashboard.actions";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();

  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (userRole === "penjual") {
    if (!userId) {
      redirect("/login");
    }

    // Cek profil TANPA cache — selalu ambil dari DB
    const profile = await getSellerProfileForDashboard(userId);

    if (!profile) {
      redirect("/seller-onboarding");
    }

    // Statistik pakai cache (aman karena hanya fetch angka produk)
    const stats = await getDashboardStats(profile.id);
    stats.businessName = profile.businessName;

    return <DashboardPenjual session={session} stats={stats} />;
  }

  if (userRole === "pembeli") {
    if (!userId) {
      redirect("/login");
    }

    const data = await getBuyerDashboardData(userId);

    return <DashboardPembeli session={session} data={data} />;
  }

  redirect("/login");
};

export default Page;
