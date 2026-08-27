import React, { useState } from "react";
import {
  MenuItem as MenuItemType,
  type OrderableMenuItem,
} from "../types/types";
import { Flex, Box, Badge, Text } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

interface MenuItemProps {
  item: MenuItemType;
  productId: string;
  addToCart?: (item: OrderableMenuItem) => void;
  isOrdering?: boolean;
}

const MenuItem: React.FC<MenuItemProps> = ({
  item,
  productId,
  addToCart,
  isOrdering,
}) => {
  const { t } = useTranslation();
  const [imageLoaded, setImageLoaded] = useState(false);

  return (
    <Flex
      align="center"
      justify="between"
      className="relative overflow-hidden border-b border-gray-300 py-2"
    >
      {item.image && (
        <Box className="relative mr-4 h-[70px] w-[70px] flex-shrink-0 overflow-hidden rounded-lg">
          {!imageLoaded && (
            <Flex
              align="center"
              justify="center"
              className="absolute inset-0 bg-gray-100"
            >
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-300 border-t-[var(--accent-9)]" />
            </Flex>
          )}

          <img
            src={item.image}
            alt={item.name}
            onLoad={() => setImageLoaded(true)}
            className={`h-full w-full rounded-lg object-cover transition-opacity duration-300 ${
              imageLoaded ? "opacity-100" : "opacity-0"
            }`}
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

          <Flex align="center" gap="2" className="ml-auto">
            {item.price && (
              <Text size="3" weight="bold" style={{ color: "var(--accent-9)" }}>
                {item.price}
              </Text>
            )}

            {isOrdering && addToCart && item.name && item.price && (
              <button
                type="button"
                onClick={() =>
                  addToCart({
                    productId,
                    name: item.name,
                    price: item.price,
                  })
                }
                className="rounded-md bg-[var(--accent-9)] px-2 py-1 text-sm text-white"
              >
                +
              </button>
            )}
          </Flex>
        </Flex>

        {item.description && (
          <Text size="2" color="gray">
            {t(item.description)}
          </Text>
        )}
      </Flex>
    </Flex>
  );
};

export default MenuItem;
