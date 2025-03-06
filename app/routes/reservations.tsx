import { json, redirect } from "@remix-run/node";
import { Resend } from "resend";
import { useActionData } from "@remix-run/react";
import { useTranslation } from "react-i18next";

const resend = new Resend(process.env.RESEND_API_KEY);
const email = process.env.EMAIL as string;

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

  try {
    const { data, error } = await resend.emails.send({
      from: email,
      to: [email],
      subject: `New Reservation from ${name}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #ddd; border-radius: 10px;">
      <h1 style="color: #333; text-align: center;">New Reservation Details</h1>
      
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 10px 0;"><strong>Name:</strong></td>
          <td style="border-bottom: 1px solid #eee; padding: 10px 0;">${name}</td>
        </tr>
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 10px 0;"><strong>Date:</strong></td>
          <td style="border-bottom: 1px solid #eee; padding: 10px 0;">${date}</td>
        </tr>
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 10px 0;"><strong>Time:</strong></td>
          <td style="border-bottom: 1px solid #eee; padding: 10px 0;">${time}</td>
        </tr>
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 10px 0;"><strong>People:</strong></td>
          <td style="border-bottom: 1px solid #eee; padding: 10px 0;">${people}</td>
        </tr>
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 10px 0;"><strong>Table Preference:</strong></td>
          <td style="border-bottom: 1px solid #eee; padding: 10px 0;">${tablePreference}</td>
        </tr>
        <tr>
          <td style="border-bottom: 1px solid #eee; padding: 10px 0;"><strong>Comments:</strong></td>
          <td style="border-bottom: 1px solid #eee; padding: 10px 0;">${comments}</td>
        </tr>
      </table>

      <footer style="text-align: center; margin-top: 20px; font-size: 12px; color: #999;">
        <p>&copy; 2024 Aiolia Beach Bar</p>
      </footer>
    </div>
  `,
    });

    if (error) {
      console.error("Resend API error:", error);
      return json({ error }, 400);
    }

    return redirect("/reservation-success");
  } catch (error) {
    console.error("Catch block error:", error);
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
              Failed to submit reservation!
            </h3>
            <p className="text-gray-600">Please try again.</p>
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
