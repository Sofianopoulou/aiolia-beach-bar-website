import React from "react";
import { MenuItem as MenuItemType } from "../types/types";
import { Heading } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

interface MenuItemProps {
  item: MenuItemType;
}

const MenuItem: React.FC<MenuItemProps> = ({ item }) => {
  const { t } = useTranslation();

  return (
    <div className="flex items-center py-2 border-b border-gray-300 relative overflow-hidden">
      {item.image && (
        <div className="w-[70px] h-[70px] mr-2 rounded-lg overflow-hidden flex-shrink-0 flex justify-center items-center">
          <img
            src={item.image}
            alt={item.name}
            className="w-full h-full object-cover rounded-lg"
          />
        </div>
      )}
      <div className="flex flex-col justify-center w-[calc(100%-80px)] pl-0">
        <div className="flex justify-between items-center w-full">
          <Heading as="h3" className="text-lg text-gray-800 m-0 pl-0">
            {t(item.name)}
          </Heading>
          <p className="font-bold text-[#fa994f] absolute right-2 top-2">
            {item.price}
          </p>
        </div>
        <div className="mt-2">
          <p className="text-gray-600 m-0 pl-0">{t(item.description)}</p>
          {item.label && (
            <span className="bg-[#fae4d3] py-0.5 px-2 rounded text-xs text-gray-800 font-bold mt-2 inline-block">
              {item.label}
            </span>
          )}
        </div>
      </div>
    </div>
  );
};

export default MenuItem;
