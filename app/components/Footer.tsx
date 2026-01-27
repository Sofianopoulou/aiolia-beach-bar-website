import React from "react";
import { Link } from "@remix-run/react";
import { useTranslation } from "react-i18next";

import fblogo from "../assets/facebook.png";
import iglogo from "../assets/instagram.png";
import ytlogo from "../assets/youtube.png";
import inlogo from "../assets/linkedin.png";

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
    <footer className="bg-[#121212] text-[#ecf0f1] py-10 flex justify-center">
      <div className="max-w-screen-xl w-full flex flex-col gap-8">
        <div className="flex justify-between flex-col md:flex-row">
          {/* Contact Information Section */}
          <div className="flex-1 px-5 min-w-[200px]">
            <h4 className="text-lg mb-4 text-[#f39c12]">{t("Contact Us")}</h4>
            <p className="mb-3">
              📍{" "}
              <a
                href="https://maps.app.goo.gl/qj4jiLdteJgvzTCa7"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#f39c12]"
                onClick={trackConversion}
              >
                {t("Zarifi 2, Nea Anchialos, Thessalía, Greece, 37400")}
              </a>
            </p>
            <p className="mb-3">
              📅{" "}
              <Link to="/reservations" className="hover:text-[#f39c12]">
                {t("Make a Reservation")}
              </Link>
            </p>
            <p className="mb-3">
              🌐{" "}
              <a
                href="https://www.tripadvisor.com.gr/Restaurant_Review-g4926604-d24108077-Reviews-Aiolia_Beach_Bar-Nea_Anchialos_Magnesia_Region_Thessaly.html"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#f39c12]"
              >
                {t("Find us on TripAdvisor")}
              </a>
            </p>
            <p className="mb-3">
              ⭐{" "}
              <a
                href="https://search.google.com/local/writereview?placeid=ChIJi1gmLb9CpxQRBTAEdeqJHsA&source=g.page.m.ia._&laa=nmx-review-solicitation-ia2"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#f39c12]"
              >
                {t("Rate us on Google")}
              </a>
            </p>

            <p className="mb-3">
              🌊{" "}
              <Link to="/jobs" className="hover:text-[#f39c12]">
                {t("Job Opportunities")}
              </Link>
            </p>
            <a
              href="tel:+302428077424"
              className="hover:text-[#f39c12]"
              onClick={trackConversion}
            >
              📞 2428077424
            </a>
          </div>

          {/* Social Media Section */}
          <div className="flex-1 px-5 min-w-[200px]">
            <h4 className="text-lg mb-4 text-[#f39c12]">{t("Follow Us")}</h4>
            <div className="flex gap-4 pb-4">
              <a
                href="https://www.facebook.com/AIOLIA.VOLOS/?locale=el_GR"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <img src={fblogo} alt="Facebook" className="w-8 h-8" />
              </a>
              <a
                href="https://www.instagram.com/aioliabeach_bar/?hl=el"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <img src={iglogo} alt="Instagram" className="w-8 h-8" />
              </a>
              <a
                href="https://www.youtube.com/channel/UCHw0lwqdW_mCztKGQTP523A/featured"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <img src={ytlogo} alt="YouTube" className="w-8 h-8" />
              </a>
              <a
                href="https://www.linkedin.com/company/aiolia-beach-bar"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:scale-110 transition-transform"
              >
                <img src={inlogo} alt="LinkedIn" className="w-8 h-8" />
              </a>
            </div>
          </div>

          {/* Mailing List Section */}
          <div className="flex-1 px-5 min-w-[200px]">
            <h4 className="text-lg mb-4 text-[#f39c12]">
              {t("Join Our Mailing List")}
            </h4>
            <p className="mb-3">
              {t("Subscribe to get the latest updates and offers.")}
            </p>
            <form
              action="/subscribe"
              method="post"
              className="flex flex-col gap-3"
            >
              <input
                type="email"
                name="email"
                placeholder={t("Enter your email")}
                required
                className="p-3 rounded-md text-black"
              />
              <button
                type="submit"
                className="p-3 bg-[#f39c12] rounded-md text-white hover:bg-[#e67e22] transition-colors"
              >
                {t("Subscribe")}
              </button>
            </form>
          </div>
        </div>

        <div className="w-full text-center text-sm mt-6">
          &copy; 2026 Aiolia Beach Bar
        </div>
      </div>
    </footer>
  );
}
