import { json, redirect } from "@remix-run/node";
import { Resend } from "resend";
import { useActionData } from "@remix-run/react";

const resend = new Resend(process.env.RESEND_API_KEY);

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
      from: "Restaurant <sofianopouloulia@gmail.com>",
      to: ["sofianopouloulia@gmail.com"],
      subject: `New Reservation from ${name}`,
      html: `
        <h1>New Reservation Details</h1>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Date:</strong> ${date}</p>
        <p><strong>Time:</strong> ${time}</p>
        <p><strong>People:</strong> ${people}</p>
        <p><strong>Table Preference:</strong> ${tablePreference}</p>
        <p><strong>Comments:</strong> ${comments}</p>
      `,
    });

    if (error) {
      return json({ error }, 400);
    }

    return redirect("/reservation-success");
  } catch (error) {
    return json({ error: "Failed to send reservation email." }, 500);
  }
};

export default function ReservationForm() {
  const actionData = useActionData<ActionData>();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white shadow-md rounded-lg p-8 w-full max-w-lg">
        {actionData?.error ? (
          <div className="text-center">
            <h3 className="text-2xl text-red-600 font-semibold mb-4">
              Failed to submit reservation!
            </h3>
            <p className="text-gray-600">Please try again.</p>
          </div>
        ) : (
          <form method="post" className="space-y-5">
            <h2 className="text-2xl font-semibold text-gray-800 text-center mb-6">
              Make a Reservation
            </h2>

            {/* Date */}
            <div>
              <label className="block text-gray-700 mb-2">Date</label>
              <input
                type="date"
                name="date"
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* Time */}
            <div>
              <label className="block text-gray-700 mb-2">Time</label>
              <input
                type="time"
                name="time"
                className="w-full p-3 border border-gray-300 rounded-md"
                required
              />
            </div>

            {/* People */}
            <div>
              <label className="block text-gray-700 mb-2">
                Number of People
              </label>
              <input
                type="number"
                name="people"
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="e.g. 2"
                required
              />
            </div>

            {/* Name */}
            <div>
              <label className="block text-gray-700 mb-2">Name</label>
              <input
                type="text"
                name="name"
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="Your Name"
                required
              />
            </div>

            {/* Table Preference (Optional) */}
            <div>
              <label className="block text-gray-700 mb-2">
                Table Preference (Optional)
              </label>
              <select
                name="tablePreference"
                className="w-full p-3 border border-gray-300 rounded-md"
              >
                <option value="">Select preference</option>
                <option value="stand">Stand</option>
                <option value="lounge">Lounge</option>
                <option value="bar">Bar</option>
              </select>
            </div>

            {/* Comments (Optional) */}
            <div>
              <label className="block text-gray-700 mb-2">
                Comments (Optional)
              </label>
              <textarea
                name="comments"
                className="w-full p-3 border border-gray-300 rounded-md"
                placeholder="e.g. Sea view, birthday celebration..."
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              className="w-full p-3 bg-[#f39c12] text-white rounded-md hover:bg-[#e67e22] transition-colors"
            >
              Make Reservation
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
