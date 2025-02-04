import { FC, useState } from "react";

interface JobCardProps {
  title: string;
  description: string;
  qualifications: string[];
}

const JobCard: FC<JobCardProps> = ({ title, description, qualifications }) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div
      className="border border-gray-300 rounded-lg p-4 shadow-lg transition-all cursor-pointer sm:p-6"
      style={{
        boxShadow: isOpen
          ? "0px 4px 10px #fa994f"
          : "0px 2px 5px rgba(0,0,0,0.1)",
      }}
      onClick={() => setIsOpen(!isOpen)}
    >
      <h2 className="text-lg sm:text-xl font-semibold text-[#fa994f]">
        {title}
      </h2>
      {isOpen && (
        <div className="mt-2 text-sm sm:text-base text-gray-700">
          <p className="font-semibold">Role Description:</p>
          <p>{description}</p>
          <p className="font-semibold mt-2">Qualifications:</p>
          <ul className="list-disc list-inside">
            {qualifications.map((qualification, index) => (
              <li key={index}>{qualification}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default JobCard;
