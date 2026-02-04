import Header from "@/components/Header";
import Hero from "@/components/Hero";
import Products from "@/components/Products";
import Testimonials from "@/components/Testimonials";
import About from "@/components/About";
import Contact from "@/components/Contact";
import QuotationForm from "@/components/QuotationForm";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { useHashScroll } from "@/hooks/useHashScroll";

const Index = () => {
  useHashScroll();
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
              <div>
                <p className="text-primary font-display font-semibold mb-3 tracking-widest uppercase">
                  Cotización
                </p>
                <h2 className="greenpac-title text-foreground mb-4">
                  ¿Interesado en Nuestros Productos?
                </h2>
                <p className="text-muted-foreground text-lg mb-6">
                  Completá el formulario y recibí una cotización personalizada.
                  Podés solicitar información, hacer una compra directa o reservar
                  con una seña.
                </p>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Respuesta en menos de 24 horas
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Financiación disponible
                  </li>
                  <li className="flex items-center gap-2">
                    <span className="w-2 h-2 bg-primary rounded-full"></span>
                    Envío a todo el país
                  </li>
                </ul>
              </div>
              <QuotationForm />
            </div>
          </div>
        </section>
        <Testimonials />
        <Contact />
      </main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default Index;
