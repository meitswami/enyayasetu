import { serve } from "https://deno.land/std@0.190.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

interface EmailRequest {
  action: 'check-config' | 'save-config' | 'test' | 'send-verification-status';
  apiKey?: string;
  email?: string;
  recipientName?: string;
  verificationStatus?: 'approved' | 'rejected';
  caseNumber?: string;
  adminNotes?: string;
}

async function sendEmail(apiKey: string, to: string[], subject: string, html: string) {
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'eNyayaSetu <onboarding@resend.dev>',
      to,
      subject,
      html,
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.message || 'Failed to send email');
  }
  
  return response.json();
}

const handler = async (req: Request): Promise<Response> => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body: EmailRequest = await req.json();
    const { action, apiKey, email, recipientName, verificationStatus, caseNumber, adminNotes } = body;

    console.log(`Processing email action: ${action}`);

    // Get the API key from environment
    const resendApiKey = Deno.env.get("RESEND_API_KEY");

    // Check configuration status
    if (action === 'check-config') {
      return new Response(
        JSON.stringify({ configured: !!resendApiKey }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Save new API key (validate format)
    if (action === 'save-config') {
      if (!apiKey || !apiKey.startsWith('re_')) {
        return new Response(
          JSON.stringify({ error: 'Invalid Resend API key format. It should start with "re_"' }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      console.log('API key format validated successfully');
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'API key validated. Please add RESEND_API_KEY to your Supabase secrets.' 
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // For all other actions, we need the API key configured
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'Email service not configured. Please add RESEND_API_KEY to secrets.' }),
        {
          status: 503,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send test email
    if (action === 'test') {
      if (!email) {
        return new Response(
          JSON.stringify({ error: 'Email address required' }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const emailResponse = await sendEmail(
        resendApiKey,
        [email],
        "Test Email from eNyayaSetu",
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #333;">✅ Email Configuration Successful!</h1>
            <p>This is a test email from eNyayaSetu. Your email notifications are now configured correctly.</p>
            <hr style="border: 1px solid #eee; margin: 20px 0;">
            <p style="color: #666; font-size: 12px;">eNyayaSetu - Digital Justice Platform</p>
          </div>
        `
      );

      console.log("Test email sent:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, emailId: emailResponse.id }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    // Send verification status email
    if (action === 'send-verification-status') {
      if (!email || !recipientName || !verificationStatus) {
        return new Response(
          JSON.stringify({ error: 'Missing required fields' }),
          {
            status: 400,
            headers: { "Content-Type": "application/json", ...corsHeaders },
          }
        );
      }

      const isApproved = verificationStatus === 'approved';
      const statusColor = isApproved ? '#22c55e' : '#ef4444';
      const statusText = isApproved ? 'Approved' : 'Rejected';
      const statusEmoji = isApproved ? '✅' : '❌';

      const emailResponse = await sendEmail(
        resendApiKey,
        [email],
        `${statusEmoji} Identity Verification ${statusText} - eNyayaSetu`,
        `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f9fafb; border-radius: 8px;">
            <div style="background: white; padding: 30px; border-radius: 8px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
              <h1 style="color: #333; margin-bottom: 20px;">Identity Verification Update</h1>
              
              <p style="font-size: 16px; color: #333;">Dear <strong>${recipientName}</strong>,</p>
              
              <div style="background: ${statusColor}15; border-left: 4px solid ${statusColor}; padding: 15px; margin: 20px 0; border-radius: 4px;">
                <p style="margin: 0; font-size: 18px;">
                  <span style="font-size: 24px;">${statusEmoji}</span>
                  Your identity verification has been <strong style="color: ${statusColor};">${statusText}</strong>
                </p>
              </div>

              ${caseNumber ? `<p style="color: #666;"><strong>Case Reference:</strong> ${caseNumber}</p>` : ''}
              
              ${adminNotes ? `
                <div style="background: #f3f4f6; padding: 15px; border-radius: 4px; margin: 20px 0;">
                  <p style="margin: 0; color: #666;"><strong>Admin Notes:</strong></p>
                  <p style="margin: 5px 0 0 0; color: #333;">${adminNotes}</p>
                </div>
              ` : ''}

              ${isApproved ? `
                <p style="color: #333;">You now have access to the case details. Please log in to your eNyayaSetu account to view the information.</p>
              ` : `
                <p style="color: #333;">If you believe this decision was made in error, please contact our support team or submit a new verification request with the correct documents.</p>
              `}

              <hr style="border: 1px solid #eee; margin: 30px 0 20px;">
              
              <p style="color: #999; font-size: 12px;">
                This is an automated message from eNyayaSetu Digital Justice Platform.<br>
                Please do not reply to this email.
              </p>
            </div>
          </div>
        `
      );

      console.log("Verification status email sent:", emailResponse);

      return new Response(
        JSON.stringify({ success: true, emailId: emailResponse.id }),
        {
          status: 200,
          headers: { "Content-Type": "application/json", ...corsHeaders },
        }
      );
    }

    return new Response(
      JSON.stringify({ error: 'Invalid action' }),
      {
        status: 400,
        headers: { "Content-Type": "application/json", ...corsHeaders },
      }
    );

  } catch (error: any) {
    console.error("Error in send-verification-email function:", error);
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
