import { Swiper, SwiperSlide } from "swiper/react";
import { EffectFade, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/autoplay";
import "swiper/css/effect-fade";

const images = [
  "carousel-images/aiolia-outdoors.jpg",
  "carousel-images/by-night.jpg",
  "carousel-images/calimte.jpg",
  "carousel-images/cocktail-party.jpg",
  "carousel-images/element.jpg",
  "carousel-images/mojito.jpg",
  "carousel-images/sunset.jpg",
  "carousel-images/floral.jpg",
  "carousel-images/dj-night.jpg",
];

const MainCarousel = () => {
  return (
    <div className="w-full max-w-6xl mx-auto py-8 px-4">
      <Swiper
        modules={[Autoplay]}
        autoplay={{ delay: 3000, disableOnInteraction: false }}
        slidesPerView={1}
        breakpoints={{
          768: { slidesPerView: 3, spaceBetween: 16 },
        }}
        loop
        speed={800}
        className="rounded-lg shadow-lg"
      >
        {images.map((src, index) => (
          <SwiperSlide key={index}>
            <div className="overflow-hidden rounded-lg">
              <img
                src={src}
                alt={`Beach bar ${index + 1}`}
                className="w-full h-72 object-cover transition-transform duration-300 hover:scale-105"
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>
    </div>
  );
};

export default MainCarousel;
