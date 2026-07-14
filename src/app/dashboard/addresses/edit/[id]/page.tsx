import { auth } from "@/auth";
import { AddressForm } from "@/components/form/AddressForm";
import { redirect } from "next/navigation";
import { getUserAddresses } from "@/db/data/addresses/addresses.actions";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "pembeli") {
    redirect("/dashboard");
  }

  const { id } = await params;
  const addresses = await getUserAddresses(session.user.id);
  const address = addresses.find((a) => a.id === Number(id));

  if (!address) {
    redirect("/dashboard/addresses");
  }

  return (
    <div className="flex min-h-svh items-start justify-center px-4 py-8 md:px-10">
      <AddressForm
        isEdit
        initialData={{
          id: address.id,
          recipient_name: address.recipient_name,
          phone: address.phone,
          district_id: address.district_id,
          village_id: address.village_id,
          address: address.address,
          is_default: address.is_default,
        }}
      />
    </div>
  );
};

export default Page;
