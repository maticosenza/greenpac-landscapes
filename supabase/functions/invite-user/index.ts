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
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

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

    // Generate a magic link for setting password
    const { data: linkData, error: linkError } = await adminClient.auth.admin.generateLink({
      type: "magiclink",
      email,
      options: {
        data: {
          invited_role: role || "customer",
          full_name: email.split("@")[0],
        },
        redirectTo: "https://greenpac-landscapes.lovable.app/reset-password",
      },
    });

    if (linkError) {
      console.error("Generate link error:", linkError);
      return new Response(JSON.stringify({ error: linkError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const actionLink = linkData?.properties?.action_link;
    console.log("Generated action link for", email);

    // Assign role if specified
    if (role && (role === "employee" || role === "admin" || role === "vendedor") && linkData?.user) {
      await adminClient
        .from("user_roles")
        .insert({ user_id: linkData.user.id, role });
    }

    // Send branded email via Resend with the action link
    if (resendApiKey && actionLink) {
      const roleLabel = role === "admin" ? "Administrador" : role === "employee" ? "Empleado" : role === "vendedor" ? "Vendedor" : "Cliente";
      try {
        const resendRes = await fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${resendApiKey}`,
          },
          body: JSON.stringify({
            from: "GreenPac <info@greenpac.com.ar>",
            to: [email],
            subject: "Tu cuenta en GreenPac ha sido creada",
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
                <h2 style="color: #16a34a;">¡Bienvenido a GreenPac!</h2>
                <p>Se ha creado una cuenta para vos con el rol de <strong>${roleLabel}</strong>.</p>
                <p>Hacé clic en el siguiente botón para crear tu contraseña y activar tu cuenta:</p>
                <a href="${actionLink}" style="display: inline-block; background: #16a34a; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; margin-top: 12px; margin-bottom: 12px;">Crear mi contraseña</a>
                <p style="color: #6b7280; font-size: 13px;">Si el botón no funciona, copiá y pegá este enlace en tu navegador:</p>
                <p style="color: #6b7280; font-size: 12px; word-break: break-all;">${actionLink}</p>
                <p style="color: #6b7280; font-size: 12px; margin-top: 24px;">Si no solicitaste esta cuenta, podés ignorar este email.</p>
              </div>
            `,
          }),
        });
        const resendBody = await resendRes.text();
        console.log("Resend response:", resendRes.status, resendBody);
      } catch (emailError) {
        console.error("Error sending branded email:", emailError);
      }
    } else {
      console.log("Resend API key or action link missing. resendApiKey:", !!resendApiKey, "actionLink:", !!actionLink);
    }

    return new Response(
      JSON.stringify({ message: "Usuario invitado correctamente. Se envió un email para crear contraseña." }),
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