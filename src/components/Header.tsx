import { useState, useEffect } from "react";
import { Menu, X, User, Pencil, PencilOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEditMode } from "@/hooks/useEditMode";
import { useSiteContent } from "@/hooks/useSiteContent";
import EditableSection from "@/components/EditableSection";
import defaultLogo from "@/assets/greenpac-logo-new.png";
import textLogo from "@/assets/greenpac-text.png";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isEditMode, toggleEditMode, canEdit } = useEditMode();
  const { getAsset } = useSiteContent();

  const isHomePage = location.pathname === "/";

  // Single source of truth for nav logo
  const navLogo = getAsset("nav-logo", defaultLogo, "Greenpac Logo");
  const hasCustomLogo = navLogo.url !== defaultLogo;

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

  const showDarkBg = !isHomePage || isScrolled;

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          showDarkBg
            ? "bg-[rgba(0,0,0,0.65)] backdrop-blur-md shadow-lg py-2 lg:py-1.5"
            : "bg-white/[0.55] backdrop-blur-[10px] border-b border-white/[0.35] py-5 lg:py-1.5"
        }`}
      >
        <div className="greenpac-container flex items-center justify-between">
          <EditableSection
            sectionId="Nav Logo"
            fields={[
              {
                key: "nav-logo",
                label: "Logo (isotipo)",
                type: "image",
                fallback: defaultLogo,
                assetKey: "nav-logo",
                hint: "Recomendado: 320×72 px (PNG/SVG transparente). Se muestra aprox.: Desktop 40px alto, Tablet 28px, Mobile 24px.",
              },
            ]}
          >
            <a href="/#inicio" className="flex items-center gap-1 group">
              <img
                src={navLogo.url}
                alt={navLogo.alt}
                className={`${hasCustomLogo ? "h-6 md:h-7 lg:h-10 max-h-10" : "h-11 lg:h-10"} w-auto object-contain transition-transform duration-300 group-hover:scale-105`}
              />
              {!hasCustomLogo && (
                <img
                  src={textLogo}
                  alt="Green Pac"
                  className="h-24 lg:h-20 w-auto -ml-1"
                />
              )}
            </a>
          </EditableSection>

          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`${showDarkBg ? "text-white/90" : "text-gray-900/80"} hover:text-primary font-medium transition-colors duration-300 relative group`}
              >
                {link.label}
                <span className="absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full" />
              </a>
            ))}
          </nav>

          <div className="hidden lg:flex items-center gap-2">
            {canEdit && (
              <Button
                variant={isEditMode ? "destructive" : "outline"}
                size="sm"
                onClick={toggleEditMode}
                className={!isEditMode ? (showDarkBg ? "bg-white/90 text-foreground hover:bg-white hover:text-[#111] border-white/50" : "bg-black/10 text-gray-900 hover:bg-white hover:text-[#111] border-gray-900/30") : ""}
              >
                {isEditMode ? (
                  <>
                    <PencilOff className="h-4 w-4 mr-1.5" />
                    Salir edición
                  </>
                ) : (
                  <>
                    <Pencil className="h-4 w-4 mr-1.5" />
                    Modo edición
                  </>
                )}
              </Button>
            )}
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
            className={`lg:hidden ${showDarkBg ? "text-white" : "text-gray-900"} p-2 relative z-[70]`}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </header>

      {/* Edit mode indicator banner */}
      {isEditMode && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground text-center text-xs py-1 font-medium pointer-events-none">
          ✏️ Modo edición activo — hacé hover sobre las secciones para editarlas
        </div>
      )}

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 bg-[#1a2e1a] z-[60] transition-all duration-300 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div className="greenpac-container flex items-center justify-between py-4">
          <a href="/#inicio" className="flex items-center gap-1">
            <img src={navLogo.url} alt={navLogo.alt} className={`${hasCustomLogo ? "h-6 max-h-6" : "h-11"} w-auto object-contain`} />
            {!hasCustomLogo && (
              <img src={textLogo} alt="Green Pac" className="h-24 w-auto -ml-1" />
            )}
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
          {canEdit && (
            <Button
              variant={isEditMode ? "destructive" : "outline"}
              size="sm"
              className={!isEditMode ? "bg-white/90 text-foreground hover:bg-white hover:text-[#111]" : ""}
              onClick={() => {
                toggleEditMode();
                setIsMobileMenuOpen(false);
              }}
            >
              {isEditMode ? (
                <>
                  <PencilOff className="h-4 w-4 mr-1.5" />
                  Salir edición
                </>
              ) : (
                <>
                  <Pencil className="h-4 w-4 mr-1.5" />
                  Modo edición
                </>
              )}
            </Button>
          )}
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
