import React from "react";
import { MenuItem as MenuItemType } from "../types/types";
import { Flex, Box, Badge, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

interface MenuItemProps {
  item: MenuItemType;
}

const MenuItem: React.FC<MenuItemProps> = ({ item }) => {
  const { t } = useTranslation();

  return (
    <Flex
      align="center"
      justify="between"
      className="py-2 border-b border-gray-300 relative overflow-hidden"
    >
      {item.image && (
        <Box className="w-[70px] h-[70px] mr-4 rounded-lg overflow-hidden flex-shrink-0">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </Box>
      )}
      <Flex direction="column" className="flex-grow">
        <Flex align="center" justify="between" className="w-full">
          <Flex align="center" gap="2">
            <Text size="3" weight="medium">
              {t(item.name)}
            </Text>
            {item.label && (
              <Badge
                variant="outline"
                style={{ color: "var(--accent-9)" }}
                radius="full"
              >
                {t(item.label)}
              </Badge>
            )}
          </Flex>
          <Text
            size="3"
            weight="bold"
            style={{ color: "var(--accent-9)" }}
            className="ml-auto"
          >
            {item.price}
          </Text>
        </Flex>
        <Text size="2" color="gray">
          {t(item.description)}
        </Text>
      </Flex>
    </Flex>
  );
};

export default MenuItem;
