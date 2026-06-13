import { auth } from "@/auth";
import HalamanPenjual from "@/components/pages/HalamanPenjual";
import { checkHasSellerProfile } from "@/db/data/seller-profiles/seller-profiles.action";
import { redirect } from "next/navigation";

// 1. Nama komponen wajib Huruf Kapital (Page) agar dikenali sebagai React Component
const Page = async () => {
  const session = await auth();

  // 2. Amankan data user ke dalam variabel terpisah
  const userId = session?.user?.id;
  const userRole = session?.user?.role;

  if (userRole === "penjual") {
    // Pastikan userId benar-benar ada (tidak undefined) sebelum panggil database
    if (!userId) {
      redirect("/login");
    }

    const hasProfile = await checkHasSellerProfile(userId);

    // LOGIKA DIPERBAIKI: Jika BELUM (!) punya profil, arahkan ke onboarding
    if (!hasProfile) {
      redirect("/seller-onboarding");
    }

    // Jika sudah punya profil, tampilkan halaman utama penjual
    return <HalamanPenjual />;
  }

  // 4. JIKA USER ADALAH PEMBELI
  if (userRole === "pembeli") {
    return <div>halaman pembeli</div>;
  }

  // 5. Cadangan jika session kosong atau role tidak dikenali
  redirect("/login");
};

export default Page;
