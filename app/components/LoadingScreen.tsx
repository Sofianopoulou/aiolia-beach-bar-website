import { BeakerIcon } from "@heroicons/react/24/outline";

export default function LoadingScreen() {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-b from-orange-400 to-orange-500">
      <div className="text-center">
        <div className="animate-spin text-[#5ad7d9] mb-5">
          <BeakerIcon className="h-20 w-20" aria-hidden="true" />
        </div>
        <h1 className="text-2xl text-white font-bold">
          Shaking up your drinks...
        </h1>
      </div>
    </div>
  );
}
