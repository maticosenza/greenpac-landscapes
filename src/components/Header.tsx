import { useState, useEffect } from "react";
import { Menu, X, User, Pencil, PencilOff } from "lucide-react";
import { useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useEditMode } from "@/hooks/useEditMode";
import { useSiteContent } from "@/hooks/useSiteContent";
import EditableSection from "@/components/EditableSection";
import defaultIcon from "@/assets/greenpac-logo-new.png";
import defaultTextLogo from "@/assets/greenpac-text.png";

const Header = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const { isEditMode, toggleEditMode, canEdit } = useEditMode();
  const { getAsset } = useSiteContent();

  const isHomePage = location.pathname === "/";

  const navIcon = getAsset("nav-icon", defaultIcon, "Greenpac Isotipo");
  const navText = getAsset("nav-text-logo", defaultTextLogo, "Greenpac");

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 20);
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

  const LogoBlock = ({ iconClass, textClass }: { iconClass: string; textClass: string }) => (
    <a href="/#inicio" className="flex items-center gap-1 group">
      <img src={navIcon.url} alt={navIcon.alt} className={`${iconClass} w-auto object-contain transition-transform duration-300 group-hover:scale-105`} />
      <img src={navText.url} alt={navText.alt} className={`${textClass} w-auto`} />
    </a>
  );

  return (
    <>
      <header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          showDarkBg
            ? "bg-[rgba(0,0,0,0.65)] backdrop-blur-[10px] shadow-lg py-1 lg:py-0.5"
            : "bg-transparent py-3 lg:py-0.5"
        }`}
      >
        <div className="greenpac-container flex items-center justify-between">
          <EditableSection
            sectionId="Nav Logo"
            fields={[
              {
                key: "nav-icon",
                label: "Isotipo (icono verde)",
                type: "image",
                fallback: defaultIcon,
                assetKey: "nav-icon",
                hint: "Recomendado: 120×120 px (PNG/SVG transparente). Solo el icono verde.",
              },
              {
                key: "nav-text-logo",
                label: "Logotipo (texto GREENPAC)",
                type: "image",
                fallback: defaultTextLogo,
                assetKey: "nav-text-logo",
                hint: "Recomendado: 300×72 px (PNG/SVG transparente). Solo el texto.",
              },
            ]}
          >
            <LogoBlock iconClass="h-12 md:h-14 lg:h-16 scale-y-105" textClass="h-24 md:h-[6.5rem] lg:h-[7.5rem] -ml-1" />
          </EditableSection>

          <nav className="hidden lg:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
            {navLinks.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-white/90 hover:text-primary font-medium transition-colors duration-300 relative group"
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
                className={!isEditMode ? "bg-white/90 text-foreground hover:bg-white hover:text-[#111] border-white/50" : ""}
              >
                {isEditMode ? (
                  <><PencilOff className="h-4 w-4 mr-1.5" />Salir edición</>
                ) : (
                  <><Pencil className="h-4 w-4 mr-1.5" />Modo edición</>
                )}
              </Button>
            )}
            <Button variant="hero" size="sm" onClick={() => navigate(user ? "/panel" : "/auth")}>
              <User className="h-4 w-4 mr-2" />
              {user ? "Mi Panel" : "Ingresar"}
            </Button>
          </div>

          <button
            className="lg:hidden text-white p-2 relative z-[70]"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Toggle menu"
          >
            {isMobileMenuOpen ? <X className="h-7 w-7" /> : <Menu className="h-7 w-7" />}
          </button>
        </div>
      </header>

      {isEditMode && (
        <div className="fixed top-0 left-0 right-0 z-[60] bg-primary text-primary-foreground text-center text-xs py-1 font-medium flex items-center justify-center gap-3">
          <span className="pointer-events-none">✏️ Modo edición activo — hacé hover sobre las secciones para editarlas</span>
          <Button
            variant="secondary"
            size="sm"
            className="h-6 text-xs px-3 pointer-events-auto"
            onClick={toggleEditMode}
          >
            Confirmar cambios
          </Button>
        </div>
      )}

      {/* Mobile Menu */}
      <div
        className={`lg:hidden fixed inset-0 bg-[#1a2e1a] z-[60] transition-all duration-300 ${
          isMobileMenuOpen ? "opacity-100 visible" : "opacity-0 invisible pointer-events-none"
        }`}
      >
        <div className="greenpac-container flex items-center justify-between py-4">
          <LogoBlock iconClass="h-8" textClass="h-16 -ml-1" />
          <button className="text-primary-foreground p-2" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
            <X className="h-6 w-6" />
          </button>
        </div>
        <nav className="greenpac-container py-6 flex flex-col gap-4">
          {navLinks.map((link) => (
            <a key={link.href} href={link.href} className="text-primary-foreground/90 hover:text-primary font-medium py-2 transition-colors" onClick={() => setIsMobileMenuOpen(false)}>
              {link.label}
            </a>
          ))}
          {canEdit && (
            <Button
              variant={isEditMode ? "destructive" : "outline"}
              size="sm"
              className={!isEditMode ? "bg-white/90 text-foreground hover:bg-white hover:text-[#111]" : ""}
              onClick={() => { toggleEditMode(); setIsMobileMenuOpen(false); }}
            >
              {isEditMode ? <><PencilOff className="h-4 w-4 mr-1.5" />Salir edición</> : <><Pencil className="h-4 w-4 mr-1.5" />Modo edición</>}
            </Button>
          )}
          <Button variant="hero" size="sm" className="mt-2" onClick={() => { setIsMobileMenuOpen(false); navigate(user ? "/panel" : "/auth"); }}>
            <User className="h-4 w-4 mr-2" />
            {user ? "Mi Panel" : "Ingresar"}
          </Button>
        </nav>
      </div>
    </>
  );
};

export default Header;
