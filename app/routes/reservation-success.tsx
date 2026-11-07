import { data } from "react-router";
import type { Route } from "./+types/reservation-success";
import { useTranslation } from "react-i18next";

const phoneNumber = "+302428077424";
const directionsUrl = "https://maps.app.goo.gl/qj4jiLdteJgvzTCa7";

export function loader({ request }: Route.LoaderArgs) {
  const search = new URL(request.url).searchParams;
  const rawDate = search.get("date") ?? "";
  const rawTime = search.get("time") ?? "";
  const rawPeople = search.get("people") ?? "";
  const parsedDate = /^\d{4}-\d{2}-\d{2}$/.test(rawDate)
    ? new Date(`${rawDate}T12:00:00`)
    : null;
  const validDate =
    parsedDate &&
    !Number.isNaN(parsedDate.getTime()) &&
    parsedDate.toISOString().slice(0, 10) === rawDate
      ? rawDate
      : "";

  return data({
    date: validDate,
    time: /^\d{2}:\d{2}$/.test(rawTime) ? rawTime : "",
    people: /^\d{1,2}$/.test(rawPeople) ? rawPeople : "",
  });
}

export default function ReservationSuccess({ loaderData }: Route.ComponentProps) {
  const { t, i18n } = useTranslation();
  const reservationDetails = loaderData ?? { date: "", time: "", people: "" };
  const hasDetails = Boolean(
    reservationDetails.date || reservationDetails.time || reservationDetails.people,
  );
  const formattedDate = reservationDetails.date
    ? new Intl.DateTimeFormat(i18n.resolvedLanguage || "en", {
        weekday: "long",
        day: "numeric",
        month: "long",
      }).format(new Date(`${reservationDetails.date}T12:00:00`))
    : "";

  return (
    <div className="bg-[#f5f3ec] px-4 pb-16 pt-8 sm:px-6 sm:pt-12">
      <div className="mx-auto max-w-4xl overflow-hidden rounded-[28px] bg-white shadow-[0_24px_70px_rgba(30,65,66,0.12)]">
        <div className="relative flex min-h-56 items-end justify-center overflow-hidden bg-[#1c4d55] px-6 pb-8 pt-20 text-center sm:min-h-64 sm:pb-10">
          <img
            src="/reservation-success.jpg"
            alt={t("Aiolia Beach Bar's warmly lit wooden terrace at night")}
            className="absolute inset-0 h-full w-full object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[#102f35]/80 via-[#102f35]/25 to-[#102f35]/15" />
          <div className="relative z-10 max-w-2xl text-white">
            <span className="inline-flex rounded-full border border-white/35 bg-white/15 px-3 py-1 text-xs font-semibold tracking-wide backdrop-blur-sm">
              {t("Nea Anchialos | Volos")}
            </span>
            <p className="mt-4 font-serif text-2xl font-semibold leading-tight sm:text-3xl">
              {t("Sunset views, handcrafted cocktails, and relaxed seaside vibes await you in Nea Anchialos.")}
            </p>
          </div>
        </div>

        <div className="px-5 pb-8 sm:px-10 sm:pb-10">
          <section className="mx-auto max-w-2xl text-center" aria-labelledby="success-heading">
            <div className="relative mx-auto -mt-7 mb-4 grid h-14 w-14 place-items-center rounded-full border-4 border-white bg-[#fff1e5] text-[#bd6339] shadow-sm" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6" stroke="currentColor" strokeWidth="2.5">
                <path d="m5 12 4 4L19 6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-[var(--accent)]">
              {t("RESERVATION CONFIRMED")}
            </p>
            <h1 id="success-heading" className="mt-2 font-serif text-3xl font-semibold leading-tight text-[#183b46] sm:text-4xl">
              {t("Your table is reserved")}
            </h1>
            <p className="mx-auto mt-3 max-w-xl text-base leading-7 text-[#587075]">
              {t("We have received your reservation and cannot wait to welcome you at")} <strong>Aiolia Beach Bar</strong>.
            </p>
          </section>

          {hasDetails && (
            <section className="mx-auto mt-7 max-w-2xl rounded-2xl border border-[#e4e9e5] bg-[#f7f8f4] px-5 py-4 sm:px-7" aria-label={t("Reservation details")}>
              <h2 className="mb-3 text-center text-xs font-bold uppercase tracking-[0.14em] text-[#718184]">
                {t("Reservation details")}
              </h2>
              <dl className="grid grid-cols-1 gap-4 text-center sm:grid-cols-3 sm:gap-2">
                {formattedDate && (
                  <div className="sm:border-r sm:border-[#dfe6e1]">
                    <dt className="text-xs text-[#718184]">{t("Date")}</dt>
                    <dd className="mt-1 font-semibold text-[#183b46]">{formattedDate}</dd>
                  </div>
                )}
                {reservationDetails.time && (
                  <div className="sm:border-r sm:border-[#dfe6e1]">
                    <dt className="text-xs text-[#718184]">{t("Time")}</dt>
                    <dd className="mt-1 font-semibold text-[#183b46]">{reservationDetails.time}</dd>
                  </div>
                )}
                {reservationDetails.people && (
                  <div>
                    <dt className="text-xs text-[#718184]">{t("Number of People")}</dt>
                    <dd className="mt-1 font-semibold text-[#183b46]">{reservationDetails.people}</dd>
                  </div>
                )}
              </dl>
            </section>
          )}

          <div className="mx-auto mt-6 max-w-2xl rounded-2xl bg-[#f5f3ec] px-5 py-4 text-center text-sm leading-6 text-[#587075] sm:px-7">
            <p>
              {t("Your table will be held for 15 minutes after your reservation time. If you're running late, feel free to call us on")} {" "}
              <a href={`tel:${phoneNumber}`} className="font-bold text-[#183b46] underline decoration-[#bd6339] underline-offset-2 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d7a83]">
                24280 77424
              </a>
              . {t("Otherwise, just come along and enjoy your visit.")}
            </p>
          </div>

          <nav className="mx-auto mt-7 flex max-w-2xl flex-col justify-center gap-3 sm:flex-row" aria-label={t("Next steps")}>
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex min-h-12 items-center justify-center rounded-full bg-[var(--accent)] px-6 py-3 text-sm font-bold text-white transition hover:brightness-95 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--accent)]"
            >
              {t("Get directions")}
            </a>
            <a
              href="/menu"
              className="inline-flex min-h-12 items-center justify-center rounded-full border border-[#cbd8d5] px-6 py-3 text-sm font-bold text-[#24444b] transition hover:bg-[#f7f8f4] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#1d7a83]"
            >
              {t("Take a look at the menu")}
            </a>
          </nav>
          <p className="mt-5 text-center text-sm font-semibold text-[#587075]">
            {t("See you by the sea")} · <a href="/" className="underline decoration-[#bd6339] underline-offset-2">{t("Back to home")}</a>
          </p>
        </div>
      </div>
    </div>
  );
}
