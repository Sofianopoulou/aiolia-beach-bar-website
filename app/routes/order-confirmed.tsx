import { Link } from "@remix-run/react";
import { Box, Flex, Heading, Text, Button } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

export default function OrderConfirmed() {
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
            {t("Order received!")} ✅
          </Heading>

          {/* Core message */}
          <Text
            size="4"
            align="center"
            style={{ color: "rgba(255,255,255,0.9)", maxWidth: 520 }}
          >
            {t("Your order is now in the hands of our team at")}{" "}
            <strong>Aiolia Beach Bar</strong>.{" "}
            {t("Sit back, relax — we've got it from here.")}
          </Text>

          {/* Reassurance */}
          <Text
            size="4"
            align="center"
            style={{ color: "rgba(255,255,255,0.85)", maxWidth: 560 }}
          >
            🍹{" "}
            {t(
              "Our team is already preparing your order with care. It will be with you shortly.",
            )}
          </Text>

          {/* Contact fallback */}
          <Text
            size="3"
            align="center"
            style={{
              color: "rgba(255,255,255,0.75)",
              maxWidth: 520,
              marginTop: 8,
            }}
          >
            ❓{" "}
            {t(
              "Need to make a change or have a question? Don't hesitate to call us on",
            )}{" "}
            <a href="tel:+302428077424" style={{ color: "inherit" }}>
              <strong>{t("24280 77424")}</strong>
            </a>
            .
          </Text>

          {/* CTA buttons */}
          <Flex gap="3" mt="5" wrap="wrap" justify="center">
            <Button asChild size="4" radius="full" variant="solid">
              <Link to="/order">{t("Order More")}</Link>
            </Button>

            <Button asChild size="4" radius="full" variant="outline">
              <Link to="/">{t("Back to Home")}</Link>
            </Button>
          </Flex>

          {/* Closing line */}
          <Text
            size="5"
            weight="bold"
            style={{ color: "white", marginTop: 16 }}
          >
            {t("Enjoy every sip")} 🌊
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
