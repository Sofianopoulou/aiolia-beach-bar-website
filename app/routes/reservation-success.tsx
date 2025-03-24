export default function ReservationSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-r from-[#5ad7d9] to-[#fa994f] p-6 sm:p-8">
      <div className="bg-white shadow-lg rounded-lg p-8 max-w-md w-full text-center">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-[#fa994f] mb-4">
          Reservation Confirmed
        </h1>
        <p className="text-lg sm:text-xl text-gray-700 mb-4">
          We’ve received your reservation! We're excited to have you with us.
        </p>
        <div className="mt-6">
          <p className="text-xl sm:text-2xl font-semibold text-[#5ad7d9]">
            We look forward to seeing you!
          </p>
        </div>
        <div className="mt-6 text-[#fa994f] font-extrabold text-2xl sm:text-3xl">
          <span className="block animate-funFold">Cheers!</span>
        </div>
        <div className="mt-8">
          <a
            href="/"
            className="inline-block bg-[#fa994f] text-white px-8 py-3 rounded-lg text-lg font-semibold hover:bg-[#f27e2b] transition-colors"
          >
            Go Back to Home
          </a>
        </div>
      </div>
    </div>
  );
}
