import { NextResponse } from 'next/server';
import { Resend } from 'resend';
import { getAdminAuth } from '@/lib/firebaseAdmin';

interface ResetRequestBody {
  email?: string;
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

function isUserNotFoundError(error: unknown): boolean {
  const code = (error as { code?: string })?.code || '';
  return code === 'auth/user-not-found';
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as ResetRequestBody;
    const email = body.email?.trim().toLowerCase() || '';

    if (!email || !isValidEmail(email)) {
      return NextResponse.json(
        { success: false, error: 'Zadejte platný email.' },
        { status: 400 }
      );
    }

    const resendApiKey = process.env.RESEND_API_KEY;
    const resendFromEmail = process.env.RESEND_FROM_EMAIL;
    const appBaseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const adminProjectId = process.env.FIREBASE_ADMIN_PROJECT_ID;
    const adminClientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL;
    const adminPrivateKey = process.env.FIREBASE_ADMIN_PRIVATE_KEY;

    if (!resendApiKey || !resendFromEmail) {
      return NextResponse.json(
        {
          success: false,
          error: 'Email provider není nakonfigurován. Nastavte RESEND_API_KEY a RESEND_FROM_EMAIL.',
        },
        { status: 500 }
      );
    }

    if (!adminProjectId || !adminClientEmail || !adminPrivateKey) {
      return NextResponse.json(
        {
          success: false,
          error:
            'Firebase Admin není nakonfigurován. Nastavte FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL a FIREBASE_ADMIN_PRIVATE_KEY.',
        },
        { status: 500 }
      );
    }

    const adminAuth = getAdminAuth();

    const resetLink = await adminAuth.generatePasswordResetLink(email, {
      url: `${appBaseUrl}/prihlaseni`,
      handleCodeInApp: false,
    });

    const resend = new Resend(resendApiKey);

    const emailResult = await resend.emails.send({
      from: resendFromEmail,
      to: email,
      subject: 'Obnova hesla - Krouzky HB',
      html: `
        <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #0f172a;">
          <h2 style="margin-bottom: 12px;">Obnova hesla</h2>
          <p>Požádali jste o obnovení hesla pro účet na Krouzky HB.</p>
          <p>
            <a
              href="${resetLink}"
              style="display:inline-block;padding:10px 16px;background:#0f766e;color:#ffffff;text-decoration:none;border-radius:8px;font-weight:600;"
            >
              Nastavit nové heslo
            </a>
          </p>
          <p>Pokud jste o obnovu hesla nežádali, tento email ignorujte.</p>
          <p style="font-size: 12px; color: #64748b;">Odkaz je časově omezený.</p>
        </div>
      `,
    });

    if (emailResult.error) {
      console.error('Resend send error:', emailResult.error);
      return NextResponse.json(
        {
          success: false,
          error: 'Email se nepodařilo odeslat. Zkuste to prosím znovu za chvíli.',
        },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    if (isUserNotFoundError(error)) {
      return NextResponse.json({ success: true });
    }

    console.error('Password reset API error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Reset hesla se nepodařilo odeslat. Zkontrolujte nastavení emailu a Firebase Admin.',
      },
      { status: 500 }
    );
  }
}
