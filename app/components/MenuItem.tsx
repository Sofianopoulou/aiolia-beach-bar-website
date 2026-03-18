import React from "react";
import { MenuItem as MenuItemType } from "../types/types";
import { Flex, Box, Badge, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

interface MenuItemProps {
  item: MenuItemType;
  addToCart?: (item: MenuItemType) => void;
  isOrdering?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({ item, addToCart, isOrdering }) => {
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

          {/* PRICE + BUTTON */}
          <Flex align="center" gap="2" className="ml-auto">
            <Text size="3" weight="bold" style={{ color: "var(--accent-9)" }}>
              {item.price}
            </Text>

            {isOrdering && addToCart && (
              <button
                onClick={() => addToCart(item)}
                className="px-2 py-1 bg-[var(--accent-9)] text-white rounded-md text-sm"
              >
                +
              </button>
            )}
          </Flex>
        </Flex>
        <Text size="2" color="gray">
          {t(item.description)}
        </Text>
      </Flex>
    </Flex>
  );
};

export default MenuItem;
