import React from "react";
import { Link } from "@remix-run/react";
import { Button, Flex, Heading } from "@radix-ui/themes";
import img from "../assets/beach-bar.jpg";

export default function MainSection() {
  return (
    <div
      className="relative w-full h-[64vh] bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url(${img})` }}
    >
      <div className="absolute inset-0 flex items-start justify-start text-start p-10 py-48">
        <div className="bg-transparent border-4 border-[#5ad7d9] p-5 rounded-[18px] w-fit max-w-[90%] space-y-6">
          <Heading
            as="h1"
            className="font-bold text-[2rem] text-white font-['Roboto'] "
          >
            Aiolia Beach Bar
          </Heading>
          <Heading
            as="h2"
            className="font-bold text-[1.5rem] text-white font-['Roboto'] pb-4"
          >
            Your Seaside Experience - Nea Anchialos
          </Heading>
          <Button
            asChild
            className="bg-[#fa994f] text-white border-2 border-[#fa994f] rounded-[25px] py-2 px-4 font-bold transition-all duration-300 hover:bg-[#fa994f]/50 hover:scale-105"
          >
            <Link to="/menu" className="text-white no-underline font-bold">
              View Menu
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
