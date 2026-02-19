// send-chat-notification edge function

const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY");

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function escapeHtml(unsafe: string): string {
  if (!unsafe) return '';
  return unsafe.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#039;");
}

interface ChatNotificationRequest {
  recipient_email: string;
  recipient_name: string;
  sender_name: string;
  message: string;
  quotation_client_name: string;
  is_to_client: boolean;
}

const handler = async (req: Request): Promise<Response> => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const data: ChatNotificationRequest = await req.json();

    const safeSender = escapeHtml(data.sender_name);
    const safeMessage = escapeHtml(data.message);
    const safeRecipient = escapeHtml(data.recipient_name);
    const safeClient = escapeHtml(data.quotation_client_name);

    const subject = data.is_to_client
      ? `Nuevo mensaje en tu cotización - Greenpac`
      : `Nuevo mensaje del cliente ${safeClient}`;

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #16a34a;">Nuevo mensaje en cotización</h1>
        <p>Hola ${safeRecipient},</p>
        <p><strong>${safeSender}</strong> te envió un mensaje:</p>
        <div style="background-color: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #16a34a;">
          <p style="margin: 0; white-space: pre-wrap;">${safeMessage}</p>
        </div>
        <p>Ingresá a la plataforma para responder.</p>
        <p style="margin-top: 30px;"><strong>Equipo Greenpac</strong></p>
      </div>
    `;

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Greenpac <info@greenpac.com.ar>",
        to: [data.recipient_email],
        subject,
        html,
      }),
    });

    if (!res.ok) {
      const error = await res.text();
      return new Response(JSON.stringify({ success: false, error }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const result = await res.json();
    return new Response(JSON.stringify({ success: true, data: result }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (_error) {
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
};

Deno.serve(handler);
