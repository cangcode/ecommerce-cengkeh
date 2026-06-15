import { auth } from "@/auth";
import { checkHasSellerProfile } from "@/db/data/seller-profiles/seller-profiles.action";
import { SellerOnboardingForm } from "@/components/form/SellerOnBoardingForm";
import { redirect } from "next/navigation";

const page = async () => {
  const session = await auth();

  // Jika belum login, arahkan ke login
  if (!session?.user?.id) {
    redirect("/login");
  }

  // Jika user sudah punya seller profile, arahkan ke dashboard
  const profile = await checkHasSellerProfile(session.user.id);
  if (profile) {
    redirect("/dashboard");
  }

  return (
    <div className="font-inter flex justify-center items-center w-full px-20">
      <SellerOnboardingForm />
    </div>
  );
};

export default page;
