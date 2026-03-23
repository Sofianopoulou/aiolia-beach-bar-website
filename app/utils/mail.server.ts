import nodemailer from "nodemailer";

function requireEnv(name: string) {
  const v = process.env[name];
  if (!v) throw new Error(`Missing env var: ${name}`);
  return v;
}

function createTransporter() {
  const host = requireEnv("SMTP_HOST");
  const user = requireEnv("SMTP_USER");
  const pass = requireEnv("SMTP_PASS");
  const port = Number(process.env.SMTP_PORT);

  return {
    transporter: nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    } as any),
    user,
  };
}

// ─── RESERVATION EMAIL ─────────────────────────────────────────────────────

export async function sendReservationEmail(params: {
  name: string;
  date: string;
  time: string;
  people: string;
  tablePreference?: string;
  comments?: string;
}) {
  const { transporter, user } = createTransporter();

  const tablePreference = params.tablePreference?.trim() || "No preference";
  const comments = params.comments?.trim() || "No comments";

  const receivedAt = new Date().toLocaleString("el-GR", {
    timeZone: "Europe/Athens",
    dateStyle: "short",
    timeStyle: "short",
  });

  await transporter.sendMail({
    from: `Aiolia Beach Bar <${user}>`,
    to: "info@aiolia.gr",
    subject: `🍽️ New Reservation from ${params.name}`,
    replyTo: user,
    html: `
      <div style="font-family: Georgia, serif; max-width: 540px; margin: 0 auto; color: #2c2c2c;">

        <!-- Header -->
        <div style="background: #1a1a1a; padding: 28px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; color: #f5e6c8; font-size: 22px; letter-spacing: 0.05em;">
            🍹 Aiolia Beach Bar
          </h1>
          <p style="margin: 6px 0 0; color: #a89070; font-size: 13px;">
            New reservation received at ${receivedAt}
          </p>
        </div>

        <!-- Guest details -->
        <div style="background: #fffdf9; padding: 24px 32px; border: 1px solid #f0ece4; border-top: none;">
          <h3 style="margin: 0 0 16px; font-size: 14px; text-transform: uppercase;
                     letter-spacing: 0.08em; color: #888;">
            Guest Details
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
            <tr>
              <td style="padding: 8px 0; color: #888; width: 140px;">Name</td>
              <td style="padding: 8px 0; font-weight: bold;">${escapeHtml(
                params.name,
              )}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Date</td>
              <td style="padding: 8px 0;">${escapeHtml(params.date)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Time</td>
              <td style="padding: 8px 0;">${escapeHtml(params.time)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Guests</td>
              <td style="padding: 8px 0;">${escapeHtml(
                params.people,
              )} people</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; color: #888;">Table Preference</td>
              <td style="padding: 8px 0;">${escapeHtml(tablePreference)}</td>
            </tr>
          </table>
        </div>

        <!-- Comments -->
        <div style="background: #fffdf9; padding: 0 32px 24px; border: 1px solid #f0ece4; border-top: none;">
          <h3 style="margin: 0 0 10px; font-size: 14px; text-transform: uppercase;
                     letter-spacing: 0.08em; color: #888;">
            Comments
          </h3>
          <p style="margin: 0; font-size: 15px; color: #444; line-height: 1.6;
                    background: #f7f3ed; padding: 12px 16px; border-radius: 6px;">
            ${escapeHtml(comments)}
          </p>
        </div>

        <!-- Footer -->
        <div style="background: #1a1a1a; padding: 16px 32px; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #a89070; font-size: 13px;">🌊 Nea Anchialos, Greece</td>
              <td style="color: #f5e6c8; font-size: 13px; font-weight: bold;
                         text-align: right;">aiolia.gr</td>
            </tr>
          </table>
        </div>

      </div>
    `,
  });
}

// ─── ORDER EMAIL ────────────────────────────────────────────────────────────

export type OrderItem = {
  name: string;
  quantity: number;
  price: string;
  comment?: string;
};

export type OrderEmailParams =
  | {
      type: "dinein";
      tableNumber: string;
      items: OrderItem[];
      total: number;
    }
  | {
      type: "pickup";
      customerName: string;
      phone: string;
      items: OrderItem[];
      total: number;
    };

export async function sendOrderEmail(params: OrderEmailParams) {
  const { transporter, user } = createTransporter();

  const isPickup = params.type === "pickup";
  const orderTime = new Date().toLocaleString("el-GR", {
    timeZone: "Europe/Athens",
    dateStyle: "short",
    timeStyle: "short",
  });

  const itemRows = params.items
    .map(
      (item) => `
        <tr>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0ece4;">
  ${escapeHtml(item.name)}
  ${
    item.comment
      ? `<br/><span style="font-size: 12px; color: #a89070; font-style: italic;">📝 ${escapeHtml(
          item.comment,
        )}</span>`
      : ""
  }
</td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0ece4; text-align: center;">
            ${item.quantity}
          </td>
          <td style="padding: 8px 12px; border-bottom: 1px solid #f0ece4; text-align: right;">
            ${Number(item.price.replace("€", "")) * item.quantity}€
          </td>
        </tr>`,
    )
    .join("");

  const orderTypeBlock = isPickup
    ? `
      <tr>
        <td style="padding: 6px 0; color: #888;">Order Type</td>
        <td style="padding: 6px 0; font-weight: bold;">🥡 Pickup</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #888;">Name</td>
        <td style="padding: 6px 0;">${escapeHtml(params.customerName)}</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #888;">Phone</td>
        <td style="padding: 6px 0;">${escapeHtml(params.phone)}</td>
      </tr>`
    : `
      <tr>
        <td style="padding: 6px 0; color: #888;">Order Type</td>
        <td style="padding: 6px 0; font-weight: bold;">🪑 Dine-in</td>
      </tr>
      <tr>
        <td style="padding: 6px 0; color: #888;">Table</td>
        <td style="padding: 6px 0; font-weight: bold; font-size: 18px;">
          ${escapeHtml(params.tableNumber)}
        </td>
      </tr>`;

  const subject = isPickup
    ? `🥡 New Pickup Order — ${params.customerName}`
    : `🪑 New Order — Table ${params.tableNumber}`;

  await transporter.sendMail({
    from: `Aiolia Beach Bar <${user}>`,
    to: "info@aiolia.gr",
    subject,
    replyTo: user,
    html: `
      <div style="font-family: Georgia, serif; max-width: 540px; margin: 0 auto; color: #2c2c2c;">

        <!-- Header -->
        <div style="background: #1a1a1a; padding: 28px 32px; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; color: #f5e6c8; font-size: 22px; letter-spacing: 0.05em;">
            🍹 Aiolia Beach Bar
          </h1>
          <p style="margin: 6px 0 0; color: #a89070; font-size: 13px;">
            New order received at ${orderTime}
          </p>
        </div>

        <!-- Order info -->
        <div style="background: #fffdf9; padding: 24px 32px; border: 1px solid #f0ece4; border-top: none;">
          <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
            ${orderTypeBlock}
          </table>
        </div>

        <!-- Items table -->
        <div style="background: #fffdf9; padding: 0 32px 24px; border: 1px solid #f0ece4; border-top: none;">
          <h3 style="margin: 0 0 12px; font-size: 14px; text-transform: uppercase;
                     letter-spacing: 0.08em; color: #888;">
            Items Ordered
          </h3>
          <table style="width: 100%; border-collapse: collapse; font-size: 15px;">
            <thead>
              <tr style="background: #f7f3ed;">
                <th style="padding: 8px 12px; text-align: left; font-weight: 600;">Item</th>
                <th style="padding: 8px 12px; text-align: center; font-weight: 600;">Qty</th>
                <th style="padding: 8px 12px; text-align: right; font-weight: 600;">Price</th>
              </tr>
            </thead>
            <tbody>
              ${itemRows}
            </tbody>
          </table>
        </div>

        <!-- Total -->
        <div style="background: #1a1a1a; padding: 16px 32px; border-radius: 0 0 8px 8px;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="color: #a89070; font-size: 14px; text-transform: uppercase;
                         letter-spacing: 0.08em;">Total</td>
              <td style="color: #f5e6c8; font-size: 22px; font-weight: bold;
                         text-align: right;">${params.total}€</td>
            </tr>
          </table>
        </div>

      </div>
    `,
  });
}

// ─── UTILS ──────────────────────────────────────────────────────────────────

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
      }[c]!),
  );
}
