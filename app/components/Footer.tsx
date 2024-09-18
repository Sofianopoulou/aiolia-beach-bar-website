import React from "react";
import { Link } from "@remix-run/react";

import fblogo from "../assets/facebook.png";
import iglogo from "../assets/instagram.png";
import ytlogo from "../assets/youtube.png";

export default function Footer() {
  return (
    <footer className="bg-[#121212] text-[#ecf0f1] py-10 flex justify-center">
      <div className="max-w-screen-xl w-full flex flex-col gap-8">
        <div className="flex justify-between flex-col md:flex-row">
          {/* Contact Information Section */}
          <div className="flex-1 px-5 min-w-[200px]">
            <h4 className="text-lg mb-4 text-[#f39c12]">Contact Us</h4>
            <p className="mb-3">
              📍{" "}
              <a
                href="https://maps.app.goo.gl/qj4jiLdteJgvzTCa7"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-[#f39c12]"
              >
                Zarifi 2, Nea Anchialos, Thessalía, Greece, 37400
              </a>
            </p>
            <p className="mb-3">
              📅{" "}
              <Link to="/reservations" className="hover:text-[#f39c12]">
                Make a Reservation
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
                Find us on TripAdvisor
              </a>
            </p>
            <p className="mb-3">📞 2428077424</p>
          </div>

          {/* Social Media Section */}
          <div className="flex-1 px-5 min-w-[200px]">
            <h4 className="text-lg mb-4 text-[#f39c12]">Follow Us</h4>
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
            </div>
          </div>

          {/* Mailing List Section */}
          <div className="flex-1 px-5 min-w-[200px]">
            <h4 className="text-lg mb-4 text-[#f39c12]">
              Join Our Mailing List
            </h4>
            <p className="mb-3">
              Subscribe to get the latest updates and offers.
            </p>
            <form
              action="/subscribe"
              method="post"
              className="flex flex-col gap-3"
            >
              <input
                type="email"
                name="email"
                placeholder="Enter your email"
                required
                className="p-3 rounded-md text-black"
              />
              <button
                type="submit"
                className="p-3 bg-[#f39c12] rounded-md text-white hover:bg-[#e67e22] transition-colors"
              >
                Subscribe
              </button>
            </form>
          </div>
        </div>

        <div className="w-full text-center text-sm mt-6">
          &copy; 2024 Aiolia Beach Bar
        </div>
      </div>
    </footer>
  );
}
