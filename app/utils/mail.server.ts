import nodemailer from "nodemailer";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

export async function sendReservationEmail(params: {
  name: string;
  date: string;
  time: string;
  people: string;
  tablePreference?: string;
  comments?: string;
}) {
  const host = requireEnv("SMTP_HOST");
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");
  const port = Number(process.env.SMTP_PORT);

  const transporter = nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // IMPORTANT: true only for 465
    auth: { user, pass },
    //TLS: undefined,
  } as any);

  // Debugging:
  // await transporter.verify();

  const tablePreference = params.tablePreference?.trim() || "No preference";
  const comments = params.comments?.trim() || "No comments";

  await transporter.sendMail({
    from: `Aiolia Beach Bar <${user}>`,
    to: "info@aiolia.gr",
    subject: `New Reservation from ${params.name}`,
    replyTo: user, // if you later add customer's email, set replyTo to that
    html: `
      <h2>New Reservation</h2>
      <p><strong>Name:</strong> ${escapeHtml(params.name)}</p>
      <p><strong>Date:</strong> ${escapeHtml(params.date)}</p>
      <p><strong>Time:</strong> ${escapeHtml(params.time)}</p>
      <p><strong>People:</strong> ${escapeHtml(params.people)}</p>
      <p><strong>Table Preference:</strong> ${escapeHtml(tablePreference)}</p>
      <p><strong>Comments:</strong> ${escapeHtml(comments)}</p>
    `,
  });
}

// tiny sanitizer to avoid HTML injection
function escapeHtml(s: string) {
  return s.replace(
    /[&<>"']/g,
    (c) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#039;",
      }[c]!)
  );
}
