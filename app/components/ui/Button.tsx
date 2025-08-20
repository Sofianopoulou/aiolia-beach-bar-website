import React, { forwardRef } from "react";
import {
  Button as ButtonRadix,
  Slot,
  Spinner,
  type ButtonProps as RadixProps,
} from "@radix-ui/themes";
import type { ReactElement } from "react";

const newColors = {
  brand: undefined,
  critical: "red",
  neutral: "gray",
  white: "white",
} as const;

const sizes = {
  1: "!w-4 !h-4 [--icon-size:14px] h-[--icon-size] w-[--icon-size]",
  2: "!w-5 !h-5 [--icon-size:16px] h-[--icon-size] w-[--icon-size]",
  3: "!w-6 !h-6 [--icon-size:18px] h-[--icon-size] w-[--icon-size]",
  4: "!w-7 !h-7 [--icon-size:20px] h-[--icon-size] w-[--icon-size]",
};

type ButtonStyleProps = Omit<RadixProps, "color"> & {
  color?: RadixProps["color"] | keyof typeof newColors;
  isLoading?: boolean;
  icon?: ReactElement;
};

type ButtonProps = Omit<React.ComponentProps<"button">, "className"> &
  ButtonStyleProps;

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      onClick,
      size = "2",
      isLoading = false,
      type = "submit",
      disabled = false,
      color,
      icon,
      tabIndex,
      children,
      ...props
    },
    ref
  ) => {
    if (color && Object.keys(newColors).includes(color)) {
      color = newColors[color as keyof typeof newColors];
    }

    return (
      <ButtonRadix
        ref={ref}
        onClick={onClick}
        type={type}
        color={color as RadixProps["color"]}
        className=""
        tabIndex={tabIndex}
        disabled={disabled || isLoading}
        size={size}
        loading={icon ? false : isLoading}
        {...props}
      >
        <Spinner
          loading={isLoading}
          className={sizes[size as unknown as keyof typeof sizes]}
        >
          <Slot className={sizes[size as unknown as keyof typeof sizes]}>
            {icon}
          </Slot>
        </Spinner>
        {children}
      </ButtonRadix>
    );
  }
);

Button.displayName = "Button";

export { Button };
