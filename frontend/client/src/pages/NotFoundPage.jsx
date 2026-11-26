import { Link } from "react-router-dom";
import Logo from "../components/ui/Logo";
import SEO from "../components/common/SEO";

const NotFoundPage = () => (
  <div className="container-page flex min-h-[70vh] flex-col items-center justify-center gap-4 text-center">
    <SEO title="Page Not Found | LyZov" noIndex={true} />
    <Logo size="lg" />
    <span className="font-display text-8xl italic text-gold">404</span>
    <h1 className="font-display text-2xl">Page not found</h1>
    <p className="text-sm text-stone max-w-md leading-relaxed">
      The page you&apos;re looking for doesn&apos;t exist or may have moved. Head back to LyZov to continue shopping.
    </p>
    <Link to="/" className="btn-primary mt-2">
      Back to LyZov
    </Link>
  </div>
);

export default NotFoundPage;
