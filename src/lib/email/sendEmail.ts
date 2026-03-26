import { Resend } from "resend";
import { getEnv } from "@/lib/env";

export async function sendEmail(input: {
  to: string;
  subject: string;
  text: string;
  html?: string;
}) {
  const resendApiKey = getEnv("RESEND_API_KEY");
  const from = getEnv("EMAIL_FROM");

  const resend = new Resend(resendApiKey);

  await resend.emails.send({
    from,
    to: input.to,
    subject: input.subject,
    text: input.text,
    html: input.html,
  });
}

