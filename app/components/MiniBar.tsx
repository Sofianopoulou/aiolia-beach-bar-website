import { Flex, Text, Button } from "@radix-ui/themes";

type MiniBarProps = {
  totalItems: number;
  total: number;
  onOpen: () => void;
};

export function MiniBar({ totalItems, total, onOpen }: MiniBarProps) {
  return (
    <div
      style={{
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 50,
        padding: "12px 16px",
        paddingBottom: "calc(12px + env(safe-area-inset-bottom))",
        background: "var(--color-panel-solid)",
        borderTop: "1px solid var(--gray-4)",
        boxShadow: "0 -2px 12px rgba(0,0,0,0.08)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        gap: 12,
      }}
    >
      <Flex align="center" gap="2" style={{ flex: 1, minWidth: 0 }}>
        <Text size="2" weight="medium" style={{ flexShrink: 1 }}>
          {totalItems === 0
            ? "Your order is empty. Tap '+' to add items."
            : `${totalItems} ${totalItems === 1 ? "item" : "items"}`}
        </Text>
      </Flex>

      <Flex align="center" gap="3" style={{ flexShrink: 0 }}>
        {total > 0 && (
          <Text size="3" weight="bold" style={{ color: "var(--accent-9)" }}>
            {total}€
          </Text>
        )}
        <Button
          size="2"
          radius="full"
          onClick={onOpen}
          disabled={totalItems === 0}
        >
          View Order ↑
        </Button>
      </Flex>
    </div>
  );
}
