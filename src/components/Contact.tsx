import { useState } from "react";
import { MapPin, Phone, Mail, Clock, Send, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useSiteContent } from "@/hooks/useSiteContent";
import EditableSection from "@/components/EditableSection";

const contactIcons = [Mail, Phone, MapPin, Clock];

const defaultContactInfo = [
  { label: "Email", value: "info@greenpac.com.ar", href: "mailto:info@greenpac.com.ar" },
  { label: "Teléfono", value: "+54 9 2392 67-7879", href: "tel:+5492392677879" },
  { label: "Ubicación", value: "Luis Maria Drago 3249, Burzaco.", href: "https://www.google.com/maps/place//data=!4m2!3m1!1s0x95bcd5f5af10ecef:0x72dc685efac9954f?entry=s&sa=X&ved=2ahUKEwjzhfDt2--SAxVunpUCHUdcA5YQ4kB6BAgUEAA&hl=es" },
  { label: "Horario", value: "Lun - Vie: 9:00 - 18:00", href: "#" },
];

const Contact = () => {
  const { toast } = useToast();
  const { getText } = useSiteContent();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    message: "",
  });

  const contactTitle = getText("contact-title", "Hablemos de tu Proyecto");
  const contactSubtitle = getText("contact-subtitle", "Estamos listos para asesorarte y encontrar la solución perfecta para las necesidades de tu establecimiento.");
  const contactEmail = getText("contact-email", "info@greenpac.com.ar");
  const contactEmail2 = getText("contact-email-2", "Ventas.lacasadelaspicadoras@gmail.com");
  const contactPhone = getText("contact-phone", "+54 9 2392 67-7879");
  const contactLocation = getText("contact-location", "Luis Maria Drago 3249, Burzaco.");
  const contactHours = getText("contact-hours", "Lun - Vie: 9:00 - 18:00");
  const formButtonLabel = getText("contact-form-button", "Enviar Mensaje");

  const contactInfo = [
    { icon: Mail, label: "Email", value: contactEmail, href: `mailto:${contactEmail}` },
    { icon: Mail, label: "Email Ventas", value: contactEmail2, href: `mailto:${contactEmail2}` },
    { icon: Phone, label: "Teléfono", value: contactPhone, href: `tel:${contactPhone.replace(/\s/g, "")}` },
    { icon: MapPin, label: "Ubicación", value: contactLocation, href: "https://www.google.com/maps/place//data=!4m2!3m1!1s0x95bcd5f5af10ecef:0x72dc685efac9954f?entry=s&sa=X&ved=2ahUKEwjzhfDt2--SAxVunpUCHUdcA5YQ4kB6BAgUEAA&hl=es" },
    { icon: Clock, label: "Horario", value: contactHours, href: "#" },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const { data, error } = await supabase.functions.invoke('submit-contact', {
        body: {
          name: formData.name,
          email: formData.email,
          phone: formData.phone || undefined,
          message: formData.message,
        },
      });
      if (error) throw error;
      if (data?.error) {
        toast({ title: "Error", description: data.error, variant: "destructive" });
        return;
      }
      toast({ title: "Mensaje enviado", description: "Nos pondremos en contacto contigo a la brevedad." });
      setFormData({ name: "", email: "", phone: "", message: "" });
    } catch (error) {
      if (import.meta.env.DEV) console.error('Error submitting contact form:', error);
      toast({ title: "Error", description: "Hubo un problema al enviar tu mensaje. Por favor, intentá de nuevo.", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  return (
    <section id="contacto" className="greenpac-section bg-greenpac-dark">
      <div className="greenpac-container">
        <EditableSection
          sectionId="Contacto Encabezado"
          fields={[
            { key: "contact-title", label: "Título", type: "text", fallback: "Hablemos de tu Proyecto" },
            { key: "contact-subtitle", label: "Subtítulo", type: "textarea", fallback: contactSubtitle },
            { key: "contact-email", label: "Email", type: "text", fallback: "info@greenpac.com.ar" },
            { key: "contact-phone", label: "Teléfono", type: "text", fallback: "+54 11 XXXX-XXXX" },
            { key: "contact-location", label: "Ubicación", type: "text", fallback: "Luis Maria Drago 3249, Burzaco." },
            { key: "contact-hours", label: "Horario", type: "text", fallback: "Lun - Vie: 9:00 - 18:00" },
            { key: "contact-form-button", label: "Texto del botón", type: "text", fallback: "Enviar Mensaje" },
          ]}
        >
          <div className="text-center mb-16">
            <p className="text-primary font-display font-semibold mb-3 tracking-widest uppercase">
              Contacto
            </p>
            <h2 className="greenpac-title text-primary-foreground mb-4">
              {contactTitle}
            </h2>
            <p className="text-primary-foreground/70 text-lg max-w-2xl mx-auto">
              {contactSubtitle}
            </p>
          </div>
        </EditableSection>

        <div className="grid lg:grid-cols-5 gap-12">
          {/* Contact Info */}
          <div className="lg:col-span-2 space-y-6">
            {contactInfo.map((item) => (
              <a
                key={item.label}
                href={item.href}
                target={item.href.startsWith("http") ? "_blank" : undefined}
                rel={item.href.startsWith("http") ? "noopener noreferrer" : undefined}
                className="flex items-start gap-4 p-4 rounded-xl bg-primary-foreground/5 hover:bg-primary-foreground/10 transition-colors group"
              >
                <div className="flex-shrink-0 w-12 h-12 rounded-lg bg-primary/20 flex items-center justify-center group-hover:bg-primary/30 transition-colors">
                  <item.icon className="h-5 w-5 text-primary" />
                </div>
                <div className="min-w-0">
                  <p className="text-primary-foreground/60 text-sm font-medium mb-1">{item.label}</p>
                  <p className="text-primary-foreground font-medium break-all">{item.value}</p>
                </div>
              </a>
            ))}

            {/* Social Links */}
            <div className="pt-6 border-t border-primary-foreground/10">
              <p className="text-primary-foreground/60 text-sm font-medium mb-4">Seguinos en redes</p>
              <div className="flex gap-4">
                <a href="https://www.instagram.com/greenpac.arg/" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary/30 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/></svg>
                </a>
                <a href="https://www.facebook.com/greenpac.argentina" target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-primary-foreground/10 hover:bg-primary/30 flex items-center justify-center transition-colors">
                  <svg className="w-5 h-5 text-primary-foreground" fill="currentColor" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="lg:col-span-3 bg-primary-foreground/5 rounded-2xl p-8">
            <div className="grid sm:grid-cols-2 gap-5 mb-5">
              <div>
                <label htmlFor="name" className="block text-primary-foreground/80 text-sm font-medium mb-2">Nombre completo *</label>
                <Input id="name" name="name" value={formData.name} onChange={handleChange} placeholder="Tu nombre" required minLength={2} maxLength={100} disabled={isSubmitting} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" />
              </div>
              <div>
                <label htmlFor="email" className="block text-primary-foreground/80 text-sm font-medium mb-2">Email *</label>
                <Input id="email" name="email" type="email" value={formData.email} onChange={handleChange} placeholder="tu@email.com" required maxLength={255} disabled={isSubmitting} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" />
              </div>
            </div>
            <div className="mb-5">
              <label htmlFor="phone" className="block text-primary-foreground/80 text-sm font-medium mb-2">Teléfono</label>
              <Input id="phone" name="phone" type="tel" value={formData.phone} onChange={handleChange} placeholder="+54 11 XXXX-XXXX" maxLength={50} disabled={isSubmitting} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40" />
            </div>
            <div className="mb-6">
              <label htmlFor="message" className="block text-primary-foreground/80 text-sm font-medium mb-2">Mensaje *</label>
              <Textarea id="message" name="message" value={formData.message} onChange={handleChange} placeholder="Contanos sobre tu proyecto o consulta..." rows={5} required minLength={1} maxLength={2000} disabled={isSubmitting} className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground placeholder:text-primary-foreground/40 resize-none" />
            </div>
            <Button type="submit" variant="hero" size="lg" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <><Loader2 className="mr-2 h-5 w-5 animate-spin" />Enviando...</>
              ) : (
                <>{formButtonLabel}<Send className="ml-2 h-5 w-5" /></>
              )}
            </Button>
          </form>
        </div>
      </div>
    </section>
  );
};

export default Contact;
