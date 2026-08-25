import { useEffect, useState } from "react";
import { data as json } from "react-router";
import { useFetcher, useNavigate } from "react-router";

import Section from "~/components/Section";
import { MenuData } from "../types/types";
import { sendOrderEmail } from "~/utils/mail.server";
import { useCart } from "~/hooks/useCart";
import { CartDrawer } from "~/components/CartDrawer";
import { MiniBar } from "~/components/MiniBar";
import { MenuSearch, type SearchProduct } from "~/components/MenuSearch";

// ─── ACTION ────────────────────────────────────────────────────────────────

export const action = async ({ request }: any) => {
  const formData = await request.formData();

  const items = JSON.parse(String(formData.get("items") ?? "[]"));
  const total = Number(formData.get("total") ?? 0);
  const type = String(formData.get("orderType")) as "dinein" | "pickup";

  if (!items.length) return json({ error: "Empty order" }, { status: 400 });

  try {
    await sendOrderEmail(
      type === "dinein"
        ? {
            type: "dinein",
            tableNumber: String(formData.get("table")),
            items,
            total,
          }
        : {
            type: "pickup",
            customerName: String(formData.get("customerName")),
            phone: String(formData.get("phone")),
            items,
            total,
          },
    );
    return json({ success: true });
  } catch (error) {
    console.error(error);
    return json({ error: "Failed to send order" }, { status: 500 });
  }
};

// ─── PAGE ──────────────────────────────────────────────────────────────────

export default function MenuPage() {
  const [data, setData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [selectedProductName, setSelectedProductName] = useState<string | null>(
    null,
  );

  const {
    cart,
    total,
    totalItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const fetcher = useFetcher();
  const navigate = useNavigate();

  const isSubmitting = fetcher.state === "submitting";
  const isSuccess = !!fetcher.data?.success;

  // Fetch menu data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/menu.json");
        if (!response.ok) throw new Error("Network response was not ok");
        const result: MenuData = await response.json();
        setData(result);
      } catch {
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  // Redirect on success
  useEffect(() => {
    if (fetcher.data?.success) {
      clearCart();
      navigate("/order-confirmed");
    }
  }, [fetcher.data, clearCart, navigate]);

  const handleSearchSelect = (product: SearchProduct) => {
    setSearchQuery("");
    setOpenSection(product.sectionName);
    setSelectedProductName(product.name);
  };

  const handleSubmitOrder = ({
    orderType,
    tableNumber,
    customerName,
    phone,
  }: {
    orderType: "dinein" | "pickup";
    tableNumber: string;
    customerName: string;
    phone: string;
  }) => {
    const formData = new FormData();
    formData.append("items", JSON.stringify(cart));
    formData.append("total", String(total));
    formData.append("orderType", orderType);
    formData.append("table", tableNumber);
    formData.append("customerName", customerName);
    formData.append("phone", phone);

    fetcher.submit(formData, { method: "post" });
    setIsDrawerOpen(false);
  };

  if (loading) return <p>Shaking up your drinks...</p>;
  if (error) return <p>{error}</p>;
  if (!data) return <p>No data available</p>;

  const searchableProducts = data.sections.flatMap((section) =>
    section.items
      .filter((item) => item.name)
      .map((item) => ({
        name: item.name,
        sectionName: section.name,
        price: item.price,
        image: item.image,
      })),
  );

  const normalizedSearch = searchQuery.trim().toLowerCase();

  const filteredSections = normalizedSearch
    ? data.sections
        .map((section) => ({
          ...section,
          items: section.items.filter((item) =>
            (item.name ?? "").toLowerCase().includes(normalizedSearch),
          ),
        }))
        .filter((section) => section.items.length > 0)
    : data.sections;

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);

    // User is starting/changing a search,
    // so the previously selected product is no longer relevant.
    setSelectedProductName(null);
  };

  return (
    <>
      <div className="p-5 pb-28">
        {/* Search */}
        <div className="sticky top-0 z-40 -mx-5 mb-6 bg-white/95 px-5 py-3 backdrop-blur-md">
          <MenuSearch
            query={searchQuery}
            onQueryChange={handleSearchQueryChange}
            products={searchableProducts}
            onSelect={handleSearchSelect}
          />
        </div>

        {/* Filtered menu */}
        {filteredSections.length > 0 ? (
          filteredSections.map((section) => (
            <Section
              key={section.name}
              section={section}
              addToCart={addToCart}
              isOrdering={true}
              isOpen={openSection === section.name}
              selectedItemName={
                openSection === section.name ? selectedProductName : null
              }
              onToggle={() => {
                setSelectedProductName(null);

                setOpenSection((current) =>
                  current === section.name ? null : section.name,
                );
              }}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="mb-3 text-4xl">🔍</div>

            <p className="text-lg font-semibold text-gray-700">
              No products found
            </p>

            <p className="mt-1 text-sm text-gray-400">
              Try searching for something else.
            </p>

            <button
              type="button"
              onClick={() => setSearchQuery("")}
              className="mt-5 rounded-full bg-[#FA994F] px-5 py-2.5 text-sm font-medium text-white transition hover:opacity-90"
            >
              Clear search
            </button>
          </div>
        )}
      </div>

      <CartDrawer
        isOpen={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        cart={cart}
        total={total}
        totalItems={totalItems}
        isSubmitting={isSubmitting}
        isSuccess={isSuccess}
        onIncrease={increaseQuantity}
        onDecrease={decreaseQuantity}
        onRemove={removeItem}
        onSubmit={handleSubmitOrder}
      />

      {!isDrawerOpen && (
        <MiniBar
          totalItems={totalItems}
          total={total}
          onOpen={() => setIsDrawerOpen(true)}
        />
      )}
    </>
  );
}
