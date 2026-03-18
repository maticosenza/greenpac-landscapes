import { useSiteContent } from "@/hooks/useSiteContent";
import EditableSection from "@/components/EditableSection";
import defaultIcon from "@/assets/greenpac-logo-new.png";
import defaultTextLogo from "@/assets/greenpac-text.png";

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { getText, getAsset } = useSiteContent();

  const tagline = getText("footer-tagline", "Maquinaria para la conservación de forrajes");
  const footerIcon = getAsset("nav-icon", defaultIcon, "Greenpac Isotipo");
  const footerText = getAsset("nav-text-logo", defaultTextLogo, "Greenpac");

  return (
    <footer className="bg-greenpac-dark">
      <div className="greenpac-container py-12">
        <EditableSection
          sectionId="Footer"
          fields={[
            { key: "footer-tagline", label: "Tagline", type: "text", fallback: "Maquinaria para la conservación de forrajes" },
          ]}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-1">
              <img src={footerIcon.url} alt={footerIcon.alt} className="h-11 md:h-14 w-auto" />
              <img src={footerText.url} alt={footerText.alt} className="h-32 w-auto -ml-1" />
            </div>

            <p className="text-primary-foreground/60 text-sm text-center">
              {tagline}
            </p>

            <p className="text-primary-foreground/40 text-sm">
              © {currentYear} Greenpac Argentina. Todos los derechos reservados.
            </p>
          </div>
        </EditableSection>
      </div>
      <div className="border-t border-primary-foreground/10 py-3">
        <p className="text-primary-foreground text-xs text-center">
          Diseñado por{" "}
          <a href="https://www.velocentum.com" target="_blank" rel="noopener noreferrer" className="underline hover:text-primary-foreground/80 transition-colors">
            Velocentum
          </a>
        </p>
      </div>
    </footer>
  );
};

export default Footer;
