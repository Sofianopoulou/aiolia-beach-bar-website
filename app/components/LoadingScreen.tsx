import { BiDrink } from "react-icons/bi";

export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-orange-400 to-orange-500">
      <div className="text-center">
        <div className="animate-spin text-[#5ad7d9] mb-5">
          <BiDrink size={80} />
        </div>
        <h1 className="text-2xl text-white font-bold">
          Shaking up your drinks...
        </h1>
      </div>
    </div>
  );
}
