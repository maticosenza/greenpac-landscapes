import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface ContactRequest {
  name: string;
  email: string;
  phone?: string;
  message: string;
}

// Sanitize user input to prevent XSS attacks
// Strips all HTML tags and escapes special characters
function sanitizeInput(input: string): string {
  return input
    // Remove HTML tags
    .replace(/<[^>]*>/g, '')
    // Escape HTML entities
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    // Remove potential script injection patterns
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '')
    .trim();
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    
    // Create admin client for rate limiting (bypasses RLS)
    const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

    // Parse request body
    const body: ContactRequest = await req.json();
    const { name, email, phone, message } = body;

    console.log('Received contact form submission:', { name: name?.substring(0, 5) + '***', email: email?.substring(0, 5) + '***' });

    // Validate required fields
    if (!name || !email || !message) {
      console.log('Validation failed: missing required fields');
      return new Response(
        JSON.stringify({ error: 'Nombre, email y mensaje son obligatorios' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate email format
    const emailRegex = /^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/;
    if (!emailRegex.test(email)) {
      console.log('Validation failed: invalid email format');
      return new Response(
        JSON.stringify({ error: 'Formato de email inválido' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate field lengths
    if (name.length < 2 || name.length > 100) {
      return new Response(
        JSON.stringify({ error: 'El nombre debe tener entre 2 y 100 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (message.length < 1 || message.length > 2000) {
      return new Response(
        JSON.stringify({ error: 'El mensaje debe tener entre 1 y 2000 caracteres' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (phone && phone.length > 50) {
      return new Response(
        JSON.stringify({ error: 'El teléfono es demasiado largo' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check rate limit (5 requests per hour per email)
    const { data: canProceed, error: rateLimitError } = await supabaseAdmin.rpc('check_rate_limit', {
      p_identifier: email.toLowerCase(),
      p_action: 'contact_inquiry',
      p_max_requests: 5,
      p_window_minutes: 60
    });

    if (rateLimitError) {
      console.error('Rate limit check error:', rateLimitError);
      // Continue anyway if rate limit check fails
    } else if (!canProceed) {
      console.log('Rate limit exceeded for email');
      return new Response(
        JSON.stringify({ error: 'Demasiados intentos. Por favor, intentá de nuevo más tarde.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record this request for rate limiting
    await supabaseAdmin.rpc('record_rate_limit', {
      p_identifier: email.toLowerCase(),
      p_action: 'contact_inquiry'
    });

    // Sanitize all user inputs before storing
    const safeName = sanitizeInput(name);
    const safeEmail = email.toLowerCase().trim();
    const safePhone = phone ? sanitizeInput(phone) : null;
    const safeMessage = sanitizeInput(message);

    // Insert the contact inquiry with sanitized data
    const { error: insertError } = await supabaseAdmin
      .from('contact_inquiries')
      .insert({
        name: safeName,
        email: safeEmail,
        phone: safePhone,
        message: safeMessage,
        status: 'pending'
      });

    if (insertError) {
      console.error('Insert error:', insertError);
      return new Response(
        JSON.stringify({ error: 'Error al enviar el mensaje. Por favor, intentá de nuevo.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('Contact inquiry submitted successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Mensaje enviado correctamente' }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Error interno del servidor' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});