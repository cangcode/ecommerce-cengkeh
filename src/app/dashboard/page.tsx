import { auth } from "@/auth";
import HalamanPembeli from "@/components/pages/HalamanPembeli";

const page = async () => {
  const session = await auth();

  if (session?.user?.role == "pembeli") return <HalamanPembeli />;
  if (session?.user?.role == "penjual") return <HalamanPembeli />;
};

export default page;
