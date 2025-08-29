import { useTranslation } from "react-i18next";
import MainCarousel from "~/components/InteractiveGrid";

export default function Info() {
  const { t } = useTranslation();

  return (
    <div className="space-y-6 pt-4 pb-4">
      {" "}
      <div className="p-6 bg-white rounded-lg shadow-lg max-w-[90%] mx-auto text-center border border-gray-200">
        <h3 className="text-2xl text-gray-800 mb-4 font-sans">
          {t("Welcome to Aiolia Beach Bar")}
        </h3>
        <p className="text-base leading-7 text-gray-600 mb-4 font-sans">
          {t(
            "At Aiolia, we curate an unparalleled dining experience, offering mouthwatering delights that captivate your taste buds. Immerse yourself in the heart of seaside bliss as you savor our signature cocktails, gourmet pizzas, crisp salads, and aromatic coffee. Our commitment to consistent quality ensures every visit is a culinary journey. Unwind, relish delicious fare, and let the beach vibes elevate your moments. Aiolia, your ultimate destination in Nea Anchialos and Volos. Cheers to shared memories and flavors that linger!"
          )}{" "}
          🏖️🍹
        </p>
      </div>
      {/* <div className="p-6 bg-white rounded-lg shadow-lg max-w-[90%] mx-auto text-center border border-gray-200">
        <MainCarousel />
      </div> */}
      <MainCarousel />
      <div className="p-6 bg-white rounded-lg shadow-lg max-w-[90%] mx-auto text-center border border-gray-200">
        <p className="text-xl leading-7 text-gray-700 mb-4 font-sans">
          ⏰ {t("From 19:00 till late at night October - April")}
        </p>
        <p className="text-xl leading-7 text-gray-700 mb-4 font-sans">
          ⏰ {t("From 10:00 till late at night May - September")}
        </p>
        <p className="text-xl leading-7 text-gray-700 mb-4 font-sans">
          🍸 {t("Coffee, Drinks, Cocktails")}
        </p>
        <p className="text-xl leading-7 text-gray-700 mb-4 font-sans">
          🥪 {t("Pizza, Salads, Desserts")}
        </p>
        <p className="text-xl leading-7 text-gray-700 mb-4 font-sans">
          📌 {t("Nea Anchialos | Volos")}
        </p>
      </div>
    </div>
  );
}
