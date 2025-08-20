import { useState } from "react";
import { Link } from "@remix-run/react";
import { Flex, Box } from "@radix-ui/themes";
import logo from "../assets/logo-transparent.png";
import { ProgressBar } from "./ProgressBar";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";
import { Text } from "./ui/Text";
import { Bars3Icon, ChevronDownIcon } from "@heroicons/react/24/outline";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";

export default function AppHeader() {
  const { t, i18n } = useTranslation();

  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [isPopoverOpen, setPopoverOpen] = useState(false);

  const changeLanguage = async (lang: string) => {
    i18n.changeLanguage(lang);
    setMobileMenuOpen(false); // Close the mobile menu
  };

  const handleLanguageChange = (lang: string) => {
    changeLanguage(lang);
    setPopoverOpen(false); // Close the popover
  };

  return (
    <Box className="fixed top-0 left-0 w-full z-50 bg-[var(--color-background)] text-[var(--color-text)]">
      <ProgressBar />
      <Flex justify="between" align="center" px="3" py="3">
        <Link to="/" className="logo flex-shrink-0">
          <img src={logo} alt="Aiolia Beach Bar Logo" className="h-12" />
        </Link>
        <Flex gap="2" align="center" className="ml-auto">
          <Flex gap="2" display={{ initial: "none", md: "flex" }}>
            <Button radius="full" size="3" variant="outline">
              <Link to="/reservations">
                <Text className="text-[#fa994f] font-bold">
                  {t("Reservations")}
                </Text>
              </Link>
            </Button>
            <Button radius="full" size="3" variant="outline">
              <Link to="/menu">
                <Text className="text-[#fa994f] font-bold">{t("Menu")}</Text>
              </Link>
            </Button>
            <Popover open={isPopoverOpen} onOpenChange={setPopoverOpen}>
              <PopoverTrigger asChild>
                <Button radius="full" size="3" variant="outline">
                  <Text className="text-[#fa994f] font-bold">
                    {i18n.language === "en" ? t("English") : t("Greek")}
                  </Text>
                  <ChevronDownIcon className="h-5 w-5 text-[#fa994f]" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="bg-white p-4 shadow-md rounded-md">
                <Flex direction="column" gap="2">
                  <Button
                    radius="full"
                    size="2"
                    variant="outline"
                    onClick={() => handleLanguageChange("en")}
                  >
                    <Text className="text-[#fa994f] font-bold">English</Text>
                  </Button>
                  <Button
                    radius="full"
                    size="2"
                    variant="outline"
                    onClick={() => handleLanguageChange("el")}
                  >
                    <Text className="text-[#fa994f] font-bold">Greek</Text>
                  </Button>
                </Flex>
              </PopoverContent>
            </Popover>
          </Flex>
          <Flex gap="2" display={{ initial: "flex", md: "none" }}>
            <Popover>
              <PopoverTrigger>
                <Bars3Icon className="h-7 w-7 text-[#fa994f]" />
              </PopoverTrigger>
              <PopoverContent className="bg-white p-4 shadow-md rounded-md">
                <Flex direction="column" gap="2" align="stretch">
                  <Button
                    size="3"
                    variant="outline"
                    className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold hover:opacity-90"
                  >
                    <Link to="/reservations" className="w-full text-center">
                      <Text className="text-[#fa994f] font-bold">
                        {t("Reservations")}
                      </Text>
                    </Link>
                  </Button>
                  <Button
                    size="3"
                    variant="outline"
                    className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold hover:opacity-90"
                  >
                    <Link to="/menu" className="w-full text-center">
                      <Text className="text-[#fa994f] font-bold">
                        {t("Menu")}
                      </Text>
                    </Link>
                  </Button>
                  <Button
                    size="3"
                    variant="outline"
                    className="w-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold hover:opacity-90"
                    onClick={() =>
                      changeLanguage(i18n.language === "en" ? "el" : "en")
                    }
                  >
                    <Text className="text-[#fa994f] font-bold">
                      {i18n.language === "en" ? t("Greek") : t("English")}
                    </Text>
                  </Button>
                </Flex>
              </PopoverContent>
            </Popover>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}
