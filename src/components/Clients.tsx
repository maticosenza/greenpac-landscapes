import { Globe, Award, Factory, TrendingUp } from "lucide-react";

const stats = [
  { icon: Factory, value: "+20 años", label: "fabricando packaging sustentable" },
  { icon: Globe, value: "Todo el mundo", label: "distribución internacional" },
  { icon: Award, value: "Marcas líderes", label: "de primer nivel global" },
  { icon: TrendingUp, value: "+500 clientes", label: "en Argentina y el exterior" },
];

const industries = [
  "Alimentos & Bebidas",
  "Cosmética & Belleza",
  "Farmacéutica",
  "Electrónica",
  "Retail & Moda",
  "Agro & Exportación",
  "Química & Industrial",
  "Hogar & Decoración",
];

const Clients = () => {
  return (
    <section id="clientes" className="greenpac-section overflow-hidden relative" style={{ background: "hsl(var(--greenpac-dark))" }}>
      {/* Background texture */}
      <div
        className="absolute inset-0 opacity-5"
        style={{
          backgroundImage: `radial-gradient(circle at 25% 25%, hsl(var(--primary)) 0%, transparent 50%),
                            radial-gradient(circle at 75% 75%, hsl(var(--greenpac-gold)) 0%, transparent 50%)`,
        }}
      />

      <div className="greenpac-container relative z-10">
        {/* Header */}
        <div className="text-center mb-16">
          <p className="font-display font-semibold mb-3 tracking-widest uppercase text-sm" style={{ color: "hsl(var(--greenpac-gold))" }}>
            Nuestros Clientes
          </p>
          <h2 className="greenpac-title mb-6" style={{ color: "hsl(0 0% 98%)" }}>
            Fabricamos para las{" "}
            <span style={{ color: "hsl(var(--primary))" }}>
              grandes marcas del mundo
            </span>
          </h2>
          <p className="text-lg max-w-3xl mx-auto" style={{ color: "hsl(0 0% 75%)" }}>
            Somos fabricantes de packaging sustentable con presencia global. Nuestros productos llegan a las manos de consumidores en todo el mundo a través de las marcas de primer nivel que confían en Greenpac.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="text-center p-6 rounded-2xl border"
              style={{
                background: "hsl(var(--primary) / 0.08)",
                borderColor: "hsl(var(--primary) / 0.2)",
              }}
            >
              <div
                className="w-12 h-12 rounded-xl flex items-center justify-center mx-auto mb-4"
                style={{ background: "hsl(var(--primary) / 0.15)" }}
              >
                <stat.icon className="h-6 w-6" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <p className="text-2xl font-display font-bold mb-1" style={{ color: "hsl(0 0% 98%)" }}>
                {stat.value}
              </p>
              <p className="text-sm" style={{ color: "hsl(0 0% 60%)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Main content: two columns */}
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: description */}
          <div>
            <h3 className="text-2xl font-display font-bold mb-6" style={{ color: "hsl(0 0% 95%)" }}>
              De Argentina al mundo, con calidad de primer nivel
            </h3>
            <div className="space-y-5 text-base leading-relaxed" style={{ color: "hsl(0 0% 70%)" }}>
              <p>
                Greenpac es uno de los referentes en fabricación de packaging ecológico de América del Sur. Nuestros procesos productivos están certificados bajo estándares internacionales, lo que nos permite abastecer a grandes corporaciones y marcas globales con exigencias de calidad muy altas.
              </p>
              <p>
                Trabajamos con clientes de la industria alimenticia, cosmética, farmacéutica, retail y más. Desde materiales compostables hasta soluciones de embalaje personalizadas, somos el socio estratégico de marcas que buscan diferenciarse con packaging sustentable.
              </p>
              <p>
                Nuestra capacidad de distribución nos permite llegar a cualquier punto del país y coordinar exportaciones a toda la región y el mundo.
              </p>
            </div>

            <div className="mt-8 flex items-center gap-4">
              <div
                className="h-1 w-16 rounded-full"
                style={{ background: "hsl(var(--greenpac-gold))" }}
              />
              <p className="text-sm font-semibold tracking-wider uppercase" style={{ color: "hsl(var(--greenpac-gold))" }}>
                Calidad certificada · Producción local · Alcance global
              </p>
            </div>
          </div>

          {/* Right: industries grid */}
          <div>
            <p className="text-sm font-semibold tracking-widest uppercase mb-6" style={{ color: "hsl(var(--primary))" }}>
              Industrias que nos eligen
            </p>
            <div className="grid grid-cols-2 gap-3">
              {industries.map((industry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl border"
                  style={{
                    background: "hsl(0 0% 100% / 0.04)",
                    borderColor: "hsl(0 0% 100% / 0.08)",
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: "hsl(var(--primary))" }}
                  />
                  <span className="text-sm font-medium" style={{ color: "hsl(0 0% 85%)" }}>
                    {industry}
                  </span>
                </div>
              ))}
            </div>

            {/* Trust badge */}
            <div
              className="mt-8 p-5 rounded-2xl border flex items-start gap-4"
              style={{
                background: "hsl(var(--greenpac-gold) / 0.08)",
                borderColor: "hsl(var(--greenpac-gold) / 0.25)",
              }}
            >
              <Award className="h-8 w-8 flex-shrink-0 mt-1" style={{ color: "hsl(var(--greenpac-gold))" }} />
              <div>
                <p className="font-display font-semibold mb-1" style={{ color: "hsl(var(--greenpac-gold))" }}>
                  Proveedor de confianza
                </p>
                <p className="text-sm" style={{ color: "hsl(0 0% 65%)" }}>
                  Marcas líderes de consumo masivo, cosméticos y alimentos confían en Greenpac para sus líneas de packaging premium y sustentable.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Clients;
