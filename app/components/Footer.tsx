import { Link } from "react-router";
import { useTranslation } from "react-i18next";

import fblogo from "../assets/facebook.png";
import iglogo from "../assets/instagram.png";
import ytlogo from "../assets/youtube.png";
import inlogo from "../assets/linkedin.png";
import spotifylogo from "../assets/spotify.png";

const socialLinks = [
  {
    href: "https://www.facebook.com/AIOLIA.VOLOS/?locale=el_GR",
    label: "Facebook",
    image: fblogo,
  },
  {
    href: "https://www.instagram.com/aioliabeach_bar/?hl=el",
    label: "Instagram",
    image: iglogo,
  },
  {
    href: "https://www.youtube.com/channel/UCHw0lwqdW_mCztKGQTP523A/featured",
    label: "YouTube",
    image: ytlogo,
  },
  {
    href: "https://www.linkedin.com/company/aiolia-beach-bar",
    label: "LinkedIn",
    image: inlogo,
  },
  {
    href: "https://open.spotify.com/artist/4Ei8T9JKi6vN7uQYMFhS8D/discography",
    label: "Spotify",
    image: spotifylogo,
  },
];

const footerLinkClass =
  "text-sm text-white/75 transition-colors hover:text-[#f39c12] focus-visible:text-[#f39c12]";

export default function Footer() {
  const { t } = useTranslation();

  const trackConversion = () => {
    if (typeof window !== "undefined" && window.gtag) {
      window.gtag("event", "conversion", {
        send_to: "AW-17830813564/vyAVCLKDxdcbEPy-srZC",
      });
    }
  };

  return (
    <footer className="bg-[#121212] text-[#ecf0f1]">
      <div className="mx-auto w-full max-w-screen-xl px-6 py-8 sm:px-8 sm:py-9">
        <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 md:grid-cols-[1.5fr_1fr_1fr] md:gap-10">
          <section aria-labelledby="footer-visit-heading">
            <h2
              id="footer-visit-heading"
              className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#f39c12]"
            >
              {t("Visit Us")}
            </h2>
            <a
              href="https://maps.app.goo.gl/qj4jiLdteJgvzTCa7"
              target="_blank"
              rel="noopener noreferrer"
              className={`${footerLinkClass} block leading-relaxed`}
              onClick={trackConversion}
            >
              {t("Zarifi 2, Nea Anchialos, Thessalía, Greece, 37400")}
            </a>
            <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
              <a
                href="tel:+302428077424"
                className={footerLinkClass}
                onClick={trackConversion}
              >
                24280 77424
              </a>
              <Link to="/reservations" className={footerLinkClass}>
                {t("Make a Reservation")}
              </Link>
            </div>
          </section>

          <nav aria-label={t("Explore Aiolia")}>
            <h2 className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#f39c12]">
              {t("Explore Aiolia")}
            </h2>
            <ul className="space-y-2">
              <li>
                <Link to="/menu" className={footerLinkClass}>
                  {t("Menu")}
                </Link>
              </li>
              <li>
                <Link to="/jobs" className={footerLinkClass}>
                  {t("Job Opportunities")}
                </Link>
              </li>
              <li>
                <a
                  href="https://www.tripadvisor.com.gr/Restaurant_Review-g4926604-d24108077-Reviews-Aiolia_Beach_Bar-Nea_Anchialos_Magnesia_Region_Thessaly.html"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerLinkClass}
                >
                  {t("Find us on TripAdvisor")}
                </a>
              </li>
              <li>
                <a
                  href="https://search.google.com/local/writereview?placeid=ChIJi1gmLb9CpxQRBTAEdeqJHsA&source=g.page.m.ia._&laa=nmx-review-solicitation-ia2"
                  target="_blank"
                  rel="noopener noreferrer"
                  className={footerLinkClass}
                >
                  {t("Rate us on Google")}
                </a>
              </li>
            </ul>
          </nav>

          <section aria-labelledby="footer-follow-heading">
            <h2
              id="footer-follow-heading"
              className="mb-3 text-xs font-semibold uppercase tracking-[0.16em] text-[#f39c12]"
            >
              {t("Follow Us")}
            </h2>
            <ul className="flex flex-wrap gap-3">
              {socialLinks.map(({ href, label, image }) => (
                <li key={label}>
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label={label}
                    className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 transition-colors hover:bg-white/20 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f39c12]"
                  >
                    <img src={image} alt="" className="h-7 w-7 object-contain" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        </div>

        <div className="mt-7 border-t border-white/15 pt-4 text-xs text-white/55">
          © {new Date().getFullYear()} Aiolia Beach Bar
        </div>
      </div>
    </footer>
  );
}
