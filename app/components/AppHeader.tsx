import React, { useState, useEffect, useRef } from "react";
import { Link } from "@remix-run/react";
import { Button, Flex } from "@radix-ui/themes";
import logo from "../assets/logo.png";
import { ProgressBar } from "./ProgressBar";
import { useTranslation } from "react-i18next";

export default function AppHeader() {
  let { t, i18n } = useTranslation();

  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isLanguageMenuOpen, setLanguageMenuOpen] = useState(false);
  const [isMobileLanguageMenuOpen, setMobileLanguageMenuOpen] = useState(false);
  const mobileMenuRef = useRef<HTMLDivElement>(null);
  const hamburgerRef = useRef<HTMLButtonElement>(null);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  const toggleLanguageMenu = () => {
    setLanguageMenuOpen(!isLanguageMenuOpen);
  };

  const toggleMobileLanguageMenu = () => {
    setMobileLanguageMenuOpen(!isMobileLanguageMenuOpen);
  };

  const changeLanguage = async (lang: string) => {
    console.log(`Attempting to change language to: ${lang}`);
    try {
      await i18n.changeLanguage(lang); // Wait for the language to change
      console.log(`Language changed to: ${i18n.language}`);
    } catch (error) {
      console.error(`Error changing language: ${error}`);
    }
    setLanguageMenuOpen(false); // Close the desktop dropdown
    setMobileLanguageMenuOpen(false); // Close the mobile dropdown
    setMobileMenuOpen(false); // Close the mobile menu
  };

  // Logic for closing mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      // Check if click is outside the mobile menu and the hamburger icon
      if (
        mobileMenuRef.current &&
        !mobileMenuRef.current.contains(event.target as Node) &&
        hamburgerRef.current &&
        !hamburgerRef.current.contains(event.target as Node)
      ) {
        setMobileMenuOpen(false);
      }
    };

    if (isMobileMenuOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isMobileMenuOpen]);

  return (
    <Header>
      <ProgressBar />
      <Flex className="w-full flex justify-between items-center px-4 py-3">
        <Link to="/" className="logo">
          <img src={logo} alt="Aiolia Beach Bar Logo" className="h-12" />
        </Link>
        <Flex className="hidden md:flex gap-4 items-center">
          <Button
            asChild
            className="bg-white text-[#fa994f] font-bold py-2 px-4 rounded-full border-2 border-[#fa994f] transition hover:bg-opacity-20 hover:scale-105"
          >
            <Link to="/reservations">{t("Reservations")}</Link>
          </Button>
          <Button
            asChild
            className="bg-white text-[#fa994f] font-bold py-2 px-4 rounded-full border-2 border-[#fa994f] transition hover:bg-opacity-20 hover:scale-105"
          >
            <Link to="/menu">{t("Menu")}</Link>
          </Button>

          {/* Desktop Language Dropdown */}
          <div className="relative">
            <Button
              className="bg-white text-[#fa994f] font-bold py-2 px-4 rounded-full border-2 border-[#fa994f] hover:bg-opacity-20 hover:scale-105 transition flex items-center gap-2"
              onClick={toggleLanguageMenu}
            >
              {i18n.language === "en" ? t("English") : t("Greek")}{" "}
              {/* Dynamic label */}
              <span>{isLanguageMenuOpen ? "▲" : "▼"}</span>
            </Button>
            {isLanguageMenuOpen && (
              <div className="absolute right-0 mt-2 w-40 bg-white border-2 border-[#fa994f] rounded-lg shadow-lg z-10">
                <Button
                  className="block w-full text-left py-2 px-4 hover:bg-[#fa994f] hover:text-white transition"
                  onClick={() => changeLanguage("en")}
                >
                  {t("English")}
                </Button>
                <Button
                  className="block w-full text-left py-2 px-4 hover:bg-[#fa994f] hover:text-white transition"
                  onClick={() => changeLanguage("el")}
                >
                  {t("Greek")}
                </Button>
              </div>
            )}
          </div>
        </Flex>

        {/* Mobile Menu Button */}
        <Button
          className="block md:hidden text-[#fa994f] text-3xl"
          onClick={toggleMobileMenu}
        >
          &#9776;
        </Button>
      </Flex>

      {/* Mobile Menu */}
      {isMobileMenuOpen && (
        <Flex
          ref={mobileMenuRef}
          className="absolute top-14 left-0 right-0 bg-white flex flex-col items-center py-4 shadow-md"
        >
          <Button
            asChild
            className="w-full text-center py-4 border-2 border-[#fa994f] rounded-lg mb-2 text-[#fa994f] font-bold"
            onClick={toggleMobileMenu}
          >
            <Link to="/reservations">{t("Reservations")}</Link>
          </Button>
          <Button
            asChild
            className="w-full text-center py-4 border-2 border-[#fa994f] rounded-lg mb-2 text-[#fa994f] font-bold"
            onClick={toggleMobileMenu}
          >
            <Link to="/menu">{t("Menu")}</Link>
          </Button>

          {/* Mobile Language Dropdown */}
          <div className="relative w-full text-center">
            <Button
              className="w-full text-center py-4 border-2 border-[#fa994f] rounded-lg mb-2 text-[#fa994f] font-bold flex items-center justify-center"
              onClick={toggleMobileLanguageMenu}
            >
              {i18n.language === "en" ? t("English") : t("Greek")}{" "}
              <span>{isMobileLanguageMenuOpen ? "▲" : "▼"}</span>
            </Button>
            {isMobileLanguageMenuOpen && (
              <div className="absolute w-full bg-white border-2 border-[#fa994f] rounded-lg shadow-lg z-10">
                <Button
                  className="block w-full text-center py-2 px-4 hover:bg-[#fa994f] hover:text-white transition"
                  onClick={() => changeLanguage("en")}
                >
                  {t("English")}
                </Button>
                <Button
                  className="block w-full text-center py-2 px-4 hover:bg-[#fa994f] hover:text-white transition"
                  onClick={() => changeLanguage("el")}
                >
                  {t("Greek")}
                </Button>
              </div>
            )}
          </div>
        </Flex>
      )}
    </Header>
  );
}

interface HeaderProps {
  children: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <div className="fixed top-0 left-0 w-full flex flex-col bg-white shadow-lg z-10">
      {children}
    </div>
  );
}
