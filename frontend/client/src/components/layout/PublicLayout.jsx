import { Outlet } from "react-router-dom";
import Navbar from "./Navbar";
import Footer from "./Footer";
import MiniCart from "./MiniCart";
import AboutLyZov from "./About";

const PublicLayout = () => {
  return (
    <div className="page-shell flex min-h-screen flex-col">
      <Navbar />
      <MiniCart />
      <main className="flex-1 min-w-0">
        <Outlet />
      </main>
      <AboutLyZov />
      <Footer />
    </div>
  );
};

export default PublicLayout;
