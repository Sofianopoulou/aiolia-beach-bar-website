import { forwardRef } from "react";
import { Trans, useTranslation } from "react-i18next";
import { Text as RadixText, TextProps } from "@radix-ui/themes";

type TextPropsFinal = Omit<TextProps, "color"> & {
  color?: TextProps["color"] | "black";
  translate?: "yes" | "no";
};

const Text = forwardRef<
  React.ElementRef<"span" | "div" | "label" | "p">,
  TextPropsFinal
>(
  (
    { children, color, className = "", translate = "yes", ...props },
    forwardedRef
  ) => {
    const { i18n } = useTranslation();

    return (
      <RadixText
        ref={forwardedRef}
        color={color === "black" ? undefined : color}
        className={className}
        {...props}
      >
        {translate === "no" ? (
          children
        ) : (
          <Trans lang={i18n.language} values={props.values}>
            {children}
          </Trans>
        )}
      </RadixText>
    );
  }
);

Text.displayName = "Text";
export { Text };
