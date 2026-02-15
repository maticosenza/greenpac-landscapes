import { useSiteContent } from "@/hooks/useSiteContent";
import EditableSection from "@/components/EditableSection";
import defaultFooterLogo from "@/assets/greenpac-logo-new.png";
import textLogo from "@/assets/greenpac-text.png";

const DEFAULT_FOOTER_LOGO = defaultFooterLogo;

const Footer = () => {
  const currentYear = new Date().getFullYear();
  const { getText, getAsset } = useSiteContent();

  const tagline = getText("footer-tagline", "Maquinaria para la conservación de forrajes");
  const footerLogo = getAsset("footer-logo", DEFAULT_FOOTER_LOGO, "Greenpac Logo");
  const hasCustomFooterLogo = footerLogo.url !== DEFAULT_FOOTER_LOGO;

  return (
    <footer className="bg-greenpac-dark">
      <div className="greenpac-container py-12">
        <EditableSection
          sectionId="Footer"
          fields={[
            { key: "footer-tagline", label: "Tagline", type: "text", fallback: "Maquinaria para la conservación de forrajes" },
            {
              key: "footer-logo",
              label: "Logo",
              type: "image",
              fallback: DEFAULT_FOOTER_LOGO,
              assetKey: "footer-logo",
              hint: "Recomendado: 320×80 px (PNG/SVG, fondo transparente). Si subís un logo completo (isotipo + texto), se oculta el texto por defecto.",
            },
          ]}
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-1">
              <img src={footerLogo.url} alt={footerLogo.alt} className={`${hasCustomFooterLogo ? "h-14 md:h-16" : "h-11 md:h-14"} w-auto`} />
              {!hasCustomFooterLogo && (
                <img src={textLogo} alt="Green Pac" className="h-32 w-auto -ml-1" />
              )}
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
    </footer>
  );
};

export default Footer;
