import React, { useState } from "react";
import { Section as SectionType } from "../types/types";
import { Flex, Box } from "@radix-ui/themes";
import MenuItem from "./MenuItem";
import { useTranslation } from "react-i18next";
import { ChevronUpIcon, ChevronDownIcon } from "@heroicons/react/24/outline";
import { Text } from "./ui/Text";

interface SectionProps {
  section: SectionType;
}

const Section: React.FC<SectionProps> = ({ section }) => {
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  return (
    <Box className="mb-5 rounded-lg shadow-md transition-colors cursor-pointer">
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
          className="w-full h-auto object-cover rounded-b-lg"
          onClick={toggleSection}
        />
      )}

      {isOpen && (
        <Box px="4" py="3">
          {section.items.map((item, index) => (
            <MenuItem key={index} item={item} />
          ))}
        </Box>
      )}
    </Box>
  );
};

export default Section;
