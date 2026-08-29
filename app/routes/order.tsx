import { useEffect, useState } from "react";
import { useNavigate } from "react-router";

import Section from "~/components/Section";
import { MenuData } from "../types/types";
import { useCart } from "~/hooks/useCart";
import { CartDrawer } from "~/components/CartDrawer";
import { MiniBar } from "~/components/MiniBar";
import { MenuSearch, type SearchProduct } from "~/components/MenuSearch";

export default function MenuPage() {
  const [data, setData] = useState<MenuData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

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
    updateComment,
    clearCart,
  } = useCart();

  const navigate = useNavigate();

  // Fetch menu data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("/menu.json");

        if (!response.ok) {
          throw new Error("Network response was not ok");
        }

        const result: MenuData = await response.json();
        setData(result);
      } catch (error) {
        console.error("Failed to fetch menu:", error);
        setError("Failed to fetch data");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSearchSelect = (product: SearchProduct) => {
    setSearchQuery("");
    setOpenSection(product.sectionName);
    setSelectedProductName(product.name);
  };

  const handleSearchQueryChange = (query: string) => {
    setSearchQuery(query);

    // User is starting/changing a search,
    // so the previously selected product is no longer relevant.
    setSelectedProductName(null);
  };

  const handleSubmitOrder = async ({
    orderType,
    tableNumber,
    customerName,
    phone,
  }: {
    orderType: "dinein" | "pickup";
    tableNumber: string;
    customerName: string;
    phone: string;
  }): Promise<boolean> => {
    if (cart.length === 0) {
      setSubmitError("Your cart is empty.");
      return false;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          orderType: orderType === "dinein" ? "TABLE" : "TAKEAWAY",

          tableNumber: orderType === "dinein" ? Number(tableNumber) : undefined,

          customerName: orderType === "pickup" ? customerName : undefined,

          phone: orderType === "pickup" ? phone : undefined,

          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            notes: item.comment || undefined,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Failed to place order");
      }

      clearCart();
      setIsDrawerOpen(false);

      navigate("/order-confirmed", {
        state: {
          orderNumber: result.orderNumber,
          total: result.total,
        },
      });

      return true;
    } catch (error) {
      console.error("Order submission failed:", error);

      setSubmitError(
        error instanceof Error
          ? error.message
          : "Something went wrong while placing your order.",
      );

      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <p>Shaking up your drinks...</p>;
  }

  if (error) {
    return <p>{error}</p>;
  }

  if (!data) {
    return <p>No data available</p>;
  }

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

  return (
    <>
      <div className="p-5 pb-28">
        {/* Search */}
        <div className="sticky top-16 z-40 -mx-5 mb-6 bg-white/95 px-5 py-3 backdrop-blur-md">
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
        isSuccess={false}
        submitError={submitError}
        onIncrease={increaseQuantity}
        onDecrease={decreaseQuantity}
        onRemove={removeItem}
        onUpdateComment={updateComment}
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
