import Layout from "@/components/layout/Layout";
import HeroSection from "@/components/home/HeroSection";
import FeaturesSection from "@/components/home/FeaturesSection";
import CategoriesSection from "@/components/home/CategoriesSection";

const Index = () => {
  return (
    <Layout>
      <HeroSection />
      <FeaturesSection />
      <CategoriesSection />
    </Layout>
  );
};

export default Index;
