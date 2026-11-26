import { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MiniCart from "./MiniCart";
import CollectionHero from "./CollectionHero";
import AboutLyZov from "./About";
import DevelopmentBanner from "./DevelopmentBanner";
import { OutletContentSkeleton } from "../skeletons/Skeletons";

const PublicLayout = () => {
  const { pathname } = useLocation();
  const showCollectionHero = pathname === "/";

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <DevelopmentBanner />
      <Navbar />
      <MiniCart />
      {showCollectionHero && <CollectionHero />}
      <main className="flex-1 min-w-0">
        <Suspense fallback={<OutletContentSkeleton variant="storefront" />}>
          <Outlet />
        </Suspense>
      </main>
      <AboutLyZov />
      <Footer />
    </div>
  );
};

export default PublicLayout;
