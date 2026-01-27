import { Link } from "@remix-run/react";
import { Box, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

export default function ReservationSuccess() {
  const { t } = useTranslation();

  return (
    <Box
      style={{
        minHeight: "100vh",
        backgroundImage: 'url("/reservation-success.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
      }}
    >
      {/* Dark overlay */}
      <Box style={{ minHeight: "100vh", backgroundColor: "rgba(0,0,0,0.65)" }}>
        <Flex
          direction="column"
          align="center"
          justify="center"
          style={{ minHeight: "100vh" }}
          p="6"
          gap="5"
        >
          {/* Headline */}
          <Heading
            size="9"
            align="center"
            style={{ color: "white", letterSpacing: "0.02em" }}
          >
            {t("Your table is reserved")} 🍽️
          </Heading>

          {/* Core message */}
          <Text
            size="4"
            align="center"
            style={{ color: "rgba(255,255,255,0.9)", maxWidth: 520 }}
          >
            {t(
              "We’ve received your reservation and can’t wait to welcome you at"
            )}{" "}
            <strong>Aiolia Beach Bar</strong>.
          </Text>

          {/* Experience hook */}
          <Text
            size="4"
            align="center"
            style={{ color: "rgba(255,255,255,0.85)", maxWidth: 560 }}
          >
            🌊{" "}
            {t(
              "Sunset views, handcrafted cocktails, and relaxed seaside vibes await you in Nea Anchialos."
            )}
          </Text>

          {/* Expectations */}
          <Text
            size="3"
            align="center"
            style={{
              color: "rgba(255,255,255,0.75)",
              maxWidth: 520,
              marginTop: 8,
            }}
          >
            ⏰{" "}
            {t(
              "Your table will be held for 15 minutes after your reservation time. If you’re running late, feel free to call us on"
            )}{" "}
            <a href="tel:+302428077424" style={{ color: "inherit" }}>
              <strong>{t("24280 77424")}</strong>
            </a>
            .
          </Text>

          {/* CTA buttons */}
          <Flex gap="3" mt="5" wrap="wrap" justify="center">
            <Button asChild size="4" radius="full" variant="solid">
              <Link to="/menu">See Menu</Link>
            </Button>

            <Button asChild size="4" radius="full" variant="outline">
              <Link to="/">Back to Home</Link>
            </Button>
          </Flex>

          {/* Closing line */}
          <Text
            size="5"
            weight="bold"
            style={{ color: "white", marginTop: 16 }}
          >
            {t("See you by the sea")} 🍸
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
