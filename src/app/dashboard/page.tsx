import { auth } from "@/auth";
import HalamanPenjual from "@/components/pages/HalamanPenjual";

const page = async () => {
  const session = await auth();

  if (session?.user?.role == "pembeli") return <div>halaman pembeli</div>;
  if (session?.user?.role == "penjual") return <HalamanPenjual />;
};

export default page;
