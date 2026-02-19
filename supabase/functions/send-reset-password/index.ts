import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const RESEND_API_KEY = Deno.env.get("RESEND_API_KEY")!;

    const { email } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Generate password reset link
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "recovery",
      email,
      options: {
        redirectTo: `https://greenpac-landscapes.lovable.app/reset-password`,
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Link generation error:", linkError);
      // Don't reveal if the user exists or not — always return success
      return new Response(
        JSON.stringify({ message: "Si el email existe, te enviaremos el enlace." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resetLink = linkData.properties.action_link;

    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Recuperar contraseña - Greenpac</title>
      </head>
      <body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif;">
        <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f4;padding:40px 0;">
          <tr>
            <td align="center">
              <table width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
                <!-- Header -->
                <tr>
                  <td style="background-color:#1a5c2a;padding:32px 40px;text-align:center;">
                    <h1 style="color:#ffffff;margin:0;font-size:28px;font-weight:bold;letter-spacing:1px;">GREENPAC</h1>
                    <p style="color:#a8d5b5;margin:8px 0 0;font-size:14px;">Soluciones de packaging sustentable</p>
                  </td>
                </tr>
                <!-- Body -->
                <tr>
                  <td style="padding:40px;">
                    <h2 style="color:#1a5c2a;margin:0 0 16px;font-size:22px;">Recuperar contraseña</h2>
                    <p style="color:#444;line-height:1.6;margin:0 0 16px;">
                      Recibimos una solicitud para restablecer la contraseña de tu cuenta asociada a <strong>${email}</strong>.
                    </p>
                    <p style="color:#444;line-height:1.6;margin:0 0 32px;">
                      Hacé clic en el botón de abajo para crear una nueva contraseña. El enlace expirará en <strong>1 hora</strong>.
                    </p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <a href="${resetLink}" style="background-color:#1a5c2a;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">
                            Restablecer contraseña
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#888;font-size:12px;margin:32px 0 0;line-height:1.6;">
                      Si no solicitaste este cambio, podés ignorar este email. Tu contraseña seguirá siendo la misma.<br/>
                      Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br/>
                      <a href="${resetLink}" style="color:#1a5c2a;word-break:break-all;">${resetLink}</a>
                    </p>
                  </td>
                </tr>
                <!-- Footer -->
                <tr>
                  <td style="background-color:#f9f9f9;padding:20px 40px;text-align:center;border-top:1px solid #eee;">
                    <p style="color:#aaa;font-size:12px;margin:0;">
                      © ${new Date().getFullYear()} Greenpac Argentina · <a href="mailto:info@greenpac.com.ar" style="color:#1a5c2a;">info@greenpac.com.ar</a>
                    </p>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
        </table>
      </body>
      </html>
    `;

    const resendResponse = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${RESEND_API_KEY}`,
      },
      body: JSON.stringify({
        from: "Greenpac <info@greenpac.com.ar>",
        to: [email],
        subject: "Recuperar contraseña - Greenpac",
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error("Resend error:", resendError);
      return new Response(JSON.stringify({ error: "Error al enviar el email" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Reset password email sent via Resend to:", email);

    return new Response(
      JSON.stringify({ message: "Email de recuperación enviado correctamente." }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(JSON.stringify({ error: "Error interno del servidor" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
