import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_EMAIL_KEY);

export const sendEmail = async (to, subject, html) => {
  const { data, error } = await resend.emails.send({
    from: "ProCodeReview <onboarding@resend.dev>",
    to: to,
    subject: subject,
    html: html,
  });

  if (error) {
    return console.error({ error });
  }
  console.log({ data });
};
