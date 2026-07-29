import { PassThrough } from "stream";
import { createReadableStreamFromReadable } from "@react-router/node";
import { type EntryContext, type RouterContextProvider } from "react-router";
import { ServerRouter } from "react-router";
import { isBot } from "isbot";
import { renderToPipeableStream } from "react-dom/server";

import { I18nextProvider } from "react-i18next";
import { getInstance } from "~/middleware/i18next";

const ABORT_DELAY = 5000;

export default function handleRequest(
  request: Request,
  responseStatusCode: number,
  responseHeaders: Headers,
  reactRouterContext: EntryContext,
  routerContext: RouterContextProvider,
) {
  const userAgent = request.headers.get("user-agent");
  const callbackName = isBot(userAgent) ? "onAllReady" : "onShellReady";

  return new Promise((resolve, reject) => {
    let didError = false;

    let { pipe, abort } = renderToPipeableStream(
      <I18nextProvider i18n={getInstance(routerContext)}>
        <ServerRouter context={reactRouterContext} url={request.url} />
      </I18nextProvider>,
      {
        [callbackName]: () => {
          let body = new PassThrough();
          const stream = createReadableStreamFromReadable(body);
          responseHeaders.set("Content-Type", "text/html");

          resolve(
            new Response(stream, {
              headers: responseHeaders,
              status: didError ? 500 : responseStatusCode,
            }),
          );

          pipe(body);
        },
        onShellError(error: unknown) {
          reject(error);
        },
        onError(error: unknown) {
          didError = true;

          console.error(error);
        },
      },
    );

    setTimeout(abort, ABORT_DELAY);
  });
}
