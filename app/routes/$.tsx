import { Link } from "react-router";
import { Box, Button, Flex, Heading, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

export function loader() {
  return new Response(null, {
    status: 404,
    statusText: "Not Found",
  });
}

export default function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <Box
      style={{
        minHeight: "100vh",

        marginTop: "-5rem",
        paddingTop: "5rem",

        backgroundImage: 'url("/reservation-success.jpg")',
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      {/* Dark overlay */}
      <Box
        style={{
          minHeight: "calc(100vh - 5rem)",
          backgroundColor: "rgba(0, 0, 0, 0.65)",
        }}
      >
        <Flex
          direction="column"
          align="center"
          justify="center"
          gap="5"
          p="6"
          style={{
            minHeight: "calc(100vh - 5rem)",
            textAlign: "center",
          }}
        >
          <Text
            weight="bold"
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              fontSize: "clamp(5rem, 18vw, 12rem)",
              lineHeight: 0.85,
              letterSpacing: "-0.05em",
            }}
          >
            404
          </Text>

          <Heading
            size="9"
            align="center"
            style={{
              color: "white",
              letterSpacing: "0.02em",
            }}
          >
            {t("Looks like this page drifted out to sea")} 🌊
          </Heading>

          <Text
            size="4"
            align="center"
            style={{
              color: "rgba(255, 255, 255, 0.9)",
              maxWidth: 560,
            }}
          >
            {t(
              "The page you are looking for may have moved, been removed, or never existed.",
            )}
          </Text>

          <Text
            size="4"
            align="center"
            style={{
              color: "rgba(255, 255, 255, 0.82)",
              maxWidth: 560,
            }}
          >
            {t(
              "Let’s get you back to the beach, the cocktails, and the good vibes.",
            )}{" "}
            🍹
          </Text>

          <Flex gap="3" mt="5" wrap="wrap" justify="center">
            <Button asChild size="4" radius="full" variant="solid">
              <Link to="/">{t("Back to Home")}</Link>
            </Button>

            <Button
              asChild
              size="4"
              radius="full"
              variant="surface"
              highContrast
            >
              <Link to="/menu">{t("See Menu")}</Link>
            </Button>
          </Flex>

          <Text
            size="5"
            weight="bold"
            style={{
              color: "white",
              marginTop: 16,
            }}
          >
            {t("See you by the sea")} 🍸
          </Text>
        </Flex>
      </Box>
    </Box>
  );
}
