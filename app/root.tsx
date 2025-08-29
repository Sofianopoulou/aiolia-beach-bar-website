import {
  json,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "@remix-run/react";
import "./tailwind.css";

import type { LinksFunction } from "@remix-run/node";
import stylesheet from "~/tailwind.css?url";
import AppHeader from "./components/AppHeader";
import Footer from "./components/Footer";

import { useChangeLanguage } from "remix-i18next/react";
import { useTranslation } from "react-i18next";
import i18next from "~/i18next.server";

import { useLoaderData } from "@remix-run/react";
import { Theme, ThemePanel } from "@radix-ui/themes";
import "@radix-ui/themes/styles.css";

export async function loader({ request }: any) {
  let locale = await i18next.getLocale(request);
  return new Response(JSON.stringify({ locale }), {
    headers: {
      "Content-Type": "application/json",
    },
  });
}

export let handle = {
  // In the handle export, we can add a i18n key with namespaces our route
  // will need to load. This key can be a single string or an array of strings.
  // TIP: In most cases, you should set this to your defaultNS from your i18n config
  // or if you did not set one, set it to the i18next default namespace "translation"
  i18n: "common",
};
import { SpeedInsights } from "@vercel/speed-insights/remix";

export function Layout({ children }: { children: React.ReactNode }) {
  let data = useLoaderData<typeof loader>();
  let locale = data?.locale || "en";

  let { i18n } = useTranslation();

  // This hook will change the i18n instance language to the current locale
  // detected by the loader, this way, when we do something to change the
  // language, this locale will change and i18next will load the correct
  // translation files
  useChangeLanguage(locale);

  return (
    <html lang={locale} dir={i18n.dir()}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Meta />
        <Links />
      </head>
      <body>
        <SpeedInsights />
        <Theme accentColor="orange" panelBackground="translucent">
          {/* <ThemePanel /> */}
          <AppHeader />
          <div className="pt-20">
            <Outlet />
          </div>
          <Footer />
          <ScrollRestoration />
          <Scripts />
        </Theme>
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}

export const links: LinksFunction = () => [
  { rel: "stylesheet", href: stylesheet },
];
