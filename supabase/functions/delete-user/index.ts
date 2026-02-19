import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface DeleteUserRequest {
  userId: string;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Get the authorization header to verify the caller
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("No authorization header");
    }

    // Create a client with the user's token to verify they have admin/employee role
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // User client to verify permissions
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    // Get the current user
    const { data: { user: caller }, error: authError } = await userClient.auth.getUser();
    if (authError || !caller) {
      throw new Error("Unauthorized");
    }

    // Check if caller has admin or employee role
    const { data: roles, error: rolesError } = await userClient
      .from("user_roles")
      .select("role")
      .eq("user_id", caller.id);

    if (rolesError) {
      throw new Error("Error checking roles");
    }

    const userRoles = roles?.map(r => r.role) || [];
    const isStaff = userRoles.includes("admin") || userRoles.includes("employee");

    if (!isStaff) {
      throw new Error("Forbidden: Only admin or employee can delete users");
    }

    // Get the user ID to delete from the request
    const { userId }: DeleteUserRequest = await req.json();

    if (!userId) {
      throw new Error("User ID is required");
    }

    // Prevent deleting yourself
    if (userId === caller.id) {
      throw new Error("No podés eliminar tu propia cuenta");
    }

    // Create admin client to delete the user
    const adminClient = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // Check if the user to delete is an admin (protect admin accounts)
    const { data: targetRoles } = await adminClient
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);

    const targetUserRoles = targetRoles?.map(r => r.role) || [];
    
    // Only admins can delete other admins
    if (targetUserRoles.includes("admin") && !userRoles.includes("admin")) {
      throw new Error("Solo los administradores pueden eliminar otros administradores");
    }

    // Delete user from auth.users (this will cascade to profiles and user_roles due to ON DELETE CASCADE)
    const { error: deleteError } = await adminClient.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Error deleting user:", deleteError);
      throw new Error("Error al eliminar el usuario");
    }

    return new Response(
      JSON.stringify({ success: true, message: "Usuario eliminado correctamente" }),
      {
        status: 200,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  } catch (error: any) {
    console.error("Error in delete-user function:", error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: error.message === "Unauthorized" || error.message === "Forbidden" ? 403 : 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );
  }
});
