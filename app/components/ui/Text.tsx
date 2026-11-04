import { forwardRef } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Text as RadixText, type TextProps } from "@radix-ui/themes";

type TextPropsFinal = Omit<TextProps, "as" | "color"> & {
  color?: TextProps["color"] | "black";
  translate?: "yes" | "no";
  values?: Record<string, unknown>;
};

const Text = forwardRef<
  React.ElementRef<"span">,
  TextPropsFinal
>(
  (
    { children, color, className = "", translate = "yes", values, ...props },
    forwardedRef
  ) => {
    const { i18n } = useTranslation();

    return (
      <RadixText
        ref={forwardedRef}
        as="span"
        color={color === "black" ? undefined : color}
        className={className}
        {...props}
      >
        {translate === "no" ? (
          children
        ) : (
          <Trans lang={i18n.language} values={values}>
            {children}
          </Trans>
        )}
      </RadixText>
    );
  }
);

Text.displayName = "Text";
export { Text };
