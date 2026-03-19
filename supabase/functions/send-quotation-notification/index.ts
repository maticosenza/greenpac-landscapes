import { createClient } from "npm:@supabase/supabase-js@2";

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

interface EmailAttachment {
  filename: string;
  content: string; // base64
}

async function sendEmail(to: string[], subject: string, html: string, attachments?: EmailAttachment[]): Promise<{ success: boolean; data?: unknown; error?: string }> {
  try {
    const body: Record<string, unknown> = {
      from: "Greenpac <info@greenpac.com.ar>",
      to,
      subject,
      html,
    };
    if (attachments && attachments.length > 0) {
      body.attachments = attachments;
    }
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify(body),
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
  price?: number | null;
  site_url?: string;
  pdf_base64?: string | null;
  quotation_id?: string;
  attachment_paths?: string[];
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);

    const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0] || 'unknown';

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

    const safeClientName = escapeHtml(data.client_name);
    const safeClientEmail = escapeHtml(data.client_email);
    const safeClientPhone = escapeHtml(data.client_phone || '');
    const safeCompany = escapeHtml(data.company || '');
    const safeMessage = escapeHtml(data.message || '');
    const safeCreatedBy = escapeHtml(data.created_by_employee || '');
    const safeProducts = data.products.map(p => escapeHtml(p));
    const priceStr = data.price != null ? `$${Number(data.price).toLocaleString("es-AR", { minimumFractionDigits: 2 })}` : null;
    const siteUrl = data.site_url || "https://greenpac-landscapes.lovable.app";

    // Check if client is registered
    const { data: existingUser } = await supabaseClient
      .from("profiles")
      .select("id")
      .eq("email", data.client_email)
      .maybeSingle();

    const isRegistered = !!existingUser;

    // Send notification to admin
    const adminEmailAddr = data.admin_email || "cosenzamati@gmail.com";
    
    const adminEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e501e; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #22c55e; margin: 0; font-size: 24px;">GREENPAC</h1>
          <p style="color: #fff; margin: 5px 0 0; font-size: 12px;">Soluciones para el campo</p>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e501e; margin-top: 0;">Nueva ${escapeHtml(typeLabel)}</h2>
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Nombre:</strong> ${safeClientName}</p>
            <p style="margin: 4px 0;"><strong>Email:</strong> ${safeClientEmail}</p>
            ${safeClientPhone ? `<p style="margin: 4px 0;"><strong>Teléfono:</strong> ${safeClientPhone}</p>` : ""}
            ${safeCompany ? `<p style="margin: 4px 0;"><strong>Empresa:</strong> ${safeCompany}</p>` : ""}
          </div>
          
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <p style="margin: 4px 0;"><strong>Tipo:</strong> ${escapeHtml(typeLabel)}</p>
            <p style="margin: 4px 0;"><strong>Productos:</strong> ${safeProducts.join(", ")}</p>
            ${priceStr ? `<p style="margin: 4px 0;"><strong>Precio:</strong> ${priceStr}</p>` : ""}
            ${safeMessage ? `<p style="margin: 4px 0;"><strong>Mensaje:</strong> ${safeMessage}</p>` : ""}
            ${safeCreatedBy ? `<p style="margin: 4px 0;"><strong>Creada por:</strong> ${safeCreatedBy}</p>` : ""}
          </div>
          
          <p style="color: #6b7280; font-size: 12px;">Este email fue enviado automáticamente desde Greenpac.</p>
        </div>
      </div>
    `;

    const adminEmailResult = await sendEmail(
      [adminEmailAddr],
      `Nueva ${typeLabel} de ${safeClientName}`,
      adminEmailHtml
    );

    // Send confirmation to client with registration invite if not registered
    const registrationBlock = !isRegistered ? `
      <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #22c55e;">
        <p style="font-weight: bold; margin: 0 0 8px;">¡Registrate en nuestra plataforma!</p>
        <p style="margin: 0 0 12px; font-size: 14px;">Creá tu cuenta para hacer seguimiento de tus cotizaciones, chatear con nuestro equipo y recibir actualizaciones en tiempo real.</p>
        <a href="${siteUrl}/auth" style="display: inline-block; background-color: #22c55e; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Crear cuenta gratis</a>
      </div>
    ` : `
      <div style="background-color: #f0fdf4; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #22c55e;">
        <p style="margin: 0;">Ingresá a tu panel para seguir el estado de tu cotización y chatear con nuestro equipo.</p>
        <a href="${siteUrl}/panel" style="display: inline-block; margin-top: 10px; background-color: #22c55e; color: white; padding: 10px 24px; border-radius: 6px; text-decoration: none; font-weight: bold;">Ir a mi panel</a>
      </div>
    `;

    const clientEmailHtml = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #1e501e; padding: 20px; border-radius: 8px 8px 0 0;">
          <h1 style="color: #22c55e; margin: 0; font-size: 24px;">GREENPAC</h1>
          <p style="color: #fff; margin: 5px 0 0; font-size: 12px;">Soluciones para el campo</p>
        </div>
        <div style="padding: 20px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 8px 8px;">
          <h2 style="color: #1e501e; margin-top: 0;">¡Gracias ${safeClientName}!</h2>
          <p>Recibimos tu solicitud de <strong>${escapeHtml(typeLabel.toLowerCase())}</strong>.</p>
          
          <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
            <h3 style="margin-top: 0;">Resumen de tu solicitud</h3>
            <p><strong>Productos:</strong></p>
            <ul>
              ${safeProducts.map(p => `<li>${p}</li>`).join("")}
            </ul>
            ${priceStr ? `<p style="font-size: 18px; font-weight: bold; color: #1e501e;">Total: ${priceStr}</p>` : ""}
            ${safeMessage ? `<p><strong>Tu mensaje:</strong> ${safeMessage}</p>` : ""}
          </div>
          
          ${registrationBlock}
          
          <p>Nos pondremos en contacto a la brevedad.</p>
          <p style="margin-top: 30px;"><strong>Equipo Greenpac</strong></p>
          <p style="color: #6b7280; font-size: 12px; margin-top: 20px;">
            Si tenés alguna pregunta, no dudes en contactarnos por WhatsApp.
          </p>
        </div>
      </div>
    `;

    const clientAttachments: EmailAttachment[] = [];
    if (data.pdf_base64) {
      const shortId = data.quotation_id ? data.quotation_id.slice(0, 8) : "nueva";
      clientAttachments.push({
        filename: `cotizacion-${shortId}.pdf`,
        content: data.pdf_base64,
      });
    }

    const clientEmailResult = await sendEmail(
      [data.client_email],
      `Recibimos tu ${typeLabel.toLowerCase()} - Greenpac`,
      clientEmailHtml,
      clientAttachments.length > 0 ? clientAttachments : undefined
    );

    return new Response(
      JSON.stringify({ 
        success: true, 
        adminEmail: adminEmailResult,
        clientEmail: clientEmailResult,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
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

Deno.serve(handler);
