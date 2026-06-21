import Hero from "@/components/Hero";
import FeaturedProducts from "@/components/FeaturedProducts";
import HowItWorks from "@/components/HowItWorks";
import WhyUs from "@/components/WhyUs";
import Testimonials from "@/components/Testimonials";
import SellerCTA from "@/components/SellerCTA";

export default function Home() {
  return (
    <>
      <Hero />
      <FeaturedProducts />
      <HowItWorks />
      <WhyUs />
      <Testimonials />
      <SellerCTA />
    </>
  );
}
