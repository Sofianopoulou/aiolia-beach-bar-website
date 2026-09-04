import { useEffect } from "react";

import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useRouteLoaderData,
  useLocation,
} from "react-router";

import type { LinksFunction, MetaFunction } from "react-router";

import { useTranslation } from "react-i18next";

import { Theme } from "@radix-ui/themes";

import "@radix-ui/themes/styles.css";

import stylesheet from "~/tailwind.css?url";

import AppHeader from "./components/AppHeader";
import Footer from "./components/Footer";

import { getLocale, i18nextMiddleware } from "~/middleware/i18next";

import type { Route } from "./+types/root";

import { SpeedInsights } from "@vercel/speed-insights/react";
import { Analytics } from "@vercel/analytics/react";

export const middleware = [i18nextMiddleware];

export async function loader({ context }: Route.LoaderArgs) {
  const locale = getLocale(context);

  return {
    locale,
  };
}

/**
 * Calculates the document direction without using useTranslation().
 *
 * This keeps Layout independent from translation namespace loading.
 * English and Greek both return "ltr".
 */
function getDocumentDirection(locale: string): "ltr" | "rtl" {
  const language = locale.split("-")[0];

  const rtlLanguages = ["ar", "fa", "he", "ur"];

  return rtlLanguages.includes(language) ? "rtl" : "ltr";
}

export function Layout({ children }: { children: React.ReactNode }) {
  /**
   * Layout can also render while handling an error.
   * For that reason, useRouteLoaderData is safer than useLoaderData.
   */
  const rootData = useRouteLoaderData<typeof loader>("root");

  const locale = rootData?.locale ?? "en";
  const direction = getDocumentDirection(locale);

  return (
    <html lang={locale} dir={direction}>
      <head>
        <meta charSet="utf-8" />

        <meta
          name="viewport"
          content="width=device-width, initial-scale=1, viewport-fit=cover"
        />

        <Meta />
        <Links />

        <link rel="icon" href="/favicon.ico" />

        <link rel="apple-touch-icon" href="/apple-touch-icon.png" />

        {/* Google tag (gtag.js) */}
        <script
          async
          src="https://www.googletagmanager.com/gtag/js?id=AW-17830813564"
        />

        <script
          dangerouslySetInnerHTML={{
            __html: `
              window.dataLayer = window.dataLayer || [];

              function gtag() {
                dataLayer.push(arguments);
              }

              if (typeof window !== "undefined") {
                window.addEventListener("load", function () {
                  gtag("js", new Date());
                  gtag("config", "AW-17830813564");
                });
              }
            `,
          }}
        />
      </head>

      <body>
        <Theme accentColor="orange" panelBackground="translucent">
          {/*
            React Router passes App, HydrateFallback,
            or ErrorBoundary through children.
          */}
          {children}
        </Theme>

        <Analytics />
        <SpeedInsights />

        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App({ loaderData }: Route.ComponentProps) {
  const locale = loaderData.locale;

  /**
   * useSuspense: false prevents the root app shell from
   * suspending hydration because of a missing namespace.
   */
  const { i18n } = useTranslation(undefined, {
    useSuspense: false,
  });

  const location = useLocation();

  const isStaffRoute =
    location.pathname.startsWith("/staff") ||
    location.pathname.startsWith("/admin") ||
    location.pathname.startsWith("/waiter");

  useEffect(() => {
    async function synchronizeLanguage() {
      if (i18n.resolvedLanguage !== locale && i18n.language !== locale) {
        await i18n.changeLanguage(locale);
      }

      document.documentElement.lang = locale;
      document.documentElement.dir = i18n.dir(locale);
    }

    void synchronizeLanguage();
  }, [i18n, locale]);

  return (
    <>
      {!isStaffRoute && <AppHeader />}

      <main className={isStaffRoute ? "" : "pt-20"}>
        <Outlet />
      </main>

      {!isStaffRoute && <Footer />}
    </>
  );
}

export const links: LinksFunction = () => [
  {
    rel: "preload",
    href: stylesheet,
    as: "style",
  },
  {
    rel: "stylesheet",
    href: stylesheet,
  },
];

export const meta: MetaFunction = () => [
  {
    title: "Aiolia Beach Bar - Your Ultimate Seaside Experience",
  },
  {
    name: "description",
    content:
      "Discover Aiolia Beach Bar in Nea Anchialos. Enjoy signature cocktails, gourmet pizzas, and seaside bliss. Perfect for unforgettable moments.",
  },
  {
    name: "keywords",
    content:
      "Aiolia Beach Bar, Nea Anchialos, Volos, seaside bar, gourmet pizza, signature cocktails, beach vibes",
  },
];
