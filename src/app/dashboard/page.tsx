import { auth } from "@/auth";
import DashboardPenjual from "@/components/pages/DashboardPenjual";
import { getDashboardStats } from "@/db/data/dashboard/dashboard.actions";
import { redirect } from "next/navigation";

// Revalidasi halaman setiap 60 detik — cegah request berulang ke Supabase
export const revalidate = 60;

const Page = async () => {
  const session = await auth();

  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (userRole === "penjual") {
    if (!userId) {
      redirect("/login");
    }

    // getDashboardStats sekaligus cek seller profile (return null jika belum ada)
    const stats = await getDashboardStats(userId);

    if (!stats) {
      redirect("/seller-onboarding");
    }

    return <DashboardPenjual session={session} stats={stats} />;
  }

  if (userRole === "pembeli") {
    return <div>halaman pembeli</div>;
  }

  redirect("/login");
};

export default Page;
