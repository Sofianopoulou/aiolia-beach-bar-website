import { useState } from "react";

export type CartItem = {
  name: string;
  price: string;
  quantity: number;
};

export function useCart() {
  const [cart, setCart] = useState<CartItem[]>([]);

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const exists = prev.find((p) => p.name === item.name);
      if (exists) {
        return prev.map((p) =>
          p.name === item.name ? { ...p, quantity: p.quantity + 1 } : p,
        );
      }
      return [...prev, { ...item, quantity: 1 }];
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
    clearCart,
  };
}
