import { Resend } from 'resend';
import { NextResponse } from 'next/server';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request: Request) {
  try {
    const { email, confirmationLink } = await request.json();

    const { data, error } = await resend.emails.send({
      from: 'NaijaFind <no-reply@yourdomain.com>', // Use your verified domain later
      to: [email],
      subject: 'Confirm your NaijaFind account',
      html: `
        <h1>Welcome to NaijaFind!</h1>
        <p>Click the link below to confirm your email:</p>
        <a href="${confirmationLink}" style="background:#0066ff;color:white;padding:12px 24px;border-radius:8px;text-decoration:none;">Confirm Email</a>
        <p>If you didn't sign up, ignore this email.</p>
      `,
    });

    if (error) {
      console.error(error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    return NextResponse.json({ error: 'Failed to send email' }, { status: 500 });
  }
}