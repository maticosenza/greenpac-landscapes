import { useState, useEffect } from "react";
import { Menu, X, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/greenpac-logo-new.png";
import textLogo from "@/assets/greenpac-text.png";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  const isHomePage = location.pathname === "/";

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navLinks = [
    { href: "/#inicio", label: "Inicio" },
    { href: "/#productos", label: "Productos" },
    { href: "/#nosotros", label: "Nosotros" },
    { href: "/#contacto", label: "Contacto" },
  ];

  // On non-home pages, always show dark background
  // On desktop, always show dark background
  const showDarkBg = !isHomePage || isScrolled;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          showDarkBg
            ? "bg-[rgba(0,0,0,0.9)] backdrop-blur-md shadow-lg py-3"
            : "lg:bg-[rgba(0,0,0,0.85)] lg:backdrop-blur-md bg-transparent py-5 lg:py-3"
        }`}
      >
        <div className="greenpac-container flex items-center justify-between">
          <a href="/#inicio" className="flex items-center gap-1 group">
            <img
              src={logo}
              alt="Greenpac Logo"
              className="h-11 md:h-14 w-auto transition-transform duration-300 group-hover:scale-105"
            />
            <img
              src={textLogo}
              alt="Green Pac"
              className="h-24 md:h-28 w-auto -ml-1"
            />
          </a>

          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-primary-foreground/90 hover:text-primary font-medium transition-colors duration-300 relative group"
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center">
            <Button
              variant="hero"
              size="sm"
              onClick={() => navigate(user ? "/panel" : "/auth")}
            >
              <User className="h-4 w-4 mr-2" />
              {user ? "Mi Panel" : "Ingresar"}
            </Button>
          </div>

          <button
            className="lg:hidden text-primary-foreground p-2 relative z-[70]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Mobile Menu - Outside header for proper stacking */}
      <div
        className={`lg:hidden fixed inset-0 bg-[#1a2e1a] z-[60] transition-all duration-300 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        {/* Mobile Menu Header */}
        <div className="greenpac-container flex items-center justify-between py-4">
          <a href="/#inicio" className="flex items-center gap-1">
            <img
              src={logo}
              alt="Greenpac Logo"
              className="h-11 w-auto"
            />
            <img
              src={textLogo}
              alt="Green Pac"
              className="h-24 w-auto -ml-1"
            />
          </a>
          <button
            className="text-primary-foreground p-2"
            onClick={() => setIsMobileMenuOpen(false)}
            aria-label="Close menu"
          >
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="greenpac-container py-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-primary-foreground/90 hover:text-primary font-medium py-2 transition-colors"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              {link.label}
            </a>
          ))}
          <Button
            variant="hero"
            size="sm"
            className="mt-2"
            onClick={() => {
              setIsMobileMenuOpen(false);
              navigate(user ? "/panel" : "/auth");
            }}
          >
            <User className="h-4 w-4 mr-2" />
            {user ? "Mi Panel" : "Ingresar"}
          </Button>
        </nav>
      </div>
    </>
  );
};

export default Header;
