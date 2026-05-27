import { Box, Flex } from "@radix-ui/themes";

// import "swiper/css";
// import "swiper/css/autoplay";
// import "swiper/css/effect-fade";

const images = [
  {
    src: "carousel-images/aiolia-outdoors.webp",
    text: "Find your inner peace",
  },
  { src: "carousel-images/by-night.webp", text: "Eternal memories" },
  { src: "carousel-images/calimte.webp", text: "Unforgettable cocktails" },
  {
    src: "carousel-images/cocktail-party.webp",
    text: "Shared between friends",
  },
  { src: "carousel-images/melon-drink.webp", text: "Worth the journey" },
  { src: "carousel-images/element.webp", text: "Element of Style" },
  { src: "carousel-images/mojito.webp", text: "Feeling thirsty?" },
  { src: "carousel-images/sunset.webp", text: "Sunset Bliss" },
  { src: "carousel-images/floral.webp", text: "Floral Paradise" },
];

const InteractiveGrid = () => {
  return (
    <Box className="p-4">
      <Flex
        className="gap-4"
        direction={{ initial: "row", md: "row" }}
        wrap="wrap"
        justify="center"
      >
        {images.map(({ src, text }, index) => (
          <Box
            key={index}
            className="relative overflow-hidden rounded-lg group w-full md:w-1/3 lg:w-1/4"
          >
            <img
              src={src}
              alt={text}
              className="w-full h-72 object-cover transition-transform duration-300 group-hover:scale-110"
            />
            <Box className="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
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
