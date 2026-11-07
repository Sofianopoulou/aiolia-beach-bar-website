import { data, redirect, useActionData } from "react-router";
import { useTranslation } from "react-i18next";
import { sendReservationEmail } from "~/utils/mail.server";
import type { Route } from "./+types/reservations";
import beachBar from "~/assets/beach-bar.webp";

type ReservationFields = {
  name: string;
  date: string;
  time: string;
  people: string;
  tablePreference: string;
  comments: string;
};

type ActionData = { error?: string; values?: ReservationFields };

const emptyFields: ReservationFields = {
  name: "",
  date: "",
  time: "",
  people: "",
  tablePreference: "",
  comments: "",
};

export const action = async ({ request }: Route.ActionArgs) => {
  const formData = await request.formData();
  const values: ReservationFields = {
    name: String(formData.get("name") ?? "").trim(),
    date: String(formData.get("date") ?? "").trim(),
    time: String(formData.get("time") ?? "").trim(),
    people: String(formData.get("people") ?? "").trim(),
    tablePreference: String(formData.get("tablePreference") ?? "").trim(),
    comments: String(formData.get("comments") ?? "").trim(),
  };

  if (!values.name || !values.date || !values.time || !values.people) {
    return data<ActionData>(
      { error: "Missing required fields.", values },
      { status: 400 },
    );
  }

  try {
    await sendReservationEmail(values);
    const confirmationDetails = new URLSearchParams({
      date: values.date,
      time: values.time,
      people: values.people,
    });
    return redirect(`/reservation-success?${confirmationDetails.toString()}`);
  } catch (error) {
    console.error("Email sending failed:", error);
    return data<ActionData>(
      { error: "Failed to send reservation email.", values },
      { status: 500 },
    );
  }
};

const fieldClass =
  "mt-2 min-h-12 w-full rounded-xl border border-[#d7e0df] bg-white px-4 py-3 text-[15px] text-[#183b46] outline-none transition placeholder:text-[#87969a] focus:border-[#1d7a83] focus:ring-4 focus:ring-[#1d7a83]/10";

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string;
  htmlFor: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label
        htmlFor={htmlFor}
        className="block text-sm font-semibold text-[#24444b]"
      >
        {label}
      </label>
      {children}
    </div>
  );
}

export default function ReservationForm() {
  const { t } = useTranslation("common");
  const actionData = useActionData<ActionData>();
  const values = actionData?.values ?? emptyFields;

  return (
    <div className="bg-[#f5f3ec] px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 text-center sm:mb-10">
          <p className="mb-3 text-xs font-bold uppercase tracking-[0.22em] text-[var(--accent)]">
            {t("A little seaside time")}
          </p>
          <h1 className="font-serif text-4xl font-semibold tracking-tight text-[#183b46] sm:text-5xl">
            {t("Your table by the sea is waiting")}
          </h1>
          <p className="mx-auto mt-4 max-w-xl text-base leading-7 text-[#587075] sm:text-lg">
            {t("Choose a day, bring your favorite people, and we’ll take care of the rest.")}
          </p>
        </div>

        <div className="grid overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(30,65,66,0.12)] lg:grid-cols-[0.88fr_1.12fr]">
          <aside className="relative min-h-[280px] overflow-hidden bg-[#1c4d55] lg:min-h-full">
            <img
              src={beachBar}
              alt={t("Aiolia Beach Bar's warmly lit wooden terrace at night")}
              className="absolute inset-0 h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#102f35]/90 via-[#102f35]/20 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 p-7 text-white sm:p-9">
              <span className="mb-4 inline-flex rounded-full border border-white/35 bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
                {t("NEA ANCHIALOS · VOLOS")}
              </span>
              <h2 className="max-w-sm font-serif text-3xl font-semibold leading-tight sm:text-4xl">
                {t("Good food. Sea breeze. Your people.")}
              </h2>
              <p className="mt-3 max-w-sm text-sm leading-6 text-white/85">
                {t("Make room for a slow lunch, a golden-hour drink, or a long evening together.")}
              </p>
              <a
                href="tel:+302428077424"
                className="mt-6 inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-2.5 text-sm font-semibold text-white ring-1 ring-white/35 transition hover:bg-white/25 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
              >
                <span aria-hidden="true">☎</span>
                {t("Prefer to call?")} <span>24280 77424</span>
              </a>
            </div>
          </aside>

          <section className="p-5 sm:p-8 lg:p-10" aria-labelledby="booking-heading">
            <div className="mb-6 flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em] text-[var(--accent)]">
                  {t("LET’S PLAN YOUR VISIT")}
                </p>
                <h2
                  id="booking-heading"
                  className="mt-2 font-serif text-3xl font-semibold text-[#183b46]"
                >
                  {t("Make a Reservation")}
                </h2>
              </div>
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-2xl bg-[#f7eee5] text-2xl" aria-hidden="true">
                ☀
              </span>
            </div>

            {actionData?.error && (
              <div
                role="alert"
                className="mb-5 rounded-2xl border border-[#e8c8b4] bg-[#fff6ef] px-4 py-3 text-sm leading-6 text-[#7c442d]"
              >
                <p className="font-semibold">{t("We couldn’t send that just yet.")}</p>
                <p>{t("Your details are still here. Please try again, or call us and we’ll be happy to help.")}</p>
              </div>
            )}

            <form method="post" action="/reservations">
              <fieldset className="m-0 border-0 p-0">
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                  <Field label={t("Date")} htmlFor="date">
                    <input id="date" type="date" name="date" required className={fieldClass} defaultValue={values.date} />
                  </Field>
                  <Field label={t("Time")} htmlFor="time">
                    <input id="time" type="time" name="time" required className={fieldClass} defaultValue={values.time} />
                  </Field>
                  <Field label={t("Number of People")} htmlFor="people">
                    <input id="people" type="number" name="people" required min={1} max={30} inputMode="numeric" placeholder={t("e.g. 2")} className={fieldClass} defaultValue={values.people} />
                  </Field>
                </div>
              </fieldset>

              <div className="mt-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={t("Name")} htmlFor="name">
                  <input id="name" type="text" name="name" autoComplete="name" required placeholder={t("Your name")} className={fieldClass} defaultValue={values.name} />
                </Field>
                <Field label={t("Table Preference (Optional)")} htmlFor="tablePreference">
                  <select id="tablePreference" name="tablePreference" className={fieldClass} defaultValue={values.tablePreference}>
                    <option value="">{t("Select preference")}</option>
                    <option value="stand">{t("Table")}</option>
                    <option value="lounge">{t("Lounge")}</option>
                    <option value="bar">{t("Bar")}</option>
                  </select>
                </Field>
              </div>

              <div className="mt-5">
                <Field label={t("Anything we should know? (Optional)")} htmlFor="comments">
                  <textarea
                    id="comments"
                    name="comments"
                    rows={3}
                    placeholder={t("A sea-view wish, a birthday, or anything that would make your visit special…")}
                    className={`${fieldClass} min-h-24 resize-y`}
                    defaultValue={values.comments}
                  />
                </Field>
              </div>

              <div className="mt-5 flex gap-3 rounded-2xl bg-[#f3f7f5] p-4 text-sm leading-6 text-[#49666a]">
                <span className="mt-0.5 text-lg" aria-hidden="true">✦</span>
                <p>{t("We’ll hold your table for 15 minutes after your reservation time. Running late? Give us a call and we’ll do our best to help.")}</p>
              </div>

              <button
                type="submit"
                className="mt-6 flex min-h-14 w-full items-center justify-center gap-2 rounded-full bg-[var(--accent)] px-6 py-3 text-base font-bold text-white shadow-[0_8px_20px_rgba(250,153,79,0.28)] transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
              >
                {t("Make Reservation")} <span aria-hidden="true">→</span>
              </button>
              <p className="mt-3 text-center text-xs leading-5 text-[#718184]">
                {t("Your request goes straight to our team. We can’t wait to welcome you.")}
              </p>
            </form>
          </section>
        </div>
      </div>
    </div>
  );
}
