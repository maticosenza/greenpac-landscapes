import footerLogo from "@/assets/greenpac-footer-icon.png";
import textLogo from "@/assets/greenpac-text.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-greenpac-dark">
      <div className="greenpac-container py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={footerLogo} alt="Greenpac Logo" className="h-40 w-auto" />
            <img src={textLogo} alt="Green Pac" className="h-32 w-auto" />
          </div>

          <p className="text-primary-foreground/60 text-sm text-center">
            Maquinaria para la conservación de forrajes
          </p>

          <p className="text-primary-foreground/40 text-sm">
            © {currentYear} Greenpac Argentina. Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
