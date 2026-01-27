import { json, redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { sendReservationEmail } from "~/utils/mail.server";

type ActionData = { error?: string };

export const action = async ({ request }: any) => {
  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const people = String(formData.get("people") ?? "").trim();
  const tablePreference = String(formData.get("tablePreference") ?? "").trim();
  const comments = String(formData.get("comments") ?? "").trim();

  if (!name || !date || !time || !people) {
    return json<ActionData>(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  try {
    await sendReservationEmail({
      name,
      date,
      time,
      people,
      tablePreference,
      comments,
    });

    return redirect("/reservation-success");
  } catch (error) {
    console.error("Email sending failed:", error);
    return json<ActionData>(
      { error: "Failed to send reservation email." },
      { status: 500 }
    );
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
