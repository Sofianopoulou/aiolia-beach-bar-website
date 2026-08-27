import { useState } from "react";
import {
  Flex,
  Text,
  Heading,
  Button,
  Badge,
  Separator,
} from "@radix-ui/themes";
import { CartItem } from "../hooks/useCart";

type CartDrawerProps = {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  total: number;
  totalItems: number;
  isSubmitting: boolean;
  isSuccess: boolean;
  submitError?: string | null;

  onIncrease: (index: number) => void;
  onDecrease: (index: number) => void;
  onRemove: (index: number) => void;
  onUpdateComment: (index: number, comment: string) => void;

  onSubmit: (params: {
    orderType: "dinein" | "pickup";
    tableNumber: string;
    customerName: string;
    phone: string;
  }) => Promise<boolean>;
};

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  total,
  totalItems,
  isSubmitting,
  isSuccess,
  submitError,
  onIncrease,
  onDecrease,
  onRemove,
  onUpdateComment,
  onSubmit,
}: CartDrawerProps) {
  const [orderType, setOrderType] = useState<"dinein" | "pickup">("dinein");

  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [phone, setPhone] = useState("");

  // Each item can have its note field open independently.
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());

  const toggleComment = (index: number) => {
    setOpenComments((prev) => {
      const next = new Set(prev);

      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }

      return next;
    });
  };

  const closeComment = (index: number) => {
    setOpenComments((prev) => {
      const next = new Set(prev);
      next.delete(index);
      return next;
    });
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;

    if (cart.length === 0) {
      return;
    }

    if (orderType === "dinein" && !tableNumber.trim()) {
      alert("Please enter table number");
      return;
    }

    if (orderType === "pickup" && (!customerName.trim() || !phone.trim())) {
      alert("Please enter name and phone");
      return;
    }

    const success = await onSubmit({
      orderType,
      tableNumber: tableNumber.trim(),
      customerName: customerName.trim(),
      phone: phone.trim(),
    });

    // Only clear the form if the backend successfully created the order.
    if (success) {
      setTableNumber("");
      setCustomerName("");
      setPhone("");
      setOpenComments(new Set());
    }
  };

  const inputStyle = {
    width: "100%",
    padding: "10px",
    borderRadius: 8,
    border: "1px solid var(--gray-5)",
    background: "var(--color-surface)",
    color: "inherit",
  };

  return (
    <>
      {/* Backdrop */}
      {isOpen && (
        <div
          onClick={onClose}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.4)",
            zIndex: 40,
            backdropFilter: "blur(2px)",
          }}
        />
      )}

      {/* Drawer */}
      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 50,
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          transition: "transform 0.35s cubic-bezier(0.32, 0.72, 0, 1)",
          maxHeight: "80vh",
          overflowY: "auto",
          borderRadius: "20px 20px 0 0",
          background: "var(--color-panel-solid)",
          boxShadow: "0 -4px 30px rgba(0,0,0,0.15)",
          padding: "20px 16px 32px",
          paddingBottom: "calc(32px + env(safe-area-inset-bottom))",
        }}
      >
        {/* Drag handle */}
        <div
          style={{
            width: 40,
            height: 4,
            borderRadius: 2,
            background: "var(--gray-5)",
            margin: "0 auto 16px",
          }}
        />

        <Flex direction="column" gap="3">
          {/* Header */}
          <Flex justify="between" align="center">
            <Heading size="4">Your Order</Heading>

            <Badge color="blue" variant="soft">
              {totalItems} {totalItems === 1 ? "item" : "items"}
            </Badge>
          </Flex>

          <Separator size="4" />

          {/* Order type */}
          <Flex gap="2">
            <Button
              type="button"
              variant={orderType === "dinein" ? "solid" : "soft"}
              onClick={() => setOrderType("dinein")}
              disabled={isSubmitting}
            >
              Dine-in
            </Button>

            <Button
              type="button"
              variant={orderType === "pickup" ? "solid" : "soft"}
              onClick={() => setOrderType("pickup")}
              disabled={isSubmitting}
            >
              Pickup
            </Button>
          </Flex>

          {/* Conditional inputs */}
          {orderType === "dinein" ? (
            <input
              type="text"
              inputMode="numeric"
              placeholder="Table Number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              disabled={isSubmitting}
              style={inputStyle}
            />
          ) : (
            <Flex direction="column" gap="2">
              <input
                type="text"
                placeholder="Your Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                disabled={isSubmitting}
                style={inputStyle}
              />

              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={isSubmitting}
                style={inputStyle}
              />
            </Flex>
          )}

          {/* Empty cart */}
          {cart.length === 0 ? (
            <Text size="2" color="gray">
              No items yet. Close this and tap "+" on any item.
            </Text>
          ) : (
            <>
              {/* Cart items */}
              <Flex direction="column" gap="2">
                {cart.map((item, i) => (
                  <Flex key={item.productId} direction="column" gap="1">
                    {/* Item row */}
                    <Flex justify="between" align="center">
                      <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">
                          {item.name}
                        </Text>

                        <Flex align="center" gap="2">
                          <Button
                            type="button"
                            size="1"
                            variant="soft"
                            onClick={() => onDecrease(i)}
                            disabled={isSubmitting}
                          >
                            −
                          </Button>

                          <Text size="2">{item.quantity}</Text>

                          <Button
                            type="button"
                            size="1"
                            variant="soft"
                            onClick={() => onIncrease(i)}
                            disabled={isSubmitting}
                          >
                            +
                          </Button>

                          <Button
                            type="button"
                            size="1"
                            variant="ghost"
                            color="red"
                            onClick={() => onRemove(i)}
                            disabled={isSubmitting}
                          >
                            ✕
                          </Button>

                          {/* Note toggle */}
                          <Button
                            type="button"
                            size="1"
                            variant={
                              openComments.has(i) || item.comment
                                ? "soft"
                                : "ghost"
                            }
                            color={item.comment ? "orange" : "gray"}
                            onClick={() => toggleComment(i)}
                            disabled={isSubmitting}
                            style={{ fontSize: 12 }}
                          >
                            {item.comment ? "📝 Note" : "＋ Note"}
                          </Button>
                        </Flex>
                      </Flex>

                      <Text
                        size="3"
                        weight="bold"
                        style={{ color: "var(--accent-9)" }}
                      >
                        {(
                          Number(item.price.replace("€", "")) * item.quantity
                        ).toFixed(2)}
                        €
                      </Text>
                    </Flex>

                    {/* Comment field */}
                    {openComments.has(i) && (
                      <textarea
                        key={`comment-${item.productId}`}
                        autoFocus
                        placeholder="e.g. no lettuce, with tonic, extra sauce..."
                        defaultValue={item.comment ?? ""}
                        disabled={isSubmitting}
                        onBlur={(e) => {
                          const value = e.target.value.trim();

                          onUpdateComment(i, value);

                          if (!value) {
                            closeComment(i);
                          }
                        }}
                        rows={2}
                        style={{
                          width: "100%",
                          padding: "8px 10px",
                          borderRadius: 8,
                          border: "1px solid var(--orange-6)",
                          background: "var(--orange-2)",
                          color: "inherit",
                          fontSize: 13,
                          resize: "none",
                          outline: "none",
                          lineHeight: 1.5,
                        }}
                      />
                    )}

                    {/* Saved note preview */}
                    {!openComments.has(i) && item.comment && (
                      <Text
                        size="1"
                        style={{
                          color: "var(--orange-11)",
                          paddingLeft: 2,
                          fontStyle: "italic",
                          cursor: "pointer",
                        }}
                        onClick={() => toggleComment(i)}
                      >
                        📝 {item.comment}
                      </Text>
                    )}
                  </Flex>
                ))}
              </Flex>

              <Separator size="4" />

              {/* Total */}
              <Flex justify="between" align="center">
                <Text weight="bold">Total</Text>
                <Text weight="bold">{total.toFixed(2)}€</Text>
              </Flex>

              {/* Success */}
              {isSuccess && (
                <Text size="2" color="green">
                  Order placed successfully!
                </Text>
              )}

              {/* Backend error */}
              {submitError && (
                <Text size="2" color="red">
                  {submitError}
                </Text>
              )}

              {/* Submit */}
              <Button
                type="button"
                size="3"
                radius="full"
                onClick={handleSubmit}
                disabled={isSubmitting || cart.length === 0}
              >
                {isSubmitting ? "Placing order..." : "Place Order"}
              </Button>
            </>
          )}
        </Flex>
      </div>
    </>
  );
}
