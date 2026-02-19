import { Globe, Award, Factory, TrendingUp } from "lucide-react";
import { useSiteContent } from "@/hooks/useSiteContent";
import EditableSection from "@/components/EditableSection";

const statIcons = [Factory, Globe, Award, TrendingUp];

const Clients = () => {
  const { getText } = useSiteContent();

  // Header
  const kicker = getText("clients-kicker", "Nuestros Clientes");
  const titlePart1 = getText("clients-title-part1", "Maquinaria agrícola para las");
  const titlePart2 = getText("clients-title-part2", "grandes marcas del agro mundial");
  const subtitle = getText("clients-subtitle", "Somos fabricantes de maquinaria agrícola de alta precisión con presencia global. Nuestros cabezales y equipos trabajan en los campos más exigentes del mundo, de la mano de las marcas líderes de la agroindustria.");

  // Stats
  const stat1Value = getText("clients-stat1-value", "+20 años");
  const stat1Label = getText("clients-stat1-label", "fabricando maquinaria agrícola");
  const stat2Value = getText("clients-stat2-value", "Todo el mundo");
  const stat2Label = getText("clients-stat2-label", "exportación internacional");
  const stat3Value = getText("clients-stat3-value", "Marcas líderes");
  const stat3Label = getText("clients-stat3-label", "del agro a nivel global");
  const stat4Value = getText("clients-stat4-value", "+500 clientes");
  const stat4Label = getText("clients-stat4-label", "en Argentina y el exterior");

  const stats = [
    { icon: Factory, value: stat1Value, label: stat1Label },
    { icon: Globe, value: stat2Value, label: stat2Label },
    { icon: Award, value: stat3Value, label: stat3Label },
    { icon: TrendingUp, value: stat4Value, label: stat4Label },
  ];

  // Left column
  const descTitle = getText("clients-desc-title", "De Argentina al campo del mundo, con ingeniería de primer nivel");
  const descP1 = getText("clients-desc-p1", "Greenpac es fabricante de maquinaria agrícola de alta tecnología, especializado en cabezales de cosechadora y cabezales rotativos para las cosechas más exigentes. Nuestros equipos están diseñados para maximizar el rendimiento en cultivos de soja, maíz, trigo y girasol.");
  const descP2 = getText("clients-desc-p2", "Trabajamos con las principales marcas de la agroindustria a nivel global, proveyendo soluciones de maquinaria para contratistas rurales, cooperativas agrícolas y grandes productores. Somos el socio estratégico de quienes buscan eficiencia y confiabilidad en el campo.");
  const descP3 = getText("clients-desc-p3", "Nuestra capacidad productiva y red de distribución nos permite abastecer a todo el país y coordinar exportaciones a toda la región y el mundo.");
  const descBadge = getText("clients-desc-badge", "Ingeniería certificada · Producción local · Alcance global");

  // Right column
  const industriesTitle = getText("clients-industries-title", "Industrias que nos eligen");
  const ind1 = getText("clients-ind1", "Cosechadoras & Cabezales");
  const ind2 = getText("clients-ind2", "Cabezales Rotativos");
  const ind3 = getText("clients-ind3", "Agroindustria");
  const ind4 = getText("clients-ind4", "Exposiciones Agro");
  const ind5 = getText("clients-ind5", "Soja, Maíz & Cereales");
  const ind6 = getText("clients-ind6", "Contratistas Rurales");
  const ind7 = getText("clients-ind7", "Cooperativas Agrícolas");
  const ind8 = getText("clients-ind8", "Exportación & Acopio");

  const industries = [ind1, ind2, ind3, ind4, ind5, ind6, ind7, ind8];

  const trustTitle = getText("clients-trust-title", "Proveedor de confianza");
  const trustText = getText("clients-trust-text", "Las marcas líderes de la agroindustria a nivel global eligen Greenpac por la precisión, durabilidad y rendimiento de nuestra maquinaria. Desde cabezales de cosechadora hasta equipos rotativos de gran porte, somos sinónimo de confianza en el campo.");

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
        {/* Header — editable */}
        <EditableSection
          sectionId="Clientes Encabezado"
          fields={[
            { key: "clients-kicker", label: "Etiqueta superior", type: "text", fallback: "Nuestros Clientes" },
            { key: "clients-title-part1", label: "Título (parte normal)", type: "text", fallback: "Maquinaria agrícola para las" },
            { key: "clients-title-part2", label: "Título (parte destacada en verde)", type: "text", fallback: "grandes marcas del agro mundial" },
            { key: "clients-subtitle", label: "Subtítulo", type: "textarea", fallback: "Somos fabricantes de maquinaria agrícola de alta precisión con presencia global." },
          ]}
        >
          <div className="text-center mb-10 md:mb-16">
            <p className="font-display font-semibold mb-3 tracking-widest uppercase text-xs sm:text-sm" style={{ color: "hsl(var(--greenpac-gold))" }}>
              {kicker}
            </p>
            <h2 className="greenpac-title mb-4 md:mb-6" style={{ color: "hsl(0 0% 98%)" }}>
              {titlePart1}{" "}
              <span style={{ color: "hsl(var(--primary))" }}>
                {titlePart2}
              </span>
            </h2>
            <p className="text-base sm:text-lg max-w-3xl mx-auto px-2" style={{ color: "hsl(0 0% 75%)" }}>
              {subtitle}
            </p>
          </div>
        </EditableSection>

        {/* Stats row — editable */}
        <EditableSection
          sectionId="Clientes Estadísticas"
          fields={[
            { key: "clients-stat1-value", label: "Stat 1 — Valor", type: "text", fallback: "+20 años" },
            { key: "clients-stat1-label", label: "Stat 1 — Descripción", type: "text", fallback: "fabricando maquinaria agrícola" },
            { key: "clients-stat2-value", label: "Stat 2 — Valor", type: "text", fallback: "Todo el mundo" },
            { key: "clients-stat2-label", label: "Stat 2 — Descripción", type: "text", fallback: "exportación internacional" },
            { key: "clients-stat3-value", label: "Stat 3 — Valor", type: "text", fallback: "Marcas líderes" },
            { key: "clients-stat3-label", label: "Stat 3 — Descripción", type: "text", fallback: "del agro a nivel global" },
            { key: "clients-stat4-value", label: "Stat 4 — Valor", type: "text", fallback: "+500 clientes" },
            { key: "clients-stat4-label", label: "Stat 4 — Descripción", type: "text", fallback: "en Argentina y el exterior" },
          ]}
        >
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
        </EditableSection>

        {/* Main content: two columns */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-start">
          {/* Left: description — editable */}
          <EditableSection
            sectionId="Clientes Descripción"
            fields={[
              { key: "clients-desc-title", label: "Título columna izquierda", type: "text", fallback: "De Argentina al campo del mundo, con ingeniería de primer nivel" },
              { key: "clients-desc-p1", label: "Párrafo 1", type: "textarea", fallback: "Greenpac es fabricante de maquinaria agrícola de alta tecnología..." },
              { key: "clients-desc-p2", label: "Párrafo 2", type: "textarea", fallback: "Trabajamos con las principales marcas..." },
              { key: "clients-desc-p3", label: "Párrafo 3", type: "textarea", fallback: "Nuestra capacidad productiva..." },
              { key: "clients-desc-badge", label: "Badge inferior", type: "text", fallback: "Ingeniería certificada · Producción local · Alcance global" },
            ]}
          >
            <div>
              <h3 className="text-xl sm:text-2xl font-display font-bold mb-5 sm:mb-6" style={{ color: "hsl(0 0% 95%)" }}>
                {descTitle}
              </h3>
              <div className="space-y-4 sm:space-y-5 text-sm sm:text-base leading-relaxed" style={{ color: "hsl(0 0% 70%)" }}>
                <p>{descP1}</p>
                <p>{descP2}</p>
                <p>{descP3}</p>
              </div>
              <div className="mt-6 sm:mt-8 flex items-center gap-3 sm:gap-4 flex-wrap">
                <div
                  className="h-1 w-12 sm:w-16 rounded-full flex-shrink-0"
                  style={{ background: "hsl(var(--greenpac-gold))" }}
                />
                <p className="text-xs sm:text-sm font-semibold tracking-wider uppercase" style={{ color: "hsl(var(--greenpac-gold))" }}>
                  {descBadge}
                </p>
              </div>
            </div>
          </EditableSection>

          {/* Right: industries grid — editable */}
          <EditableSection
            sectionId="Clientes Industrias"
            fields={[
              { key: "clients-industries-title", label: "Título sección industrias", type: "text", fallback: "Industrias que nos eligen" },
              { key: "clients-ind1", label: "Industria 1", type: "text", fallback: "Cosechadoras & Cabezales" },
              { key: "clients-ind2", label: "Industria 2", type: "text", fallback: "Cabezales Rotativos" },
              { key: "clients-ind3", label: "Industria 3", type: "text", fallback: "Agroindustria" },
              { key: "clients-ind4", label: "Industria 4", type: "text", fallback: "Exposiciones Agro" },
              { key: "clients-ind5", label: "Industria 5", type: "text", fallback: "Soja, Maíz & Cereales" },
              { key: "clients-ind6", label: "Industria 6", type: "text", fallback: "Contratistas Rurales" },
              { key: "clients-ind7", label: "Industria 7", type: "text", fallback: "Cooperativas Agrícolas" },
              { key: "clients-ind8", label: "Industria 8", type: "text", fallback: "Exportación & Acopio" },
              { key: "clients-trust-title", label: "Badge — Título", type: "text", fallback: "Proveedor de confianza" },
              { key: "clients-trust-text", label: "Badge — Texto", type: "textarea", fallback: "Las marcas líderes de la agroindustria a nivel global eligen Greenpac..." },
            ]}
          >
            <div>
              <p className="text-xs sm:text-sm font-semibold tracking-widest uppercase mb-4 sm:mb-6" style={{ color: "hsl(var(--primary))" }}>
                {industriesTitle}
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
                    {trustTitle}
                  </p>
                  <p className="text-xs sm:text-sm leading-relaxed" style={{ color: "hsl(0 0% 65%)" }}>
                    {trustText}
                  </p>
                </div>
              </div>
            </div>
          </EditableSection>
        </div>
      </div>
    </section>
  );
};

export default Clients;
