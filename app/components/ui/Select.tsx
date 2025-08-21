import { forwardRef } from "react";
import { Select as SelectRadix } from "@radix-ui/themes";
import type {
  ContentProps,
  GroupProps,
  ItemProps,
  LabelProps,
  RootProps,
  SeparatorProps,
  TriggerProps,
} from "@radix-ui/themes/dist/esm/components/select.js";

const SelectTrigger = forwardRef<HTMLButtonElement, TriggerProps>(
  ({ placeholder = "", className = "", ...props }, ref) => {
    return (
      <SelectRadix.Trigger
        ref={ref}
        className={className}
        placeholder={placeholder}
        {...props}
      />
    );
  }
);

const Select = Object.assign(
  {},
  {
    Root: SelectRadix.Root,
    Content: SelectRadix.Content,
    Group: SelectRadix.Group,
    Label: SelectRadix.Label,
    Item: SelectRadix.Item,
    Separator: SelectRadix.Separator,
    Trigger: SelectTrigger,
  }
);

export {
  Select,
  ContentProps,
  GroupProps,
  ItemProps,
  LabelProps,
  RootProps,
  SeparatorProps,
};
