import { Globe, Award, Factory, TrendingUp } from "lucide-react";

const stats = [
  { icon: Factory, value: "+20 años", label: "fabricando maquinaria agrícola" },
  { icon: Globe, value: "Todo el mundo", label: "exportación internacional" },
  { icon: Award, value: "Marcas líderes", label: "del agro a nivel global" },
  { icon: TrendingUp, value: "+500 clientes", label: "en Argentina y el exterior" },
];

const industries = [
  "Cosechadoras & Cabezales",
  "Cabezales Rotativos",
  "Agroindustria",
  "Exposiciones Agro",
  "Soja, Maíz & Cereales",
  "Contratistas Rurales",
  "Cooperativas Agrícolas",
  "Exportación & Acopio",
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
        <div className="text-center mb-10 md:mb-16">
          <p className="font-display font-semibold mb-3 tracking-widest uppercase text-xs sm:text-sm" style={{ color: "hsl(var(--greenpac-gold))" }}>
            Nuestros Clientes
          </p>
          <h2 className="greenpac-title mb-4 md:mb-6" style={{ color: "hsl(0 0% 98%)" }}>
            Maquinaria agrícola para las{" "}
            <span style={{ color: "hsl(var(--primary))" }}>
              grandes marcas del agro mundial
            </span>
          </h2>
          <p className="text-base sm:text-lg max-w-3xl mx-auto px-2" style={{ color: "hsl(0 0% 75%)" }}>
            Somos fabricantes de maquinaria agrícola de alta precisión con presencia global. Nuestros cabezales y equipos trabajan en los campos más exigentes del mundo, de la mano de las marcas líderes de la agroindustria.
          </p>
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-12 md:mb-20">
          {stats.map((stat, i) => (
            <div
              key={i}
              className="text-center p-4 sm:p-6 rounded-2xl border"
              style={{
                background: "hsl(var(--primary) / 0.08)",
                borderColor: "hsl(var(--primary) / 0.2)",
              }}
            >
              <div
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto mb-3 sm:mb-4"
                style={{ background: "hsl(var(--primary) / 0.15)" }}
              >
                <stat.icon className="h-5 w-5 sm:h-6 sm:w-6" style={{ color: "hsl(var(--primary))" }} />
              </div>
              <p className="text-xl sm:text-2xl font-display font-bold mb-1" style={{ color: "hsl(0 0% 98%)" }}>
                {stat.value}
              </p>
              <p className="text-xs sm:text-sm leading-snug" style={{ color: "hsl(0 0% 60%)" }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Main content: two columns */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left: description */}
          <div>
            <h3 className="text-xl sm:text-2xl font-display font-bold mb-5 sm:mb-6" style={{ color: "hsl(0 0% 95%)" }}>
              De Argentina al campo del mundo, con ingeniería de primer nivel
            </h3>
            <div className="space-y-4 sm:space-y-5 text-sm sm:text-base leading-relaxed" style={{ color: "hsl(0 0% 70%)" }}>
              <p>
                Greenpac es fabricante de maquinaria agrícola de alta tecnología, especializado en cabezales de cosechadora y cabezales rotativos para las cosechas más exigentes. Nuestros equipos están diseñados para maximizar el rendimiento en cultivos de soja, maíz, trigo y girasol.
              </p>
              <p>
                Trabajamos con las principales marcas de la agroindustria a nivel global, proveyendo soluciones de maquinaria para contratistas rurales, cooperativas agrícolas y grandes productores. Somos el socio estratégico de quienes buscan eficiencia y confiabilidad en el campo.
              </p>
              <p>
                Nuestra capacidad productiva y red de distribución nos permite abastecer a todo el país y coordinar exportaciones a toda la región y el mundo.
              </p>
            </div>

            <div className="mt-6 sm:mt-8 flex items-center gap-3 sm:gap-4 flex-wrap">
              <div
                className="h-1 w-12 sm:w-16 rounded-full flex-shrink-0"
                style={{ background: "hsl(var(--greenpac-gold))" }}
              />
              <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase" style={{ color: "hsl(var(--greenpac-gold))" }}>
                Ingeniería certificada · Producción local · Alcance global
              </p>
            </div>
          </div>

          {/* Right: industries grid */}
          <div>
            <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-4 sm:mb-6" style={{ color: "hsl(var(--primary))" }}>
              Industrias que nos eligen
            </p>
            <div className="grid grid-cols-2 gap-2 sm:gap-3">
              {industries.map((industry, i) => (
                <div
                  key={i}
                  className="flex items-center gap-2 sm:gap-3 px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border"
                  style={{
                    background: "hsl(0 0% 100% / 0.04)",
                    borderColor: "hsl(0 0% 100% / 0.08)",
                  }}
                >
                  <div
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: "hsl(var(--primary))" }}
                  />
                  <span className="text-xs sm:text-sm font-medium leading-tight" style={{ color: "hsl(0 0% 85%)" }}>
                    {industry}
                  </span>
                </div>
              ))}
            </div>

            {/* Trust badge */}
            <div
              className="mt-6 sm:mt-8 p-4 sm:p-5 rounded-2xl border flex items-start gap-3 sm:gap-4"
              style={{
                background: "hsl(var(--greenpac-gold) / 0.08)",
                borderColor: "hsl(var(--greenpac-gold) / 0.25)",
              }}
            >
              <Award className="h-6 w-6 sm:h-8 sm:w-8 flex-shrink-0 mt-0.5" style={{ color: "hsl(var(--greenpac-gold))" }} />
              <div>
                <p className="font-display font-semibold mb-1 text-sm sm:text-base" style={{ color: "hsl(var(--greenpac-gold))" }}>
                  Proveedor de confianza
                </p>
                <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "hsl(0 0% 65%)" }}>
                  Las marcas líderes de la agroindustria a nivel global eligen Greenpac por la precisión, durabilidad y rendimiento de nuestra maquinaria. Desde cabezales de cosechadora hasta equipos rotativos de gran porte, somos sinónimo de confianza en el campo.
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
