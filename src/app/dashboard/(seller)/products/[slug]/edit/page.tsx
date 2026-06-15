import { getProductBySlug } from "@/db/data/products/product.actions";
import { EditProductForm } from "@/components/form/EditProductForm";
import { notFound, redirect } from "next/navigation";
import { auth } from "@/auth";
import { checkHasSellerProfile } from "@/db/data/seller-profiles/seller-profiles.action";

type Params = Promise<{ slug: string }>;

const Page = async ({ params }: { params: Params }) => {
  const session = await auth();

  if (!session?.user?.id) {
    redirect("/login");
  }

  const hasProfile = await checkHasSellerProfile(session.user.id);
  if (!hasProfile) {
    redirect("/seller-onboarding");
  }

  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  return (
    <div className="flex min-h-svh items-start justify-center px-4 py-8 md:px-10">
      <EditProductForm
        product={{
          slug: product.slug,
          title: product.title,
          description: product.description ?? "",
          price: product.price,
          weight_unit: product.weight_unit ?? "kg",
          stock: product.stock,
          wholesale_price: product.wholesale_price ?? null,
          wholesale_qty: product.wholesale_qty ?? null,
          image_url: product.image_url ?? [],
        }}
      />
    </div>
  );
};

export default Page;
