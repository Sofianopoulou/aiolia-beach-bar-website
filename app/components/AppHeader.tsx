import { useState } from "react";
import { Link } from "@remix-run/react";
import { Button, Flex } from "@radix-ui/themes";
import logo from "../assets/logo.png";
import { ProgressBar } from "./ProgressBar";

export default function AppHeader() {
  const [isMobileMenuOpen, setMobileMenuOpen] = useState(false);

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <>
      <Header>
        <ProgressBar />
        <Flex className="w-full flex justify-between items-center px-4 py-3">
          <Link to="/" className="logo">
            <img src={logo} alt="Aiolia Beach Bar Logo" className="h-12" />
          </Link>
          <Flex className="hidden md:flex gap-4">
            <Button
              asChild
              className="bg-white text-bg-[#fa994f] text-[#fa994f] font-bold py-2 px-4 rounded-full border-2 border-[#fa994f] transition hover:bg-opacity-20 hover:scale-105"
            >
              <Link to="/blog">Blog</Link>
            </Button>
            <Button
              asChild
              className="bg-white text-bg-[#fa994f] text-[#fa994f] font-bold py-2 px-4 rounded-full border-2 border-[#fa994f] transition hover:bg-opacity-20 hover:scale-105"
            >
              <Link to="/akademy">Aiolia Akademy</Link>
            </Button>
            <Button
              asChild
              className="bg-white text-bg-[#fa994f] text-[#fa994f] font-bold py-2 px-4 rounded-full border-2 border-[#fa994f] transition hover:bg-opacity-20 hover:scale-105"
            >
              <Link to="/menu">Menu</Link>
            </Button>
          </Flex>
          <button
            className="block md:hidden text-[#fa994f] text-3xl"
            onClick={toggleMobileMenu}
          >
            &#9776;
          </button>
        </Flex>
        {isMobileMenuOpen && (
          <Flex className="absolute top-14 left-0 right-0 bg-white flex flex-col items-center py-4 shadow-md">
            <Button
              asChild
              className="w-full text-center py-4 border-2 border-[#fa994f] rounded-lg mb-2 text-[#fa994f] font-bold"
            >
              <Link to="/blog">Blog</Link>
            </Button>
            <Button
              asChild
              className="w-full text-center py-4 border-2 border-[#fa994f] rounded-lg mb-2 text-[#fa994f] font-bold"
            >
              <Link to="/akademy">Aiolia Akademy</Link>
            </Button>
            <Button
              asChild
              className="w-full text-center py-4 border-2 border-[#fa994f] rounded-lg mb-2 text-[#fa994f] font-bold"
            >
              <Link to="/menu">Menu</Link>
            </Button>
          </Flex>
        )}
      </Header>
    </>
  );
}

interface HeaderProps {
  children: React.ReactNode;
}

export function Header({ children }: HeaderProps) {
  return (
    <div className="fixed top-0 left-0 w-full flex flex-col bg-white shadow-lg z-10">
      {children}
    </div>
  );
}
