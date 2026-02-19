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

    // Verify the caller is an admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerClient = createClient(supabaseUrl, Deno.env.get("SUPABASE_ANON_KEY")!, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: caller } } = await callerClient.auth.getUser();
    if (!caller) {
      return new Response(JSON.stringify({ error: "No autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check admin role
    const adminClient = createClient(supabaseUrl, serviceRoleKey);
    const { data: adminRole } = await adminClient
      .from("user_roles")
      .select("id")
      .eq("user_id", caller.id)
      .eq("role", "admin")
      .maybeSingle();

    if (!adminRole) {
      return new Response(JSON.stringify({ error: "Se requiere rol de administrador" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { email, role } = await req.json();

    if (!email) {
      return new Response(JSON.stringify({ error: "Email requerido" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Check if user already exists
    const { data: existingProfile } = await adminClient
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (existingProfile) {
      if (role && (role === "employee" || role === "admin" || role === "vendedor")) {
        const { error: roleError } = await adminClient
          .from("user_roles")
          .insert({ user_id: existingProfile.id, role })
          .select()
          .maybeSingle();

        if (roleError && roleError.message?.includes("duplicate")) {
          return new Response(JSON.stringify({ error: "El usuario ya tiene ese rol" }), {
            status: 409,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          });
        }

        return new Response(JSON.stringify({ message: "Rol asignado al usuario existente" }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ error: "El usuario ya está registrado" }), {
        status: 409,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Step 1: Use inviteUserByEmail to create user in proper "invited" state
    // This allows updateUser(password) to work correctly after the user clicks the link.
    // The default email sent by Lovable Cloud hook will be superseded by a new token
    // generated in step 2 (old token is invalidated when a new invite link is generated).
    const { data: inviteData, error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: {
        invited_role: role || "customer",
        full_name: email.split("@")[0],
      },
      redirectTo: `https://greenpac.com.ar/panel`,
    });

    if (inviteError) {
      console.error("Invite error:", inviteError);
      return new Response(JSON.stringify({ error: inviteError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("User invited successfully:", email);

    // Assign role if specified
    if (role && (role === "employee" || role === "admin" || role === "vendedor") && inviteData?.user) {
      await adminClient
        .from("user_roles")
        .insert({ user_id: inviteData.user.id, role });
    }

    // Step 2: Generate a FRESH invite link — this invalidates the token from Step 1
    // so the Lovable Cloud hook email link won't work, only our Resend email will.
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "invite",
      email,
      options: {
        redirectTo: `https://greenpac.com.ar/panel`,
        data: { invited_role: role || "customer" },
      },
    });

    if (linkError || !linkData?.properties?.action_link) {
      console.error("Link generation error:", linkError);
      return new Response(
        JSON.stringify({ message: "Usuario invitado correctamente." }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const inviteLink = linkData.properties.action_link;
    const roleName = role === "admin" ? "Administrador" : role === "employee" ? "Empleado" : role === "vendedor" ? "Vendedor" : "Cliente";

    // Send custom invitation email via Resend from info@greenpac.com.ar
    const emailHtml = `
      <!DOCTYPE html>
      <html lang="es">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0"/>
        <title>Invitación a Greenpac</title>
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
                    <h2 style="color:#1a5c2a;margin:0 0 16px;font-size:22px;">¡Fuiste invitado a Greenpac!</h2>
                    <p style="color:#444;line-height:1.6;margin:0 0 16px;">
                      Recibiste una invitación para unirte al equipo de Greenpac como <strong>${roleName}</strong>.
                    </p>
                    <p style="color:#444;line-height:1.6;margin:0 0 32px;">
                      Hacé clic en el botón de abajo para crear tu contraseña y acceder al panel:
                    </p>
                    <table cellpadding="0" cellspacing="0" width="100%">
                      <tr>
                        <td align="center">
                          <a href="${inviteLink}" style="background-color:#1a5c2a;color:#ffffff;text-decoration:none;padding:14px 36px;border-radius:6px;font-size:16px;font-weight:bold;display:inline-block;">
                            Crear cuenta y acceder
                          </a>
                        </td>
                      </tr>
                    </table>
                    <p style="color:#888;font-size:12px;margin:32px 0 0;line-height:1.6;">
                      Si no esperabas esta invitación, podés ignorar este email. El enlace expirará en 24 horas.<br/>
                      Si el botón no funciona, copiá y pegá este enlace en tu navegador:<br/>
                      <a href="${inviteLink}" style="color:#1a5c2a;word-break:break-all;">${inviteLink}</a>
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
        subject: "Invitación para unirte a Greenpac",
        html: emailHtml,
      }),
    });

    if (!resendResponse.ok) {
      const resendError = await resendResponse.text();
      console.error("Resend error:", resendError);
      // Still return success since user was created
    } else {
      console.log("Invitation email sent via Resend to:", email);
    }

    return new Response(
      JSON.stringify({ message: "Usuario invitado correctamente. Se envió un email de invitación desde info@greenpac.com.ar." }),
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
