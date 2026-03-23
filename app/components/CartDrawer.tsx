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
  onIncrease: (index: number) => void;
  onDecrease: (index: number) => void;
  onRemove: (index: number) => void;
  onUpdateComment: (index: number, comment: string) => void;
  onSubmit: (params: {
    orderType: "dinein" | "pickup";
    tableNumber: string;
    customerName: string;
    phone: string;
  }) => void;
};

export function CartDrawer({
  isOpen,
  onClose,
  cart,
  total,
  totalItems,
  isSubmitting,
  isSuccess,
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

  // Each item can have its note field open independently
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

  const handleSubmit = () => {
    if (orderType === "dinein" && !tableNumber) {
      alert("Please enter table number");
      return;
    }
    if (orderType === "pickup" && (!customerName || !phone)) {
      alert("Please enter name and phone");
      return;
    }
    onSubmit({ orderType, tableNumber, customerName, phone });
    setTableNumber("");
    setCustomerName("");
    setPhone("");
    setOpenComments(new Set());
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

          {/* Order type toggle */}
          <Flex gap="2">
            <Button
              variant={orderType === "dinein" ? "solid" : "soft"}
              onClick={() => setOrderType("dinein")}
            >
              Dine-in
            </Button>
            <Button
              variant={orderType === "pickup" ? "solid" : "soft"}
              onClick={() => setOrderType("pickup")}
            >
              Pickup
            </Button>
          </Flex>

          {/* Conditional inputs */}
          {orderType === "dinein" ? (
            <input
              type="text"
              placeholder="Table Number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              style={inputStyle}
            />
          ) : (
            <Flex direction="column" gap="2">
              <input
                type="text"
                placeholder="Your Name"
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                style={inputStyle}
              />
              <input
                type="tel"
                placeholder="Phone Number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                style={inputStyle}
              />
            </Flex>
          )}

          {/* Empty state */}
          {cart.length === 0 ? (
            <Text size="2" color="gray">
              No items yet. Close this and tap "+" on any item.
            </Text>
          ) : (
            <>
              {/* Cart items */}
              <Flex direction="column" gap="2">
                {cart.map((item, i) => (
                  <Flex key={i} direction="column" gap="1">
                    {/* Item row */}
                    <Flex justify="between" align="center">
                      <Flex direction="column" gap="1">
                        <Text size="2" weight="medium">
                          {item.name}
                        </Text>
                        <Flex align="center" gap="2">
                          <Button
                            size="1"
                            variant="soft"
                            onClick={() => onDecrease(i)}
                          >
                            −
                          </Button>
                          <Text size="2">{item.quantity}</Text>
                          <Button
                            size="1"
                            variant="soft"
                            onClick={() => onIncrease(i)}
                          >
                            +
                          </Button>
                          <Button
                            size="1"
                            variant="ghost"
                            color="red"
                            onClick={() => onRemove(i)}
                          >
                            ✕
                          </Button>

                          {/* Note toggle button */}
                          <Button
                            size="1"
                            variant={
                              openComments.has(i) || item.comment
                                ? "soft"
                                : "ghost"
                            }
                            color={item.comment ? "orange" : "gray"}
                            onClick={() => toggleComment(i)}
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
                        {Number(item.price.replace("€", "")) * item.quantity}€
                      </Text>
                    </Flex>

                    {/* Inline comment field — each item independent */}
                    {openComments.has(i) && (
                      <textarea
                        key={`comment-${i}`}
                        autoFocus
                        placeholder="e.g. no lettuce, with tonic, extra sauce..."
                        defaultValue={item.comment ?? ""}
                        onBlur={(e) => {
                          onUpdateComment(i, e.target.value);
                          if (!e.target.value) closeComment(i);
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

                    {/* Show saved note preview when collapsed */}
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
                <Text weight="bold">{total}€</Text>
              </Flex>

              {isSuccess && (
                <Text size="2" color="green">
                  Order sent successfully!
                </Text>
              )}

              {/* Submit */}
              <Button
                size="3"
                radius="full"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "Sending..." : "Send Order"}
              </Button>
            </>
          )}
        </Flex>
      </div>
    </>
  );
}
