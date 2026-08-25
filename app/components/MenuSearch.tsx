import { useEffect, useRef, useState } from "react";

export type SearchProduct = {
  name: string;
  sectionName: string;
  price: string;
  image?: string;
};

type MenuSearchProps = {
  query: string;
  onQueryChange: (query: string) => void;
  products: SearchProduct[];
  onSelect: (product: SearchProduct) => void;
};

export function MenuSearch({
  query,
  onQueryChange,
  products,
  onSelect,
}: MenuSearchProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(-1);

  const containerRef = useRef<HTMLDivElement>(null);

  const normalizedQuery = query.trim().toLowerCase();

  const suggestions =
    normalizedQuery.length > 0
      ? products
          .filter((product) =>
            (product.name ?? "").toLowerCase().includes(normalizedQuery),
          )
          .slice(0, 6)
      : [];

  // Close autocomplete when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
        setActiveIndex(-1);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleSelect = (product: SearchProduct) => {
    onSelect(product);

    setIsOpen(false);
    setActiveIndex(-1);
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    // Escape closes autocomplete
    if (event.key === "Escape") {
      setIsOpen(false);
      setActiveIndex(-1);
      return;
    }

    if (!isOpen || suggestions.length === 0) {
      return;
    }

    // Move down
    if (event.key === "ArrowDown") {
      event.preventDefault();

      setActiveIndex((current) =>
        current < suggestions.length - 1 ? current + 1 : 0,
      );
    }

    // Move up
    if (event.key === "ArrowUp") {
      event.preventDefault();

      setActiveIndex((current) =>
        current > 0 ? current - 1 : suggestions.length - 1,
      );
    }

    // Select active suggestion
    if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();

      handleSelect(suggestions[activeIndex]);
    }
  };

  return (
    <div ref={containerRef} className="relative mx-auto w-full max-w-xl">
      <div className="relative">
        {/* Search icon */}
        <div className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8" />
            <path d="m21 21-4.3-4.3" />
          </svg>
        </div>

        {/* Search input */}
        <input
          type="text"
          value={query}
          placeholder="Search food, drinks, cocktails..."
          onChange={(event) => {
            onQueryChange(event.target.value);
            setIsOpen(true);
            setActiveIndex(-1);
          }}
          onFocus={() => {
            if (query.trim()) {
              setIsOpen(true);
            }
          }}
          onKeyDown={handleKeyDown}
          autoComplete="off"
          className="
            w-full
            rounded-full
            border
            border-gray-200
            bg-white
            py-3.5
            pl-12
            pr-12
            text-base
            shadow-sm
            outline-none
            transition
            placeholder:text-gray-400
            focus:border-[#5AD7D9]
            focus:ring-2
            focus:ring-[#5AD7D9]/20
          "
        />

        {/* Clear button */}
        {query && (
          <button
            type="button"
            onClick={() => {
              onQueryChange("");
              setIsOpen(false);
              setActiveIndex(-1);
            }}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-xl text-gray-400 transition hover:text-gray-700"
            aria-label="Clear search"
          >
            ×
          </button>
        )}
      </div>

      {/* Autocomplete dropdown */}
      {isOpen && normalizedQuery && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-xl">
          {suggestions.length > 0 ? (
            suggestions.map((product, index) => (
              <button
                key={`${product.sectionName}-${product.name}`}
                type="button"
                onClick={() => handleSelect(product)}
                onMouseEnter={() => setActiveIndex(index)}
                className={`
                  flex
                  w-full
                  items-center
                  gap-3
                  px-4
                  py-3
                  text-left
                  transition
                  ${
                    activeIndex === index
                      ? "bg-gray-50"
                      : "bg-white hover:bg-gray-50"
                  }
                `}
              >
                {/* Product image */}
                {product.image && (
                  <img
                    src={`/${product.image}`}
                    alt={product.name}
                    className="h-12 w-12 shrink-0 rounded-xl object-cover"
                  />
                )}

                {/* Product information */}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-gray-800">
                    {product.name}
                  </p>

                  <p className="text-xs text-gray-400">{product.sectionName}</p>
                </div>

                {/* Price */}
                <span className="shrink-0 text-sm font-semibold text-gray-700">
                  {product.price}
                </span>
              </button>
            ))
          ) : (
            <div className="px-5 py-4 text-sm text-gray-500">
              No products found
            </div>
          )}
        </div>
      )}
    </div>
  );
}
