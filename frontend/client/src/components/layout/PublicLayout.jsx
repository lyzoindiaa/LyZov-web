import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MiniCart from "./MiniCart";
import CollectionHero from "./CollectionHero";
import AboutLyZov from "./About";
import { hasSeenCollectionHero, markCollectionHeroSeen } from "../../utils/collectionHero";

const isCatalogPath = (pathname) => pathname === "/shop" || pathname.startsWith("/product/");

const PublicLayout = () => {
  const location = useLocation();
  const searchDraft = useSelector((state) => state.ui.searchDraft);
  const [heroSeen, setHeroSeen] = useState(() => hasSeenCollectionHero());

  useEffect(() => {
    if (!isCatalogPath(location.pathname)) return;
    markCollectionHeroSeen();
    setHeroSeen(true);
  }, [location.pathname]);

  const showCollectionHero = location.pathname === "/" && !heroSeen && !searchDraft;

  return (
    <div className="page-shell flex min-h-screen flex-col">
      <Navbar />
      <MiniCart />
      {showCollectionHero && <CollectionHero />}
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
      <AboutLyZov />
      <Footer />
    </div>
  );
};

export default PublicLayout;
