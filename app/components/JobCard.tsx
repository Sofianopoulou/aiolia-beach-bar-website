import { FC } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDownIcon, ClockIcon, MapPinIcon } from "@heroicons/react/24/outline";

interface JobCardProps {
  title: string;
  summary: string;
  description: string;
  qualifications: string[];
}

const JobCard: FC<JobCardProps> = ({
  title,
  summary,
  description,
  qualifications,
}) => {
  const { t } = useTranslation();
  const mailto = `mailto:info@aiolia.gr?subject=${encodeURIComponent(
    `Application: ${title}`,
  )}`;

  return (
    <article className="flex h-full flex-col rounded-2xl border border-[#eadfd7] bg-white p-6 shadow-[0_5px_20px_rgba(56,35,20,0.06)] transition-shadow hover:shadow-[0_10px_28px_rgba(56,35,20,0.12)] sm:p-7">
      <div className="flex-1">
        <div className="mb-4 flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#fff2e8] px-3 py-1 text-xs font-semibold text-[#93470f]">
            <ClockIcon aria-hidden="true" className="h-4 w-4" />
            {t("Full-time")}
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-[#eafafa] px-3 py-1 text-xs font-semibold text-[#176b6d]">
            <MapPinIcon aria-hidden="true" className="h-4 w-4" />
            {t("On-site · Nea Anchialos")}
          </span>
        </div>

        <h3 className="text-2xl font-bold text-[#25211e]">{title}</h3>
        <p className="mt-2 leading-6 text-gray-700">{summary}</p>

        <details className="group mt-5 border-t border-gray-100 pt-4">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-md py-1 font-semibold text-[#fa994f] outline-none focus-visible:ring-2 focus-visible:ring-[#fa994f] focus-visible:ring-offset-2 [&::-webkit-details-marker]:hidden">
            {t("Role details and qualifications")}
            <ChevronDownIcon
              aria-hidden="true"
              className="h-5 w-5 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none"
            />
          </summary>
          <div className="pt-4 text-sm leading-6 text-gray-700">
            <h4 className="font-bold text-gray-900">{t("What you'll do")}</h4>
            <p className="mt-1">{description}</p>
            <h4 className="mt-4 font-bold text-gray-900">
              {t("What we're looking for")}
            </h4>
            <ul className="mt-2 space-y-2">
              {qualifications.map((qualification) => (
                <li key={qualification} className="flex gap-2">
                  <span
                    aria-hidden="true"
                    className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-[#fa994f]"
                  />
                  <span>{qualification}</span>
                </li>
              ))}
            </ul>
          </div>
        </details>
      </div>

      <a
        href={mailto}
        className="mt-6 inline-flex min-h-11 items-center justify-center rounded-full border-2 border-[#fa994f] bg-transparent px-5 py-2.5 text-center font-bold text-[#fa994f] transition-colors hover:border-[#d96c20] hover:text-[#d96c20] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a94f0c]"
      >
        {t("Apply by email")}
      </a>
    </article>
  );
};

export default JobCard;
