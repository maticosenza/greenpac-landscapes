import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ReplyRequest {
  to_email: string;
  to_name: string;
  original_message: string;
  reply_message: string;
}

// HTML escape function to prevent XSS in email templates
function escapeHtml(unsafe: string): string {
  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const resendApiKey = Deno.env.get('RESEND_API_KEY');

    // Verify the user is authenticated and has staff role
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
    
    // Get user from token
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: userError } = await supabaseClient.auth.getUser(token);
    
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'No autorizado' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if user is employee or admin
    const { data: roles, error: rolesError } = await supabaseClient
      .from('user_roles')
      .select('role')
      .eq('user_id', user.id);

    if (rolesError) {
      return new Response(
        JSON.stringify({ error: 'Error al verificar permisos' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const isStaff = roles?.some(r => r.role === 'employee' || r.role === 'admin');
    if (!isStaff) {
      return new Response(
        JSON.stringify({ error: 'No tienes permisos para realizar esta acción' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: ReplyRequest = await req.json();
    const { to_email, to_name, original_message, reply_message } = body;

    // Validate required fields
    if (!to_email || !to_name || !reply_message) {
      return new Response(
        JSON.stringify({ error: 'Faltan campos requeridos' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // If Resend API key is configured, send email
    if (resendApiKey) {
      try {
        // Escape HTML to prevent XSS
        const safeName = escapeHtml(to_name);
        const safeOriginalMessage = escapeHtml(original_message || '').replace(/\n/g, '<br>');
        const safeReplyMessage = escapeHtml(reply_message).replace(/\n/g, '<br>');

        const emailResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${resendApiKey}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: 'Greenpac Argentina <noreply@greenpacargentina.com>',
            to: [to_email],
            subject: 'Respuesta a tu consulta - Greenpac Argentina',
            html: `
              <!DOCTYPE html>
              <html>
              <head>
                <meta charset="utf-8">
                <style>
                  body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                  .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                  .header { background-color: #2d5016; color: white; padding: 20px; text-align: center; }
                  .content { padding: 20px; background-color: #f9f9f9; }
                  .original { background-color: #e9e9e9; padding: 15px; border-left: 4px solid #2d5016; margin: 20px 0; }
                  .reply { background-color: white; padding: 15px; border: 1px solid #ddd; margin: 20px 0; }
                  .footer { text-align: center; padding: 20px; font-size: 12px; color: #666; }
                </style>
              </head>
              <body>
                <div class="container">
                  <div class="header">
                    <h1>Greenpac Argentina</h1>
                  </div>
                  <div class="content">
                    <p>Hola ${safeName},</p>
                    <p>Gracias por contactarnos. A continuación encontrarás nuestra respuesta a tu consulta:</p>
                    
                    <div class="original">
                      <strong>Tu consulta:</strong>
                      <p>${safeOriginalMessage}</p>
                    </div>
                    
                    <div class="reply">
                      <strong>Nuestra respuesta:</strong>
                      <p>${safeReplyMessage}</p>
                    </div>
                    
                    <p>Si tenés más preguntas, no dudes en contactarnos.</p>
                    <p>Saludos cordiales,<br>El equipo de Greenpac Argentina</p>
                  </div>
                  <div class="footer">
                    <p>&copy; ${new Date().getFullYear()} Greenpac Argentina. Todos los derechos reservados.</p>
                  </div>
                </div>
              </body>
              </html>
            `,
          }),
        });

        if (!emailResponse.ok) {
          // Log only in development - don't expose details
        }
      } catch (_emailError) {
        // Silent fail for email - don't block the request
      }
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Respuesta registrada correctamente' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (_error) {
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
