import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

async function sendEmail(to: string[], subject: string, html: string): Promise<{ success: boolean; data?: any; error?: string }> {
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Greenpac <onboarding@resend.dev>",
        to,
        subject,
        html,
      }),
    });
    
    if (!response.ok) {
      const error = await response.text();
      console.warn(`Email sending failed (this is expected in test mode): ${error}`);
      return { success: false, error };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error: any) {
    console.warn(`Email sending error: ${error.message}`);
    return { success: false, error: error.message };
  }
}



const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface QuotationNotificationRequest {
  client_name: string;
  client_email: string;
  client_phone?: string;
  company?: string;
  quotation_type: string;
  products: string[];
  message?: string;
  created_by_employee?: string;
  admin_email?: string;
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: QuotationNotificationRequest = await req.json();
    console.log("Received quotation notification request:", data);

    const quotationTypeLabels: Record<string, string> = {
      quote: "Cotización",
      purchase: "Compra directa",
      deposit: "Seña / Reserva",
    };

    const typeLabel = quotationTypeLabels[data.quotation_type] || data.quotation_type;

    // Send notification to admin
    const adminEmailAddr = data.admin_email || "cosenzamati@gmail.com";
    
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Nueva ${typeLabel}</h1>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Datos del Cliente</h2>
          <p><strong>Nombre:</strong> ${data.client_name}</p>
          <p><strong>Email:</strong> ${data.client_email}</p>
          ${data.client_phone ? `<p><strong>Teléfono:</strong> ${data.client_phone}</p>` : ""}
          ${data.company ? `<p><strong>Empresa:</strong> ${data.company}</p>` : ""}
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Detalles de la Solicitud</h2>
          <p><strong>Tipo:</strong> ${typeLabel}</p>
          <p><strong>Productos:</strong> ${data.products.join(", ")}</p>
          ${data.message ? `<p><strong>Mensaje:</strong> ${data.message}</p>` : ""}
          ${data.created_by_employee ? `<p><strong>Creada por:</strong> ${data.created_by_employee}</p>` : ""}
        </div>
        
        <p style="color: #6b7280; font-size: 12px;">
          Este email fue enviado automáticamente desde Greenpac.
        </p>
      </div>
    `;

    const adminEmailResult = await sendEmail(
      [adminEmailAddr],
      `Nueva ${typeLabel} de ${data.client_name}`,
      adminEmailHtml
    );

    console.log("Admin email result:", adminEmailResult);

    // Send confirmation to client
    const clientEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">¡Gracias por contactarnos, ${data.client_name}!</h1>
        <p>Hemos recibido tu solicitud de <strong>${typeLabel.toLowerCase()}</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Resumen de tu solicitud</h2>
          <p><strong>Productos de interés:</strong></p>
          <ul>
            ${data.products.map(p => `<li>${p}</li>`).join("")}
          </ul>
          ${data.message ? `<p><strong>Tu mensaje:</strong> ${data.message}</p>` : ""}
        </div>
        
        <p>Nos pondremos en contacto contigo a la brevedad para darte más información.</p>
        
        <p style="margin-top: 30px;">
          <strong>Equipo Greenpac</strong>
        </p>
        
        <p style="color: #6b7280; font-size: 12px; margin-top: 30px;">
          Si tenés alguna pregunta, no dudes en contactarnos por WhatsApp.
        </p>
      </div>
    `;

    const clientEmailResult = await sendEmail(
      [data.client_email],
      `Recibimos tu ${typeLabel.toLowerCase()} - Greenpac`,
      clientEmailHtml
    );

    console.log("Client email result:", clientEmailResult);

    return new Response(
      JSON.stringify({ 
        success: true, 
        adminEmail: adminEmailResult,
        clientEmail: clientEmailResult,
        note: "Email sending may fail in test mode. Verify a domain at resend.com/domains for production."
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (error: any) {
    console.error("Error in send-quotation-notification function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
