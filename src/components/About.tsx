import { CheckCircle, Users, Globe, Award } from "lucide-react";

const stats = [
  { icon: Users, value: "500+", label: "Clientes Satisfechos" },
  { icon: Globe, value: "10+", label: "Países Proveedores" },
  { icon: Award, value: "15+", label: "Años de Experiencia" },
];

const features = [
  "Importación directa de fábrica",
  "Servicio técnico especializado",
  "Repuestos originales garantizados",
  "Asesoramiento personalizado",
  "Financiación a medida",
  "Soporte post-venta continuo",
];

const About = () => {
  return (
    <section id="nosotros" className="greenpac-section bg-background">
      <div className="greenpac-container">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Content */}
          <div>
            <p className="text-primary font-display font-semibold mb-3 tracking-widest uppercase">
              Sobre Nosotros
            </p>
            <h2 className="greenpac-title text-foreground mb-6">
              Tu Socio en el{" "}
              <span className="greenpac-gradient-text">Agro</span>
            </h2>
            <p className="text-muted-foreground text-lg leading-relaxed mb-6">
              En <strong className="text-foreground">Greenpac</strong> nos especializamos en la importación 
              de maquinaria agrícola de alta calidad para la conservación de forrajes. 
              Trabajamos con los mejores fabricantes internacionales para traer al campo 
              argentino tecnología de vanguardia.
            </p>
            <p className="text-muted-foreground text-lg leading-relaxed mb-8">
              Nuestro compromiso es brindar soluciones integrales que optimicen 
              la productividad de tu establecimiento, con el respaldo técnico 
              y la confiabilidad que merecés.
            </p>

            <ul className="grid sm:grid-cols-2 gap-3 mb-10">
              {features.map((feature) => (
                <li key={feature} className="flex items-center gap-3">
                  <CheckCircle className="h-5 w-5 text-primary flex-shrink-0" />
                  <span className="text-foreground">{feature}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Stats */}
          <div className="grid gap-6">
            {stats.map((stat, index) => (
              <div
                key={stat.label}
                className="flex items-center gap-6 p-6 rounded-2xl bg-muted/50 border border-border/50 hover:border-primary/30 transition-colors duration-300"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex-shrink-0 w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                  <stat.icon className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <p className="font-display text-4xl font-bold text-foreground">
                    {stat.value}
                  </p>
                  <p className="text-muted-foreground font-medium">{stat.label}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default About;
