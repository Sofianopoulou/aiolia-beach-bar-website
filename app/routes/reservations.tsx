import { json, redirect } from "@remix-run/node";
import { useActionData } from "@remix-run/react";
import { useTranslation } from "react-i18next";
import { sendReservationEmail } from "~/utils/mail.server";
import { Box, Flex, Card, Heading, Text, Button } from "@radix-ui/themes";

type ActionData = { error?: string };

export const action = async ({ request }: any) => {
  const formData = await request.formData();

  const name = String(formData.get("name") ?? "").trim();
  const date = String(formData.get("date") ?? "").trim();
  const time = String(formData.get("time") ?? "").trim();
  const people = String(formData.get("people") ?? "").trim();
  const tablePreference = String(formData.get("tablePreference") ?? "").trim();
  const comments = String(formData.get("comments") ?? "").trim();

  if (!name || !date || !time || !people) {
    return json<ActionData>(
      { error: "Missing required fields." },
      { status: 400 }
    );
  }

  try {
    await sendReservationEmail({
      name,
      date,
      time,
      people,
      tablePreference,
      comments,
    });

    return redirect("/reservation-success");
  } catch (error) {
    console.error("Email sending failed:", error);
    return json<ActionData>(
      { error: "Failed to send reservation email." },
      { status: 500 }
    );
  }
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid #e5e7eb",
  fontSize: 15,
};

const labelStyle: React.CSSProperties = {
  fontSize: 14,
  marginBottom: 6,
  color: "#374151",
};

export default function ReservationForm() {
  const { t } = useTranslation("common");
  const actionData = useActionData<ActionData>();

  return (
    <Box
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 24,
        backgroundColor: "#f5f7f8",
      }}
    >
      <Card
        size="4"
        style={{
          width: "100%",
          maxWidth: 520,

          boxShadow:
            "0 10px 25px rgba(0,0,0,0.08), 0 4px 10px rgba(0,0,0,0.05)",
        }}
      >
        <Box p="6">
          {actionData?.error ? (
            <Flex direction="column" gap="3" align="center">
              <Heading size="6" align="center">
                {t("Failed to submit reservation!")}
              </Heading>
              <Text align="center" color="gray">
                {t(
                  "Please call us on 24280 77424 for making your reservation."
                )}
              </Text>
            </Flex>
          ) : (
            <form method="post" action="/reservations">
              <Flex direction="column" gap="5">
                <Flex direction="column" gap="2" align="center">
                  <Heading size="7" align="center">
                    {t("Make a Reservation")}
                  </Heading>
                  <Text align="center" color="gray">
                    {t("Reserve your spot by the sea.")}
                  </Text>
                </Flex>

                <Box>
                  <label style={labelStyle}>{t("Date")}</label>
                  <input type="date" name="date" required style={inputStyle} />
                </Box>

                <Box>
                  <label style={labelStyle}>{t("Time")}</label>
                  <input type="time" name="time" required style={inputStyle} />
                </Box>

                <Box>
                  <label style={labelStyle}>{t("Number of People")}</label>
                  <input
                    type="number"
                    name="people"
                    required
                    min={1}
                    placeholder="e.g. 2"
                    style={inputStyle}
                  />
                </Box>

                <Box>
                  <label style={labelStyle}>{t("Name")}</label>
                  <input
                    type="text"
                    name="name"
                    required
                    placeholder="Your Name"
                    style={inputStyle}
                  />
                </Box>

                <Box>
                  <label style={labelStyle}>
                    {t("Table Preference (Optional)")}
                  </label>
                  <select name="tablePreference" style={inputStyle}>
                    <option value="">{t("Select preference")}</option>
                    <option value="stand">Stand</option>
                    <option value="lounge">Lounge</option>
                    <option value="bar">Bar</option>
                  </select>
                </Box>

                <Box>
                  <label style={labelStyle}>{t("Comments (Optional)")}</label>
                  <textarea
                    name="comments"
                    placeholder={t("e.g. Sea view, birthday celebration...")}
                    style={{
                      ...inputStyle,
                      minHeight: 100,
                      resize: "vertical",
                    }}
                  />
                </Box>

                <Text size="2" color="gray">
                  {t(
                    "Your table will be held for 15 minutes after your reservation time. If you’re running late, give us a call — we’ll do our best to help."
                  )}
                </Text>

                <Button type="submit" size="4" radius="full">
                  {t("Make Reservation")}
                </Button>
              </Flex>
            </form>
          )}
        </Box>
      </Card>
    </Box>
  );
}
