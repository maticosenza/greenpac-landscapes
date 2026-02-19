import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import Clients from "@/components/Clients";
import About from "@/components/About";
import Contact from "@/components/Contact";
import QuotationForm from "@/components/QuotationForm";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useHashScroll } from "@/hooks/useHashScroll";
import { useSiteContent } from "@/hooks/useSiteContent";
import EditableSection from "@/components/EditableSection";

const Index = () => {
  useHashScroll();
  const { getText } = useSiteContent();

  const quoteKicker = getText("quote-kicker", "Cotización");
  const quoteTitle = getText("quote-title", "¿Interesado en Nuestros Productos?");
  const quoteSubtitle = getText("quote-subtitle", "Completá el formulario y recibí una cotización personalizada. Podés solicitar información, hacer una compra directa o reservar con una seña.");
  const quoteBullet1 = getText("quote-bullet-1", "Respuesta en menos de 24 horas");
  const quoteBullet2 = getText("quote-bullet-2", "Financiación disponible");
  const quoteBullet3 = getText("quote-bullet-3", "Envío a todo el país");

  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <About />
        <Products />
        <section id="cotizacion" className="greenpac-section bg-muted">
          <div className="greenpac-container">
            <div className="grid lg:grid-cols-2 gap-12 items-start">
              <EditableSection
                sectionId="Cotización Textos"
                fields={[
                  { key: "quote-kicker", label: "Kicker", type: "text", fallback: "Cotización" },
                  { key: "quote-title", label: "Título", type: "text", fallback: "¿Interesado en Nuestros Productos?" },
                  { key: "quote-subtitle", label: "Subtítulo", type: "textarea", fallback: quoteSubtitle },
                  { key: "quote-bullet-1", label: "Bullet 1", type: "text", fallback: "Respuesta en menos de 24 horas" },
                  { key: "quote-bullet-2", label: "Bullet 2", type: "text", fallback: "Financiación disponible" },
                  { key: "quote-bullet-3", label: "Bullet 3", type: "text", fallback: "Envío a todo el país" },
                ]}
              >
                <div>
                  <p className="text-primary font-display font-semibold mb-3 tracking-widest uppercase">
                    {quoteKicker}
                  </p>
                  <h2 className="greenpac-title text-foreground mb-4">
                    {quoteTitle}
                  </h2>
                  <p className="text-muted-foreground text-lg mb-6">
                    {quoteSubtitle}
                  </p>
                  <ul className="space-y-3 text-muted-foreground">
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      {quoteBullet1}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      {quoteBullet2}
                    </li>
                    <li className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-primary rounded-full"></span>
                      {quoteBullet3}
                    </li>
                  </ul>
                </div>
              </EditableSection>
              <QuotationForm />
            </div>
          </div>
        </section>
        <Clients />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
