import { auth } from "@/auth";
import { AddressForm } from "@/components/form/AddressForm";
import { redirect } from "next/navigation";

const Page = async () => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  if (session.user.role !== "pembeli") {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-svh items-start justify-center px-4 py-8 md:px-10">
      <AddressForm />
    </div>
  );
};

export default Page;
