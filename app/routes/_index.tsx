import { motion } from "framer-motion";
import { Flex, Box } from "@radix-ui/themes";
import img from "../assets/beach-bar.jpg";
import { Text } from "../components/ui/Text";
import InteractiveGrid from "../components/InteractiveGrid";
import { Button } from "~/components/ui/Button";
import { useTranslation } from "react-i18next";
import { Link } from "@remix-run/react";

export default function Index() {
  const { t, i18n } = useTranslation();

  return (
    <div className="snap-y snap-mandatory h-screen overflow-y-scroll">
      <Box className="snap-start h-screen relative">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url(${img})` }}
        >
          <Flex
            className="h-full"
            align="center"
            justify="center"
            direction="column"
            p="5"
          >
            <Text
              className="text-white text-4xl font-bold text-center"
              translate="no"
            >
              Welcome to Aiolia Beach Bar
            </Text>
            <Text
              className="text-white text-lg my-4 text-center"
              translate="no"
            >
              Your ultimate seaside experience in Nea Anchialos
            </Text>
            <Button radius="full" size="3" variant="solid">
              <Link to="/menu" className="w-full text-center">
                <Text className="font-bold text-white">{t("View Menu")}</Text>{" "}
              </Link>
            </Button>
          </Flex>
        </motion.div>
      </Box>

      <Box className="snap-start">
        <InteractiveGrid />
      </Box>

      <Box className="snap-start h-screen relative">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1 }}
          className="absolute inset-0 w-full h-full bg-cover bg-center"
          style={{ backgroundImage: `url('/sea-gazing.jpg')` }}
        >
          <Flex
            className="h-full bg-black bg-opacity-50"
            align="center"
            justify="center"
            direction="column"
            p="5"
          >
            <Text
              className="text-white text-xl leading-7 text-center mb-4"
              translate="no"
            >
              ⏰ {t("From 19:00 till late at night October - April")}
            </Text>
            <Text
              className="text-white text-xl leading-7 text-center mb-4"
              translate="no"
            >
              ⏰ {t("From 10:00 till late at night May - September")}
            </Text>
            <Text
              className="text-white text-xl leading-7 text-center mb-4"
              translate="no"
            >
              🍸 {t("Coffee, Drinks, Cocktails")}
            </Text>
            <Text
              className="text-white text-xl leading-7 text-center mb-4"
              translate="no"
            >
              🥪 {t("Pizza, Salads, Desserts")}
            </Text>
            <Text
              className="text-white text-xl leading-7 text-center "
              translate="no"
            >
              📌 {t("Nea Anchialos | Volos")}
            </Text>
          </Flex>
        </motion.div>
      </Box>
    </div>
  );
}
