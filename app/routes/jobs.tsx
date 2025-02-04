import { FC } from "react";
import JobCard from "~/components/JobCard";
import { useTranslation } from "react-i18next";

interface Job {
  title: string;
  description: string;
  qualifications: string[];
}

const jobPositions: Job[] = [
  {
    title: "Bartender",
    description:
      "This is a full-time on-site role for a Bartender at Aiolia Beach Bar in Néa Anchiálos. The Bartender will be responsible for providing exceptional customer service, preparing and serving drinks, and maintaining cleanliness and organization of the bar area.",
    qualifications: [
      "Customer Service and Communication skills",
      "Experience in Food & Beverage and Bartending",
      "Ability to work well in a fast-paced environment",
      "Excellent interpersonal skills and a friendly demeanor",
      "Knowledge of cocktail recipes and drink preparation",
      "Attention to detail and cleanliness",
      "Cash Handling proficiency",
      "Prior experience in a bar or restaurant setting is a plus",
    ],
  },
  {
    title: "Service Staff (Waiter/Waitress)",
    description:
      "This is a full-time on-site role for a Service Staff (Waiter/Waitress) member at Aiolia Beach Bar in Néa Anchiálos. The Service Staff will be responsible for taking orders while providing friendly and efficient customer service. The Service Staff will also be responsible for maintaining the cleanliness and organization of the tables area.",
    qualifications: [
      "Strong communication skills and a friendly attitude",
      "Prior experience in hospitality or food service is a plus",
      "Ability to work in a fast-paced, team-oriented environment",
      "Basic sales and customer service skills",
      "Comfortable handling transactions and orders efficiently",
    ],
  },
  {
    title: "Chef",
    description:
      "This is a full-time on-site role for a Chef at Aiolia Beach Bar in Néa Anchiálos. The Chef will be responsible for preparing and presenting high-quality dishes while ensuring consistent food quality and presentation. The Chef will also be responsible for managing kitchen operations and maintaining cleanliness.",
    qualifications: [
      "Experience as a chef or cook in a professional kitchen is a plus",
      "Passion for fresh ingredients and innovative flavors",
      "Ability to work efficiently under pressure",
      "Strong knowledge of food safety and hygiene regulations",
      "A team player with excellent organizational skills",
    ],
  },
];

const Jobs: FC = () => {
  const { t } = useTranslation();

  return (
    <div className="max-w-md mx-auto p-4 sm:p-6 md:p-8">
      <h1 className="text-2xl sm:text-3xl font-bold text-center text-[#fa994f] mb-4 sm:mb-6">
        {t("Join Our Team")}
      </h1>
      <p className="text-center mb-4 sm:mb-6 text-gray-700 text-sm sm:text-base">
        {t(
          "Interested in working with us? Explore our open positions and send your CV to"
        )}
        <a href="mailto:info@aiolia.gr" className="text-[#5ad7d9] font-bold">
          {" "}
          info@aiolia.gr
        </a>
        .
      </p>
      <div className="space-y-3 sm:space-y-4">
        {jobPositions.map((job, index) => (
          <JobCard
            key={index}
            title={job.title}
            description={t(job.description)}
            qualifications={job.qualifications.map((qualification) =>
              t(qualification)
            )}
          />
        ))}
      </div>
    </div>
  );
};

export default Jobs;
