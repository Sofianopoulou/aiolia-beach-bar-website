import { FC } from "react";
import { useTranslation } from "react-i18next";
import JobCard from "~/components/JobCard";
import beachImage from "../assets/beach-bar.webp";

interface Job {
  title: string;
  summary: string;
  description: string;
  qualifications: string[];
}

const jobPositions: Job[] = [
  {
    title: "Bartender",
    summary: "Create great drinks and make every guest feel welcome.",
    description:
      "Prepare and serve cocktails, drinks, and coffee with friendly, attentive service. Keep the bar organized, clean, and ready for a smooth service.",
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
    summary: "Welcome guests and help create a relaxed seaside experience.",
    description:
      "Welcome guests, take orders, and provide warm, efficient service. Help keep tables and the dining area clean, organized, and ready for guests.",
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
    summary: "Prepare fresh dishes with care and consistent quality.",
    description:
      "Prepare and present dishes to a consistent standard. Help keep kitchen operations running smoothly while maintaining cleanliness and food-safety practices.",
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
    <main className="bg-[#fffaf5] pb-16">
      <section className="relative isolate flex min-h-[25rem] items-center overflow-hidden bg-[#171717] sm:min-h-[30rem]">
        <img
          src={beachImage}
          alt={t("Aiolia Beach Bar's warmly lit wooden terrace at night")}
          className="absolute inset-0 -z-20 h-full w-full object-cover object-center"
        />
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-black/80 via-black/55 to-black/20" />
        <div className="mx-auto w-full max-w-6xl px-6 py-16 sm:px-10 lg:px-12">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.2em] text-[#5ad7d9]">
            {t("Careers at Aiolia")}
          </p>
          <h1 className="max-w-2xl text-4xl font-extrabold leading-tight text-white sm:text-5xl lg:text-6xl">
            {t("Join Our Team")}
          </h1>
          <p className="mt-5 max-w-xl text-base leading-7 text-white/90 sm:text-lg">
            {t(
              "Work by the sea, bring great hospitality to life, and be part of the team at Aiolia Beach Bar in Nea Anchialos.",
            )}
          </p>
          <a
            href="#open-roles"
            className="mt-8 inline-flex min-h-12 items-center justify-center rounded-full border-2 border-[#fa994f] bg-transparent px-6 py-3 font-bold text-[#fa994f] transition-colors hover:border-[#ffad68] hover:text-[#ffad68] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-white"
          >
            {t("Explore open roles")}
          </a>
        </div>
      </section>

      <section
        id="open-roles"
        className="mx-auto max-w-6xl scroll-mt-24 px-6 py-14 sm:px-10 lg:px-12 lg:py-20"
      >
        <div className="mb-8 max-w-2xl sm:mb-10">
          <p className="mb-2 text-sm font-bold uppercase tracking-[0.16em] text-[#d96c20]">
            {t("Find your place")}
          </p>
          <h2 className="text-3xl font-bold text-[#222222] sm:text-4xl">
            {t("Open roles")}
          </h2>
          <p className="mt-3 text-base leading-7 text-gray-700">
            {t(
              "All listed positions are full-time and on-site in Nea Anchialos. Open a role to see the details and what we are looking for.",
            )}
          </p>
        </div>

        <div className="grid gap-5 lg:grid-cols-2">
          {jobPositions.map((job) => (
            <JobCard
              key={job.title}
              title={t(job.title)}
              summary={t(job.summary)}
              description={t(job.description)}
              qualifications={job.qualifications.map((qualification) =>
                t(qualification),
              )}
            />
          ))}
        </div>

        <div className="mt-10 flex flex-col items-start justify-between gap-4 rounded-2xl border border-[#f3d5bf] bg-white p-6 sm:flex-row sm:items-center sm:p-8">
          <div>
            <h2 className="text-xl font-bold text-[#222222]">
              {t("Don't see your role?")}
            </h2>
            <p className="mt-1 text-gray-700">
              {t("We'd still be glad to hear from you.")}
            </p>
          </div>
          <a
            href="mailto:info@aiolia.gr?subject=Working%20at%20Aiolia"
            className="inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#fa994f] bg-transparent px-5 py-2.5 font-bold text-[#fa994f] transition-colors hover:border-[#d96c20] hover:text-[#d96c20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#fa994f]"
          >
            {t("Email us")}
          </a>
        </div>
      </section>
    </main>
  );
};

export default Jobs;
