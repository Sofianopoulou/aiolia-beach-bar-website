import { Box, Flex } from "@radix-ui/themes";
import { useTranslation } from "react-i18next";

const images = [
  {
    src: "/carousel-images/optimized/aiolia-outdoors.webp",
    text: "Find your inner peace",
    alt: "Aiolia's outdoor dining terrace seen through a circular opening",
  },
  {
    src: "/carousel-images/optimized/by-night.webp",
    text: "Eternal memories",
    alt: "Guests dining on Aiolia's terrace beneath trees and warm lights at night",
  },
  {
    src: "/carousel-images/optimized/calimte.webp",
    text: "Unforgettable cocktails",
    alt: "A lime cocktail with a salt rim on a wooden table",
  },
  {
    src: "/carousel-images/optimized/cocktail-party.webp",
    text: "Shared between friends",
    alt: "A selection of colorful cocktails served together",
  },
  {
    src: "/carousel-images/optimized/melon-drink.webp",
    text: "Worth the journey",
    alt: "A guest holding a drink by the seaside",
  },
  {
    src: "/carousel-images/element.webp",
    text: "Element of Style",
    alt: "A citrus cocktail viewed from above with lime and garnish",
  },
  {
    src: "/carousel-images/optimized/mojito.webp",
    text: "Feeling thirsty?",
    alt: "A mojito with mint served beside the shore",
  },
  {
    src: "/carousel-images/optimized/sunset.webp",
    text: "Sunset Bliss",
    alt: "Aiolia's seaside terrace at sunset",
  },
  {
    src: "/carousel-images/optimized/floral.webp",
    text: "Floral Paradise",
    alt: "A purple cocktail garnished with a flower",
  },
];

const InteractiveGrid = () => {
  const { t } = useTranslation();

  return (
    <Box className="p-4">
      <Flex
        className="gap-4"
        direction={{ initial: "row", md: "row" }}
        wrap="wrap"
        justify="center"
      >
        {images.map(({ src, text, alt }, index) => (
          <Box
            key={index}
            className="relative overflow-hidden rounded-lg group w-full md:w-1/3 lg:w-1/4"
          >
            <img
              src={src}
              alt={t(alt)}
              loading="lazy"
              decoding="async"
              className="w-full h-72 object-cover transition-transform duration-300 group-hover:scale-110 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
            />
            <Box className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-300 motion-reduce:transition-none">
              <Flex align="center" justify="center" className="h-full">
                <Box className="text-white text-lg font-bold text-center">
                  {text}
                </Box>
              </Flex>
            </Box>
          </Box>
        ))}
      </Flex>
    </Box>
  );
};

export default InteractiveGrid;
