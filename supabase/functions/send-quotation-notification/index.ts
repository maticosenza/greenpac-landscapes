import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

// HTML escape function to prevent XSS in email templates
function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

async function sendEmail(to: string[], subject: string, html: string): Promise<{ success: boolean; data?: unknown; error?: string }> {
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
      return { success: false, error };
    }
    
    const data = await response.json();
    return { success: true, data };
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    return { success: false, error: errorMessage };
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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    // Get client IP for rate limiting
    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

    // Check rate limit (10 requests per hour per IP)
    const { data: canProceed } = await supabaseClient.rpc('check_rate_limit', {
      p_identifier: clientIp,
      p_action: 'quotation_notification',
      p_max_requests: 10,
      p_window_minutes: 60
    });

    if (!canProceed) {
      return new Response(
        JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record the rate limit action
    await supabaseClient.rpc('record_rate_limit', {
      p_identifier: clientIp,
      p_action: 'quotation_notification'
    });

    const data: QuotationNotificationRequest = await req.json();

    const quotationTypeLabels: Record<string, string> = {
      quote: "Cotización",
      purchase: "Compra directa",
      deposit: "Seña / Reserva",
    };

    const typeLabel = quotationTypeLabels[data.quotation_type] || data.quotation_type;

    // Escape all user-provided content for HTML emails
    const safeClientName = escapeHtml(data.client_name);
    const safeClientEmail = escapeHtml(data.client_email);
    const safeClientPhone = escapeHtml(data.client_phone || '');
    const safeCompany = escapeHtml(data.company || '');
    const safeMessage = escapeHtml(data.message || '');
    const safeCreatedBy = escapeHtml(data.created_by_employee || '');
    const safeProducts = data.products.map(p => escapeHtml(p));

    // Send notification to admin
    const adminEmailAddr = data.admin_email || "cosenzamati@gmail.com";
    
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Nueva ${escapeHtml(typeLabel)}</h1>
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Datos del Cliente</h2>
          <p><strong>Nombre:</strong> ${safeClientName}</p>
          <p><strong>Email:</strong> ${safeClientEmail}</p>
          ${safeClientPhone ? `<p><strong>Teléfono:</strong> ${safeClientPhone}</p>` : ""}
          ${safeCompany ? `<p><strong>Empresa:</strong> ${safeCompany}</p>` : ""}
        </div>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Detalles de la Solicitud</h2>
          <p><strong>Tipo:</strong> ${escapeHtml(typeLabel)}</p>
          <p><strong>Productos:</strong> ${safeProducts.join(", ")}</p>
          ${safeMessage ? `<p><strong>Mensaje:</strong> ${safeMessage}</p>` : ""}
          ${safeCreatedBy ? `<p><strong>Creada por:</strong> ${safeCreatedBy}</p>` : ""}
        </div>
        
        <p style="color: #6b7280; font-size: 12px;">
          Este email fue enviado automáticamente desde Greenpac.
        </p>
      </div>
    `;

    const adminEmailResult = await sendEmail(
      [adminEmailAddr],
      `Nueva ${typeLabel} de ${safeClientName}`,
      adminEmailHtml
    );

    // Send confirmation to client
    const clientEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">¡Gracias por contactarnos, ${safeClientName}!</h1>
        <p>Hemos recibido tu solicitud de <strong>${escapeHtml(typeLabel.toLowerCase())}</strong>.</p>
        
        <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h2 style="margin-top: 0;">Resumen de tu solicitud</h2>
          <p><strong>Productos de interés:</strong></p>
          <ul>
            ${safeProducts.map(p => `<li>${p}</li>`).join("")}
          </ul>
          ${safeMessage ? `<p><strong>Tu mensaje:</strong> ${safeMessage}</p>` : ""}
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

    return new Response(
      JSON.stringify({ 
        success: true, 
        adminEmail: adminEmailResult,
        clientEmail: clientEmailResult,
      }),
      {
        status: 200,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders,
        },
      }
    );
  } catch (_error) {
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      {
        status: 500,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
};

serve(handler);
