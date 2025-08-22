import { useState } from "react";
import { Link } from "@remix-run/react";
import { Flex, Box } from "@radix-ui/themes";
import logo from "../assets/logo-transparent.png";
import { ProgressBar } from "./ProgressBar";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/Button";
import { Text } from "./ui/Text";
import {
  Bars3Icon,
  CheckIcon,
  ChevronDownIcon,
  GlobeAltIcon,
} from "@heroicons/react/24/outline";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@radix-ui/react-popover";
import { Select } from "./ui/Select";

export default function AppHeader() {
  const { t, i18n } = useTranslation();

  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const changeLanguage = async (lang: string) => {
    i18n.changeLanguage(lang);
    setMobileMenuOpen(false);
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
                <Text className="text-[--accent] font-bold">
                  {t("Reservations")}
                </Text>
              </Link>
            </Button>
            <Button radius="full" size="3" variant="outline">
              <Link to="/menu">
                <Text className="text-[--accent]  font-bold">{t("Menu")}</Text>
              </Link>
            </Button>
            <Select.Root
              size="3"
              value={i18n.language}
              onValueChange={(lng) => changeLanguage(lng)}
            >
              <Select.Trigger radius="full">
                <Flex as="span" align="center" gap="2">
                  <GlobeAltIcon className="h-5 w-5 text-[--accent] " />
                  <Text className="text-[--accent]  font-bold">
                    {i18n.language === "en" ? t("English") : t("Greek")}
                  </Text>
                </Flex>
              </Select.Trigger>
              <Select.Content position="popper" sideOffset={5}>
                <Select.Item value="en">{t("English")}</Select.Item>
                <Select.Item value="el">{t("Greek")}</Select.Item>
              </Select.Content>
            </Select.Root>
          </Flex>
          <Flex gap="2" display={{ initial: "flex", md: "none" }}>
            <Popover open={isMobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <PopoverTrigger>
                <Bars3Icon
                  className="h-7 w-7 text-[var(--accent)]"
                  onClick={() => setMobileMenuOpen(true)}
                />
              </PopoverTrigger>
              <PopoverContent className="p-4 shadow-md rounded-md z-50 bg-[var(--color-background)] text-[var(--color-text)]">
                <Flex direction="column" gap="2" align="stretch">
                  <Button
                    size="3"
                    variant="outline"
                    onClick={() => {
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Link to="/reservations" className="w-full text-center">
                      <Text className="text-[--accent]  font-bold">
                        {t("Reservations")}
                      </Text>
                    </Link>
                  </Button>
                  <Button
                    size="3"
                    variant="outline"
                    onClick={() => {
                      setMobileMenuOpen(false);
                    }}
                  >
                    <Link to="/menu" className="w-full text-center">
                      <Text className="text-[--accent]  font-bold">
                        {t("Menu")}
                      </Text>
                    </Link>
                  </Button>
                  <Popover>
                    <PopoverTrigger>
                      <Button size="3" variant="outline">
                        <GlobeAltIcon className="h-5 w-5 text-[var(--accent)]" />
                        <Text className="text-[--accent]  font-bold">
                          {i18n.language === "el" ? t("Greek") : t("English")}
                        </Text>
                        <ChevronDownIcon className="h-4 w-4 text-[var(--accent)]" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="p-4 shadow-md rounded-md z-50 bg-[var(--color-background)] text-[var(--color-text)]">
                      <Flex direction="column" gap="2" align="stretch">
                        <Button
                          size="3"
                          variant="outline"
                          onClick={() => {
                            changeLanguage("el");
                            setMobileMenuOpen(false);
                          }}
                        >
                          {i18n.language === "el" && (
                            <CheckIcon className="h-4 w-4 text-[var(--accent)]" />
                          )}
                          <Text className="text-[--accent]  font-bold">
                            {t("Greek")}
                          </Text>
                        </Button>
                        <Button
                          size="3"
                          variant="outline"
                          onClick={() => {
                            changeLanguage("en");
                            setMobileMenuOpen(false);
                          }}
                        >
                          {i18n.language === "en" && (
                            <CheckIcon className="h-4 w-4 text-[var(--accent)] " />
                          )}
                          <Text className="text-[--accent] font-bold">
                            {t("English")}
                          </Text>
                        </Button>
                      </Flex>
                    </PopoverContent>
                  </Popover>
                </Flex>
              </PopoverContent>
            </Popover>
          </Flex>
        </Flex>
      </Flex>
    </Box>
  );
}
