import React, { useEffect, useState } from "react";
import { Section as SectionType } from "../types/types";
import { Flex, Box } from "@radix-ui/themes";
import MenuItem from "./MenuItem";
import { useTranslation } from "react-i18next";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Text } from "./ui/Text";

interface SectionProps {
  section: SectionType;
  addToCart?: (item: any) => void;
  isOrdering?: boolean;

  // Optional controlled state.
  // If omitted, Section behaves exactly like before.
  isOpen?: boolean;
  onToggle?: () => void;

  // Used when navigating here through search.
  selectedItemName?: string | null;
}

const createSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

const Section: React.FC<SectionProps> = ({
  section,
  addToCart,
  isOrdering,
  isOpen: controlledIsOpen,
  onToggle,
  selectedItemName,
}) => {
  const { t } = useTranslation();

  // Used when Section is not controlled by the parent.
  const [internalIsOpen, setInternalIsOpen] = useState(false);

  // If parent provides isOpen, use it.
  // Otherwise use the original internal state.
  const isOpen = controlledIsOpen ?? internalIsOpen;

  const toggleSection = () => {
    if (controlledIsOpen !== undefined) {
      onToggle?.();
      return;
    }

    setInternalIsOpen((current) => !current);
  };

  // When a product was selected through search,
  // scroll directly to it after the section opens.
  useEffect(() => {
    if (!isOpen || !selectedItemName) return;

    const itemId = `menu-item-${createSlug(section.name)}-${createSlug(
      selectedItemName,
    )}`;

    const frame = requestAnimationFrame(() => {
      document.getElementById(itemId)?.scrollIntoView({
        behavior: "smooth",
        block: "center",
      });
    });

    return () => cancelAnimationFrame(frame);
  }, [isOpen, selectedItemName, section.name]);

  return (
    <Box className="mb-5 cursor-pointer rounded-lg shadow-md transition-colors">
      <Flex
        justify="between"
        align="center"
        px="4"
        py="3"
        className="rounded-t-lg"
        style={{ backgroundColor: "var(--accent-9)" }}
        onClick={toggleSection}
      >
        <Flex direction="column" align="start">
          <Text size="3" weight="bold" className="text-white">
            {t(section.name)}
          </Text>

          <Text size="2" weight="bold" className="text-white">
            {t(section.description)}
          </Text>
        </Flex>

        <Flex justify="end" className="ml-auto">
          {isOpen ? (
            <ChevronUpIcon className="h-5 w-5 text-white" />
          ) : (
            <ChevronDownIcon className="h-5 w-5 text-white" />
          )}
        </Flex>
      </Flex>

      {section.labelImage && (
        <img
          src={section.labelImage}
          alt={`${section.name} label`}
          className="h-auto w-full rounded-b-lg object-cover"
          onClick={toggleSection}
        />
      )}

      {isOpen && (
        <Box px="4" py="3">
          {section.items.map((item, index) => {
            const itemName = item.name ?? "";

            const itemId = `menu-item-${createSlug(
              section.name,
            )}-${createSlug(itemName)}`;

            const isSelected = selectedItemName === itemName;

            return (
              <div
                key={`${section.name}-${itemName || index}`}
                id={itemId}
                className={
                  isSelected
                    ? "rounded-xl ring-2 ring-[#5AD7D9]/40 transition-all"
                    : ""
                }
              >
                <MenuItem
                  item={item}
                  addToCart={addToCart}
                  isOrdering={isOrdering}
                />
              </div>
            );
          })}
        </Box>
      )}
    </Box>
  );
};

export default Section;
