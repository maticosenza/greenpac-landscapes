import { useQuery } from "@tanstack/react-query";
import { Star, Quote } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Testimonial {
  id: string;
  client_name: string;
  company: string | null;
  role: string | null;
  content: string;
  rating: number | null;
  image_url: string | null;
}

const Testimonials = () => {
  const { data: testimonials, isLoading } = useQuery({
    queryKey: ["testimonials"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("testimonials")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Testimonial[];
    },
  });

  if (isLoading) {
    return (
      <section className="greenpac-section bg-background">
        <div className="greenpac-container">
          <div className="text-center">
            <div className="animate-pulse">
              <div className="h-8 bg-muted rounded w-48 mx-auto mb-4"></div>
              <div className="h-4 bg-muted rounded w-72 mx-auto"></div>
            </div>
          </div>
        </div>
      </section>
    );
  }

  if (!testimonials?.length) {
    return null;
  }

  return (
    <section id="testimonios" className="greenpac-section bg-background">
      <div className="greenpac-container">
        <div className="text-center mb-16">
          <p className="text-primary font-display font-semibold mb-3 tracking-widest uppercase">
            Testimonios
          </p>
          <h2 className="greenpac-title text-foreground mb-4">
            Lo Que Dicen Nuestros Clientes
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            La satisfacción de nuestros clientes es nuestra mayor recompensa.
            Conocé sus experiencias trabajando con GreenPac.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <div
              key={testimonial.id}
              className="bg-card rounded-xl p-8 relative animate-slide-up"
              style={{ 
                animationDelay: `${index * 0.15}s`,
                boxShadow: "var(--shadow-card)"
              }}
            >
              <Quote className="absolute top-6 right-6 h-10 w-10 text-primary/10" />
              
              <div className="flex gap-1 mb-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < (testimonial.rating || 5)
                        ? "text-secondary fill-secondary"
                        : "text-muted"
                    }`}
                  />
                ))}
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6 italic">
                "{testimonial.content}"
              </p>

              <div className="flex items-center gap-4">
                {testimonial.image_url ? (
                  <img
                    src={testimonial.image_url}
                    alt={testimonial.client_name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-primary font-bold text-lg">
                      {testimonial.client_name.charAt(0)}
                    </span>
                  </div>
                )}
                <div>
                  <p className="font-display font-semibold text-foreground">
                    {testimonial.client_name}
                  </p>
                  {(testimonial.role || testimonial.company) && (
                    <p className="text-sm text-muted-foreground">
                      {testimonial.role}
                      {testimonial.role && testimonial.company && " · "}
                      {testimonial.company}
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
