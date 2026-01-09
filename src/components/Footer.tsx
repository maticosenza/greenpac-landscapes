import logo from "@/assets/greenpac-logo.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-greenpac-dark border-t border-primary-foreground/10">
      <div className="greenpac-container py-12">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-3">
            <img src={logo} alt="Greenpac Logo" className="h-10 w-auto" />
            <span className="font-display text-lg font-bold text-primary-foreground">
              GREEN PAC
            </span>
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
