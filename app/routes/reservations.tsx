import { json, redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import nodemailer from "nodemailer";

type ActionData = {
  error?: string;
};

export const action = async ({ request }: any) => {
  const formData = await request.formData();
  const name = formData.get("name");
  const date = formData.get("date");
  const time = formData.get("time");
  const people = formData.get("people");
  const tablePreference = formData.get("tablePreference") || "No preference";
  const comments = formData.get("comments") || "No comments";

  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: true,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  try {
    await transporter.sendMail({
      from: `"Aiolia Beach Bar" <${process.env.SMTP_USER}>`,
      to: "info@aiolia.gr",
      subject: `New Reservation from ${name}`,
      html: `
        <h2>New Reservation</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>People:</strong> ${people}</p>
        <p><strong>Table Preference:</strong> ${tablePreference}</p>
        <p><strong>Comments:</strong> ${comments}</p>
      `,
    });

    return redirect("/reservation-success");
  } catch (error) {
    console.error("Email sending failed:", error);
    return json({ error: "Failed to send reservation email." }, 500);
  }
};

export default function ReservationForm() {
  const { t } = useTranslation();
  const actionData = useActionData<ActionData>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-lg m-8">
        {actionData?.error ? (
          <div className="text-center">
            <h3 className="text-2xl text-red-600 font-semibold mb-4">
              {t("Failed to submit reservation!")}
            </h3>
            <p className="text-gray-600">
              {t("Please call us on 24280 77424 for making your reservation.")}
            </p>
          </div>
        ) : (
          <form method="post" action="/reservations" className="space-y-5">
            <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
              {t("Make a Reservation")}
            </h2>

            <div>
              <label className="block text-gray-700 mb-2">{t("Date")}</label>
              <input
                type="date"
                name="date"
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">{t("Time")}</label>
              <input
                type="time"
                name="time"
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t("Number of People")}
              </label>
              <input
                type="number"
                name="people"
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="e.g. 2"
                required
                min="1"
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">{t("Name")}</label>
              <input
                type="text"
                name="name"
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Your Name"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t("Table Preference (Optional)")}
              </label>
              <select
                name="tablePreference"
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="">{t("Select preference")}</option>
                <option value="stand">Stand</option>
                <option value="lounge">Lounge</option>
                <option value="bar">Bar</option>
              </select>
            </div>

            <div>
              <label className="block text-gray-700 mb-2">
                {t("Comments (Optional)")}
              </label>
              <textarea
                name="comments"
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder={t("e.g. Sea view, birthday celebration...")}
              />
            </div>

            <div>
              <p className="block text-gray-650">
                {" "}
                {t(
                  "Table is kept for 15 minutes after reservation time. We appreciate you being on time."
                )}
              </p>
            </div>

            <button
              type="submit"
              className="w-full p-3 bg-[#f39c12] text-white rounded-md hover:bg-[#e67e22] transition-colors"
            >
              {t("Make Reservation")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
