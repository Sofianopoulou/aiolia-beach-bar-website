import { Link } from "@remix-run/react";
import { Button } from "~/components/ui/Button";
import { Text } from "~/components/ui/Text";
import { Flex, Box } from "@radix-ui/themes";
import img from "../assets/beach-bar.jpg";

export default function MainSection() {
  return (
    <Box
      className="relative w-full h-[64vh] bg-cover bg-center overflow-hidden"
      style={{ backgroundImage: `url(${img})` }}
    >
      <Flex
        className="absolute inset-0 pt-[10%] "
        align="start"
        justify="start"
        direction="column"
        p="5"
        py="9"
      >
        <Box
          p="4"
          className="bg-transparent border-4 border-[#5ad7d9] rounded-[18px] w-fit max-w-[90%] space-y-6"
        >
          <Flex direction="column" align="start" gap="2">
            <Text
              className="font-bold text-[2rem] text-white font-['Roboto']"
              translate="no"
            >
              Aiolia Beach Bar
            </Text>
            <Text
              className="font-bold text-[1.5rem] text-white font-['Roboto'] pb-4"
              translate="no"
            >
              Your Seaside Experience - Nea Anchialos
            </Text>
          </Flex>
          <Button radius="full" size="3" variant="solid">
            <Link to="/menu" className="text-white no-underline ">
              <Text className="font-bold">View Menu</Text>
            </Link>
          </Button>
        </Box>
      </Flex>
    </Box>
  );
}
