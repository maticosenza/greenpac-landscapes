import { useState, useEffect } from "react";
import { Menu, X, Mail, User } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import logo from "@/assets/greenpac-logo.png";

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
  const showDarkBg = !isHomePage || isScrolled;

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        showDarkBg
          ? "bg-greenpac-dark/95 backdrop-blur-md shadow-lg py-3"
          : "bg-transparent py-5"
      }`}
    >
      <div className="greenpac-container flex items-center justify-between">
        <a href="/#inicio" className="flex items-center gap-3 group">
          <img
            src={logo}
            alt="Greenpac Logo"
            className="h-12 md:h-14 w-auto transition-transform duration-300 group-hover:scale-105"
          />
          <span className="font-display text-xl md:text-2xl font-bold text-primary-foreground tracking-wider">
            GREEN PAC
          </span>
        </a>

        <nav className="hidden lg:flex items-center gap-8">
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

        <div className="hidden lg:flex items-center gap-4">
          <a
            href="mailto:info@greenpacargentina.com"
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary transition-colors"
          >
            <Mail className="h-4 w-4" />
            <span className="text-sm">info@greenpacargentina.com</span>
          </a>
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
          className="lg:hidden text-primary-foreground p-2"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          aria-label="Toggle menu"
        >
          {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {/* Mobile Menu */}
      <div
        className={`lg:hidden absolute top-full left-0 right-0 bg-greenpac-dark/98 backdrop-blur-md transition-all duration-300 overflow-hidden ${
          isMobileMenuOpen ? "max-h-96 border-t border-primary/20" : "max-h-0"
        }`}
      >
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
          <a
            href="mailto:info@greenpacargentina.com"
            className="flex items-center gap-2 text-primary-foreground/80 hover:text-primary transition-colors py-2"
          >
            <Mail className="h-4 w-4" />
            <span>info@greenpacargentina.com</span>
          </a>
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
    </header>
  );
};

export default Header;
