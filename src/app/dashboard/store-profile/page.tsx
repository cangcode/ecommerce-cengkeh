import { auth } from "@/auth";
import { getSellerProfile } from "@/db/data/seller-profiles/seller-profiles.action";
import { redirect } from "next/navigation";
import { SellerProfileForm } from "@/components/form/SellerProfileForm";

const Page = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const profile = await getSellerProfile(session.user.id);

  if (!profile) {
    redirect("/seller-onboarding");
  }

  return (
    <div className="flex min-h-svh items-start justify-center px-4 py-8 md:px-10">
      <SellerProfileForm
        profile={{
          business_name: profile.business_name,
          business_address: profile.business_address,
          description: profile.description ?? "",
          district_id: profile.district_id,
          village_id: profile.village_id,
        }}
      />
    </div>
  );
};

export default Page;
