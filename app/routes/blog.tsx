import { useEffect } from "react";

export default function BlogRoute() {
  useEffect(() => {
    const script = document.createElement("script");
    script.src =
      "https://app.trysoro.com/api/embed/b0172ace-1763-47d7-862d-611d3afc2a8a";
    script.defer = true;

    document.body.appendChild(script);

    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <div className="container mx-auto px-4 py-10 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 text-orange-500">Our Blog</h1>
      <div id="soro-blog" className="w-full"></div>
    </div>
  );
}
