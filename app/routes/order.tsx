import { useEffect, useState } from "react";
import { json } from "@remix-run/node";
import { useFetcher, useNavigate } from "@remix-run/react";

import Section from "~/components/Section";
import { MenuData } from "../types/types";
import { sendOrderEmail } from "~/utils/mail.server";
import { useCart } from "~/hooks/useCart";
import { CartDrawer } from "~/components/CartDrawer";
import { MiniBar } from "~/components/MiniBar";

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
      navigate("/order-confirmed");
    }
  }, [fetcher.data]);

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
    clearCart();
    setIsDrawerOpen(false);
  };

  if (loading) return <p>Shaking up your drinks...</p>;
  if (error) return <p>{error}</p>;
  if (!data) return <p>No data available</p>;

  return (
    <>
      <div className="p-5 pb-28">
        {data.sections.map((section, index) => (
          <Section
            key={index}
            section={section}
            addToCart={addToCart}
            isOrdering={true}
          />
        ))}
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
