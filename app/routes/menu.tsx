import React, { useEffect, useState } from "react";
import Section from "~/components/Section";
import { MenuData } from "../types/types";
import LoadingScreen from "~/components/LoadingScreen";

const MenuPage: React.FC = () => {
  const [data, setData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/menu.json");
        console.log(response);
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const result: MenuData = await response.json();
        setData(result);
      } catch (error) {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  if (loading) return <p>Shaking up your drinks...</p>;
  if (error) return <p>{error}</p>;
  if (!data) return <p>No data available</p>;

  return (
    <div className="p-5 bg-gray-100">
      {data.sections.map((section, index) => (
        <Section key={index} section={section} />
      ))}
    </div>
  );
};

export default MenuPage;
