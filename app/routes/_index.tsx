import { motion } from "framer-motion";
import { Flex, Box } from "@radix-ui/themes";
import img from "../assets/beach-bar.webp";
import { Text } from "../components/ui/Text";
import InteractiveGrid from "../components/InteractiveGrid";
import { Button } from "~/components/ui/Button";
import { useTranslation } from "react-i18next";
import { Link } from "@remix-run/react";

export default function Index() {
  const { t, i18n } = useTranslation();

  return (
    <div className="snap-y snap-mandatory h-screen overflow-y-scroll">
      <Box className="snap-start h-screen relative overflow-hidden">
        <img
          src={img}
          alt="Aiolia Beach Bar Background"
          fetchPriority="high"
          loading="eager"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full"
        >
          <Flex
            className="h-full bg-black bg-opacity-30"
            align="center"
            justify="center"
            direction="column"
            p="5"
          >
            <Text className="text-white text-4xl font-bold text-center">
              Welcome to Aiolia Beach Bar
            </Text>
            <Text className="text-white text-lg my-4 text-center">
              Your ultimate seaside experience in Nea Anchialos
            </Text>
            <Button radius="full" size="3" variant="solid">
              <Link
                to="/menu"
                className="inline-block"
                aria-label="Go to menu page"
              >
                <Text className="font-bold text-white">{t("View Menu")}</Text>
              </Link>
            </Button>
          </Flex>
        </motion.div>
      </Box>

      <Box className="snap-start">
        <InteractiveGrid />
      </Box>

      <Box className="snap-start h-screen relative overflow-hidden">
        <img
          src="/sea-gazing.webp"
          alt="Sea Gazing View"
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover object-center"
        />

        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full"
        >
          <Flex
            className="h-full bg-black bg-opacity-50"
            align="center"
            justify="center"
            direction="column"
            p="5"
          >
            <Text className="text-white text-xl leading-7 text-center mb-4">
              ⏰ {t("From 19:00 till late at night October - April")}
            </Text>
            <Text className="text-white text-xl leading-7 text-center mb-4">
              ⏰ {t("From 10:00 till late at night May - September")}
            </Text>
            <Text className="text-white text-xl leading-7 text-center mb-4">
              🍸 {t("Coffee, Drinks, Cocktails")}
            </Text>
            <Text className="text-white text-xl leading-7 text-center mb-4">
              🥪 {t("Pizza, Salads, Desserts")}
            </Text>
            <Text className="text-white text-xl leading-7 text-center ">
              📌 {t("Nea Anchialos | Volos")}
            </Text>
          </Flex>
        </motion.div>
      </Box>

      {/* SPOTIFY SECTION */}
      <Box className="snap-start h-screen bg-[#121212] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 to-black/80 z-10" />

        <Flex
          className="h-full w-full relative z-20 max-w-4xl mx-auto"
          align="center"
          justify="center"
          direction="column"
          p="5"
          gap="4"
        >
          <div className="text-center mb-2">
            <h2 className="text-white text-3xl font-bold tracking-tight">
              {t("The Sounds of Aiolia")}
            </h2>
            <Text className="text-gray-400 text-sm block mt-1">
              {t(
                "Listen to our official tracks, curated for your perfect beach experience.",
              )}
            </Text>
          </div>

          {/* Spotify Responsive Embed Wrapper */}
          <div className="w-full h-[450px] max-h-[60vh] rounded-xl overflow-hidden shadow-2xl bg-black/20">
            <iframe
              title="Spotify Embed - Aiolia Music Selection"
              src="https://open.spotify.com/embed/artist/4Ei8T9JKi6vN7uQYMFhS8D?utm_source=generator&theme=0"
              width="100%"
              height="100%"
              allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
              loading="lazy"
            />
          </div>
        </Flex>
      </Box>
    </div>
  );
}
