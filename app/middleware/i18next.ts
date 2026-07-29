// app/middleware/i18next.ts
import Backend from "i18next-fs-backend";
import { resolve } from "node:path";
import { initReactI18next } from "react-i18next";
import { createI18nextMiddleware } from "remix-i18next/middleware";

import i18n from "~/i18n";

export const [i18nextMiddleware, getLocale, getInstance] = createI18nextMiddleware({
  detection: {
    supportedLanguages: i18n.supportedLngs,
    fallbackLanguage: i18n.fallbackLng,
  },
  i18next: {
    ...i18n,
    backend: {
      loadPath: resolve("./public/locales/{{lng}}/{{ns}}.json"),
    },
  },
  plugins: [initReactI18next, Backend],
});