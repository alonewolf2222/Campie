import Navbar from "@/components/Navbar";
import UniversityBar from "@/components/UniversityBar";
import HeroSection from "@/components/HeroSection";
import StoriesSection from "@/components/StoriesSection";
import ListingsSection from "@/components/ListingsSection";
import FoodSection from "@/components/FoodSection";
import EventsSection from "@/components/EventsSection";
import GoodsSection from "@/components/GoodsSection";
import Footer from "@/components/Footer";
import AuthModal from "@/components/AuthModal";
import PostListingModal from "@/components/PostListingModal";
import ProfileModal from "@/components/ProfileModal";
import ProfilePromptModal from "@/components/ProfilePromptModal";
import MyListingsModal from "@/components/MyListingsModal";

export default function Home() {
  return (
    <main className="min-h-screen">
      <Navbar />
      <UniversityBar />
      <HeroSection />
      <StoriesSection />
      <ListingsSection />
      <EventsSection />
      <FoodSection />
      <GoodsSection
        category="Anime & Collectibles"
        badge="Anime & Collectibles"
        icon="anime"
        accent="bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400"
        title="Anime & Collectibles"
        subtitle="Figures, posters, manga and merch exchanged for money — find or sell collector items on campus."
      />
      <Footer />
      <AuthModal />
      <PostListingModal />
      <ProfileModal />
      <ProfilePromptModal />
      <MyListingsModal />
    </main>
  );
}
