import { useState } from "react";
import type { OrderableMenuItem } from "../types/types";

export type CartItem = OrderableMenuItem & {
  quantity: number;
  comment?: string;
};

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: OrderableMenuItem) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.productId === item.productId);

      if (exists) {
        return prev.map((p) =>
          p.productId === item.productId
            ? { ...p, quantity: p.quantity + 1 }
            : p,
        );
      }

      return [
        ...prev,
        {
          ...item,
          quantity: 1,
        },
      ];
    });
  };

  const increaseQuantity = (index: number) => {
    setCart((prev) =>
      prev.map((item, i) =>
        i === index ? { ...item, quantity: item.quantity + 1 } : item,
      ),
    );
  };

  const decreaseQuantity = (index: number) => {
    setCart((prev) =>
      prev
        .map((item, i) =>
          i === index ? { ...item, quantity: item.quantity - 1 } : item,
        )
        .filter((item) => item.quantity > 0),
    );
  };

  const removeItem = (index: number) => {
    setCart((prev) => prev.filter((_, i) => i !== index));
  };

  const updateComment = (index: number, comment: string) => {
    setCart((prev) =>
      prev.map((item, i) => (i === index ? { ...item, comment } : item)),
    );
  };

  const clearCart = () => setCart([]);

  const total = cart.reduce(
    (sum, item) => sum + Number(item.price.replace("€", "")) * item.quantity,
    0,
  );

  const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);

  return {
    cart,
    total,
    totalItems,
    addToCart,
    increaseQuantity,
    decreaseQuantity,
    removeItem,
    updateComment,
    clearCart,
  };
}
