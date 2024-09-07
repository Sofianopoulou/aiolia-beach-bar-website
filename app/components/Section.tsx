import React, { useState } from "react";
import { Section as SectionType } from "../types/types";
import { Flex } from "@radix-ui/themes";
import MenuItem from "./MenuItem";

interface SectionProps {
  section: SectionType;
}

const Section: React.FC<SectionProps> = ({ section }) => {
  const [isOpen, setIsOpen] = useState(false);

  const toggleSection = () => {
    setIsOpen(!isOpen);
  };

  return (
    <div
      className={`mb-5 bg-white rounded-lg shadow-md transition-colors cursor-pointer ${
        isOpen ? "bg-white" : ""
      }`}
      onClick={toggleSection}
    >
      <Flex className="flex justify-between items-center p-4 bg-[#fa994f] rounded-t-lg">
        <div className="flex flex-col items-start">
          <h2 className="text-white font-bold">{section.name}</h2>
          <p className="text-white text-sm font-bold">{section.description}</p>
        </div>
        <span className="text-white text-lg">{isOpen ? "▲" : "▼"}</span>
      </Flex>

      {section.labelImage && (
        <img
          src={section.labelImage}
          alt={`${section.name} label`}
          className="w-full object-scale-down rounded-b-lg"
        />
      )}

      {isOpen && (
        <div className="p-4">
          {section.items.map((item, index) => (
            <MenuItem key={index} item={item} />
          ))}
        </div>
      )}
    </div>
  );
};

export default Section;
