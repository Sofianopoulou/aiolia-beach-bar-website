import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router";
import { supabaseClient } from "~/services/supabase.client";

import type {
  MenuData,
  MenuItem,
  ModifierGroup,
  ModifierOption,
  Section,
} from "../types/types";

import {
  getProductModifierGroups,
  hasProductModifiers,
} from "../utils/modifiers";
import { createProductId } from "~/utils/productId";

type CartModifier = {
  groupId: string;
  groupName: string;
  optionId: string;
  optionName: string;
  price: number;
};

type CartItem = {
  lineId: string;

  productId: string;

  sectionName: string;
  station: "BAR" | "KITCHEN";

  name: string;

  basePrice: number;
  modifierPrice: number;
  unitPrice: number;

  quantity: number;

  modifiers: CartModifier[];

  note: string;
};

type SelectedModifiers = Record<string, string[]>;

function formatMoney(value: number) {
  return new Intl.NumberFormat("el-GR", {
    style: "currency",
    currency: "EUR",
  }).format(value);
}

export default function WaiterOrderPage() {
  const { tableId } = useParams();
  const navigate = useNavigate();

  const [menu, setMenu] = useState<MenuData | null>(null);

  const [selectedSectionName, setSelectedSectionName] = useState("");

  const [searchQuery, setSearchQuery] = useState("");

  const [cart, setCart] = useState<CartItem[]>([]);

  const [isLoading, setIsLoading] = useState(true);

  const [error, setError] = useState<string | null>(null);

  const [isCartOpen, setIsCartOpen] = useState(false);

  const [isSubmittingOrder, setIsSubmittingOrder] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  // MODIFIER MODAL

  const [modifierSection, setModifierSection] = useState<Section | null>(null);

  const [modifierItem, setModifierItem] = useState<MenuItem | null>(null);

  const [selectedModifiers, setSelectedModifiers] = useState<SelectedModifiers>(
    {},
  );

  const [modifierQuantity, setModifierQuantity] = useState(1);

  const [modifierNote, setModifierNote] = useState("");

  useEffect(() => {
    async function loadMenu() {
      try {
        const response = await fetch("/menu.json");

        if (!response.ok) {
          throw new Error("Could not load menu");
        }

        const data = (await response.json()) as MenuData;

        setMenu(data);

        if (data.sections.length > 0) {
          setSelectedSectionName(data.sections[0].name);
        }
      } catch (error) {
        setError(
          error instanceof Error ? error.message : "Could not load menu",
        );
      } finally {
        setIsLoading(false);
      }
    }

    loadMenu();
  }, []);

  const selectedSection = useMemo(() => {
    return (
      menu?.sections.find((section) => section.name === selectedSectionName) ??
      null
    );
  }, [menu, selectedSectionName]);

  const searchResults = useMemo(() => {
    if (!menu) {
      return [];
    }

    const query = searchQuery.trim().toLowerCase();

    if (!query) {
      return [];
    }

    return menu.sections.flatMap((section) =>
      section.items
        .filter(isOrderableMenuItem)
        .filter((item) => {
          return (
            item.name.toLowerCase().includes(query) ||
            item.description?.toLowerCase().includes(query)
          );
        })
        .map((item) => ({
          section,
          item,
        })),
    );
  }, [menu, searchQuery]);

  const totalItems = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const total = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);
  }, [cart]);

  function getPrice(item: MenuItem) {
    if (item.price === undefined || item.price === null) {
      console.warn("Menu item has no price:", item);
      return 0;
    }

    const rawPrice = String(item.price)
      .replace("€", "")
      .replace(",", ".")
      .trim();

    const parsedPrice = Number(rawPrice);

    if (!Number.isFinite(parsedPrice)) {
      console.warn("Invalid menu item price:", item);
      return 0;
    }

    return parsedPrice;
  }

  function openProduct(section: Section, item: MenuItem) {
    if (!section.station) {
      return;
    }

    if (hasProductModifiers(section, item)) {
      setModifierSection(section);
      setModifierItem(item);

      setSelectedModifiers({});
      setModifierQuantity(1);
      setModifierNote("");

      return;
    }

    addSimpleProduct(section, item);
  }

  function addSimpleProduct(section: Section, item: MenuItem) {
    if (!section.station) {
      return;
    }

    const basePrice = getPrice(item);

    const productId = createProductId(section.name, item.name);

    const existingIndex = cart.findIndex(
      (cartItem) =>
        cartItem.productId === productId &&
        cartItem.modifiers.length === 0 &&
        !cartItem.note,
    );

    if (existingIndex !== -1) {
      setCart((current) =>
        current.map((cartItem, index) =>
          index === existingIndex
            ? {
                ...cartItem,
                quantity: cartItem.quantity + 1,
              }
            : cartItem,
        ),
      );

      return;
    }

    setCart((current) => [
      ...current,
      {
        lineId: crypto.randomUUID(),

        productId,

        sectionName: section.name,

        station: section.station!,

        name: item.name,

        basePrice,
        modifierPrice: 0,
        unitPrice: basePrice,

        quantity: 1,

        modifiers: [],

        note: "",
      },
    ]);
  }

  function isOrderableMenuItem(item: MenuItem) {
    return (
      item.name.trim().length > 0 &&
      item.price !== undefined &&
      item.price !== null &&
      String(item.price).trim().length > 0
    );
  }

  function toggleModifier(group: ModifierGroup, option: ModifierOption) {
    setSelectedModifiers((current) => {
      const existing = current[group.id] ?? [];

      if (group.multiple) {
        const alreadySelected = existing.includes(option.id);

        return {
          ...current,
          [group.id]: alreadySelected
            ? existing.filter((id) => id !== option.id)
            : [...existing, option.id],
        };
      }

      // Clicking an already-selected
      // optional modifier deselects it.
      if (!group.required && existing[0] === option.id) {
        return {
          ...current,
          [group.id]: [],
        };
      }

      return {
        ...current,
        [group.id]: [option.id],
      };
    });
  }

  function getSelectedCartModifiers() {
    if (!modifierSection || !modifierItem) {
      return [];
    }

    const groups = getProductModifierGroups(modifierSection, modifierItem);

    const result: CartModifier[] = [];

    for (const group of groups) {
      const selectedIds = selectedModifiers[group.id] ?? [];

      for (const option of group.options) {
        if (selectedIds.includes(option.id)) {
          result.push({
            groupId: group.id,
            groupName: group.name,

            optionId: option.id,

            optionName: option.name,

            price: option.price ?? 0,
          });
        }
      }
    }

    return result;
  }

  function buildModifierPayload(item: CartItem) {
    const grouped = new Map<string, string[]>();

    for (const modifier of item.modifiers) {
      const current = grouped.get(modifier.groupId) ?? [];

      current.push(modifier.optionId);

      grouped.set(modifier.groupId, current);
    }

    return Array.from(grouped.entries()).map(([groupId, optionIds]) => ({
      groupId,
      optionIds,
    }));
  }

  async function getAuthHeaders() {
    const {
      data: { session },
    } = await supabaseClient.auth.getSession();

    if (!session?.access_token) {
      throw new Error("Waiter session expired.");
    }

    return {
      Authorization: `Bearer ${session.access_token}`,
    };
  }

  async function submitWaiterOrder() {
    if (!tableId) {
      setSubmitError("Table is missing.");
      return;
    }

    if (cart.length === 0) {
      return;
    }

    try {
      setIsSubmittingOrder(true);
      setSubmitError(null);

      const headers = await getAuthHeaders();

      const response = await fetch("/api/waiter/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...headers,
        },
        body: JSON.stringify({
          tableId,

          items: cart.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,

            modifiers: buildModifierPayload(item),

            note: item.note || undefined,
          })),
        }),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        throw new Error(result.error || "Could not send order");
      }

      // Order was successfully created.
      setCart([]);
      setIsCartOpen(false);

      navigate(`/waiter/table/${tableId}`);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Could not send order",
      );
    } finally {
      setIsSubmittingOrder(false);
    }
  }

  function validateRequiredModifiers() {
    if (!modifierSection || !modifierItem) {
      return false;
    }

    const groups = getProductModifierGroups(modifierSection, modifierItem);

    for (const group of groups) {
      if (!group.required) {
        continue;
      }

      const selected = selectedModifiers[group.id] ?? [];

      if (selected.length === 0) {
        alert(`Please select ${group.name}.`);

        return false;
      }
    }

    return true;
  }

  function confirmModifiedProduct() {
    if (!modifierSection || !modifierItem || !modifierSection.station) {
      return;
    }

    if (!validateRequiredModifiers()) {
      return;
    }

    const modifiers = getSelectedCartModifiers();

    const basePrice = getPrice(modifierItem);

    const modifierPrice = modifiers.reduce(
      (sum, modifier) => sum + modifier.price,
      0,
    );

    const productId = createProductId(modifierSection.name, modifierItem.name);

    setCart((current) => [
      ...current,
      {
        lineId: crypto.randomUUID(),

        productId,

        sectionName: modifierSection.name,

        station: modifierSection.station!,

        name: modifierItem.name,

        basePrice,

        modifierPrice,

        unitPrice: basePrice + modifierPrice,

        quantity: modifierQuantity,

        modifiers,

        note: modifierNote.trim(),
      },
    ]);

    closeModifierModal();
  }

  function closeModifierModal() {
    setModifierSection(null);
    setModifierItem(null);

    setSelectedModifiers({});
    setModifierQuantity(1);
    setModifierNote("");
  }

  function increaseCartItem(lineId: string) {
    setCart((current) =>
      current.map((item) =>
        item.lineId === lineId
          ? {
              ...item,
              quantity: item.quantity + 1,
            }
          : item,
      ),
    );
  }

  function decreaseCartItem(lineId: string) {
    setCart((current) =>
      current
        .map((item) =>
          item.lineId === lineId
            ? {
                ...item,
                quantity: item.quantity - 1,
              }
            : item,
        )
        .filter((item) => item.quantity > 0),
    );
  }

  function removeCartItem(lineId: string) {
    setCart((current) => current.filter((item) => item.lineId !== lineId));
  }

  function getModifierModalPrice() {
    if (!modifierItem) {
      return 0;
    }

    const basePrice = getPrice(modifierItem);

    const modifiers = getSelectedCartModifiers();

    const extras = modifiers.reduce((sum, modifier) => sum + modifier.price, 0);

    return (basePrice + extras) * modifierQuantity;
  }

  function renderProductTile(section: Section, item: MenuItem) {
    const hasModifiers = hasProductModifiers(section, item);

    return (
      <button
        key={`${section.name}-${item.name}`}
        type="button"
        onClick={() => openProduct(section, item)}
        style={{
          minHeight: 115,

          padding: 14,

          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",

          textAlign: "left",

          background: "#ffffff",

          border: "1px solid #d1d5db",

          borderRadius: 12,

          cursor: "pointer",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 16,
              fontWeight: 800,
            }}
          >
            {item.name}
          </div>

          {searchQuery && (
            <div
              style={{
                marginTop: 4,
                color: "#9ca3af",
                fontSize: 11,
                fontWeight: 700,
              }}
            >
              {section.name}
            </div>
          )}
        </div>

        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "end",
            gap: 8,
          }}
        >
          <strong
            style={{
              fontSize: 16,
            }}
          >
            {formatMoney(getPrice(item))}
          </strong>

          {hasModifiers && (
            <span
              style={{
                color: "#FA994F",
                fontSize: 11,
                fontWeight: 900,
              }}
            >
              OPTIONS
            </span>
          )}
        </div>
      </button>
    );
  }

  if (isLoading) {
    return <main style={{ padding: 32 }}>Loading menu...</main>;
  }

  if (!menu) {
    return (
      <main style={{ padding: 32 }}>
        {error || "Menu could not be loaded."}
      </main>
    );
  }

  const modalGroups =
    modifierSection && modifierItem
      ? getProductModifierGroups(modifierSection, modifierItem)
      : [];

  return (
    <>
      <main
        style={{
          minHeight: "100vh",
          background: "#f3f4f6",
          color: "#111827",

          // Leave room for bottom cart.
          paddingBottom: 110,
        }}
      >
        {/* STICKY TOP AREA */}

        <div
          style={{
            position: "sticky",
            top: 0,
            zIndex: 30,

            background: "rgba(255,255,255,0.97)",

            borderBottom: "1px solid #e5e7eb",

            backdropFilter: "blur(10px)",
          }}
        >
          {/* HEADER */}

          <header
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 20,

              padding: "14px 20px 10px",
            }}
          >
            <button
              type="button"
              onClick={() => navigate(`/waiter/table/${tableId}`)}
              style={{
                border: "none",
                background: "transparent",
                padding: 0,
                fontWeight: 800,
                cursor: "pointer",
              }}
            >
              ← TABLE
            </button>

            <div
              style={{
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: 12,
                  fontWeight: 900,
                  color: "#6b7280",
                  letterSpacing: 1,
                }}
              >
                NEW ORDER
              </div>
            </div>

            <div
              style={{
                minWidth: 75,
                textAlign: "right",
                fontWeight: 900,
              }}
            >
              {formatMoney(total)}
            </div>
          </header>

          {/* SEARCH */}

          <div
            style={{
              padding: "0 20px 12px",
            }}
          >
            <input
              type="search"
              value={searchQuery}
              onChange={(event) => setSearchQuery(event.target.value)}
              placeholder="Search products..."
              style={{
                width: "100%",
                boxSizing: "border-box",

                minHeight: 48,

                padding: "0 16px",

                border: "1px solid #d1d5db",

                borderRadius: 12,

                background: "#f9fafb",

                fontSize: 16,

                outline: "none",
              }}
            />
          </div>

          {/* CATEGORIES */}

          {!searchQuery.trim() && (
            <div
              style={{
                display: "flex",
                gap: 8,

                overflowX: "auto",

                padding: "0 20px 12px",
              }}
            >
              {menu.sections.map((section) => {
                const selected = section.name === selectedSectionName;

                return (
                  <button
                    key={section.name}
                    type="button"
                    onClick={() => setSelectedSectionName(section.name)}
                    style={{
                      flex: "0 0 auto",

                      minHeight: 42,

                      padding: "0 15px",

                      border: selected
                        ? "2px solid #FA994F"
                        : "1px solid #d1d5db",

                      borderRadius: 10,

                      background: selected ? "#fff7ed" : "#ffffff",

                      color: selected ? "#c96318" : "#374151",

                      fontWeight: 800,

                      cursor: "pointer",
                    }}
                  >
                    {section.name}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* PRODUCTS */}

        <section
          style={{
            padding: 20,
          }}
        >
          {searchQuery.trim() ? (
            <>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  marginBottom: 14,
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: 19,
                  }}
                >
                  Search results
                </h2>

                <span
                  style={{
                    color: "#6b7280",
                  }}
                >
                  {searchResults.length}
                </span>
              </div>

              {searchResults.length === 0 ? (
                <div
                  style={{
                    padding: 50,
                    textAlign: "center",
                    color: "#9ca3af",
                  }}
                >
                  No products found.
                </div>
              ) : (
                <div
                  style={{
                    display: "grid",

                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(150px, 1fr))",

                    gap: 10,
                  }}
                >
                  {searchResults.map(({ section, item }) =>
                    renderProductTile(section, item),
                  )}
                </div>
              )}
            </>
          ) : selectedSection ? (
            <>
              <h2
                style={{
                  margin: "0 0 14px",
                  fontSize: 21,
                }}
              >
                {selectedSection.name}
              </h2>

              <div
                style={{
                  display: "grid",

                  gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))",

                  gap: 10,
                }}
              >
                {selectedSection.items
                  .filter(isOrderableMenuItem)
                  .map((item) => renderProductTile(selectedSection, item))}
              </div>
            </>
          ) : null}
        </section>

        {error && (
          <div
            style={{
              margin: 20,
              padding: 14,
              borderRadius: 10,
              background: "#fee2e2",
              color: "#991b1b",
            }}
          >
            {error}
          </div>
        )}
      </main>

      {/* BOTTOM CART */}

      <div
        style={{
          position: "fixed",
          left: 0,
          right: 0,
          bottom: 0,
          zIndex: 35,

          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",

          gap: 16,

          padding: 14,

          background: "#111827",
          color: "#ffffff",

          boxShadow: "0 -4px 16px rgba(0,0,0,0.15)",
        }}
      >
        <div>
          <div
            style={{
              fontSize: 12,
              color: "#d1d5db",
              fontWeight: 700,
            }}
          >
            CURRENT ORDER
          </div>

          <div
            style={{
              marginTop: 2,
              fontSize: 18,
              fontWeight: 900,
            }}
          >
            {totalItems} {totalItems === 1 ? "item" : "items"} ·{" "}
            {formatMoney(total)}
          </div>
        </div>

        <button
          type="button"
          disabled={cart.length === 0}
          onClick={() => setIsCartOpen(true)}
          style={{
            minHeight: 48,
            padding: "0 20px",

            border: "none",

            borderRadius: 10,

            background: "#FA994F",

            color: "#ffffff",

            fontWeight: 900,

            cursor: cart.length === 0 ? "not-allowed" : "pointer",

            opacity: cart.length === 0 ? 0.5 : 1,
          }}
        >
          REVIEW ORDER
        </button>
      </div>

      {/* REVIEW CART MODAL */}

      {isCartOpen && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 120,
            background: "rgba(0,0,0,0.45)",
            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",
          }}
          onMouseDown={() => setIsCartOpen(false)}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 720,
              maxHeight: "90vh",
              overflowY: "auto",
              background: "#ffffff",
              borderRadius: "20px 20px 0 0",
              padding: 20,
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: 18,
              }}
            >
              <div>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  TABLE ORDER
                </div>

                <h2 style={{ margin: "3px 0 0" }}>Review order</h2>
              </div>

              <button
                type="button"
                onClick={() => setIsCartOpen(false)}
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 19,
                  border: "1px solid #e5e7eb",
                  background: "#ffffff",
                  fontSize: 20,
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {cart.map((item) => (
              <div
                key={item.lineId}
                style={{
                  padding: "14px 0",
                  borderBottom: "1px solid #e5e7eb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    gap: 16,
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 900 }}>{item.name}</div>

                    {item.modifiers.length > 0 && (
                      <div
                        style={{
                          marginTop: 5,
                          color: "#6b7280",
                          fontSize: 14,
                        }}
                      >
                        {item.modifiers
                          .map((modifier) => modifier.optionName)
                          .join(" · ")}
                      </div>
                    )}

                    {item.note && (
                      <div
                        style={{
                          marginTop: 4,
                          color: "#6b7280",
                          fontSize: 14,
                        }}
                      >
                        ↳ {item.note}
                      </div>
                    )}
                  </div>

                  <strong>{formatMoney(item.unitPrice * item.quantity)}</strong>
                </div>

                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginTop: 12,
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: 10,
                    }}
                  >
                    <button
                      type="button"
                      onClick={() => decreaseCartItem(item.lineId)}
                    >
                      −
                    </button>

                    <strong>{item.quantity}</strong>

                    <button
                      type="button"
                      onClick={() => increaseCartItem(item.lineId)}
                    >
                      +
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={() => removeCartItem(item.lineId)}
                    style={{
                      border: "none",
                      background: "transparent",
                      color: "#dc2626",
                      fontWeight: 800,
                      cursor: "pointer",
                    }}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "baseline",
                marginTop: 20,
              }}
            >
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                }}
              >
                Total
              </span>

              <span
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                }}
              >
                {formatMoney(total)}
              </span>
            </div>

            {submitError && (
              <div
                style={{
                  marginTop: 16,
                  padding: 12,
                  borderRadius: 9,
                  background: "#fee2e2",
                  color: "#991b1b",
                  fontWeight: 700,
                  fontSize: 14,
                }}
              >
                {submitError}
              </div>
            )}

            <button
              type="button"
              disabled={isSubmittingOrder || cart.length === 0}
              onClick={submitWaiterOrder}
              style={{
                width: "100%",
                minHeight: 54,
                marginTop: 20,
                border: "none",
                borderRadius: 10,
                background: "#5AD7D9",
                color: "#ffffff",
                fontSize: 16,
                fontWeight: 900,

                cursor:
                  isSubmittingOrder || cart.length === 0
                    ? "not-allowed"
                    : "pointer",

                opacity: isSubmittingOrder || cart.length === 0 ? 0.6 : 1,
              }}
            >
              {isSubmittingOrder
                ? "SENDING..."
                : `SEND ORDER · ${formatMoney(total)}`}
            </button>
          </div>
        </div>
      )}

      {/* MODIFIER MODAL */}

      {modifierItem && modifierSection && (
        <div
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 100,

            display: "flex",
            alignItems: "flex-end",
            justifyContent: "center",

            background: "rgba(0,0,0,0.45)",
          }}
          onMouseDown={closeModifierModal}
        >
          <div
            style={{
              width: "100%",
              maxWidth: 700,

              maxHeight: "90vh",

              overflowY: "auto",

              background: "#ffffff",

              borderRadius: "20px 20px 0 0",

              padding: 20,
            }}
            onMouseDown={(event) => event.stopPropagation()}
          >
            {/* MODAL HEADER */}

            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                gap: 20,
                alignItems: "flex-start",

                marginBottom: 22,
              }}
            >
              <div>
                <div
                  style={{
                    color: "#6b7280",
                    fontSize: 12,
                    fontWeight: 900,
                  }}
                >
                  {modifierSection.name}
                </div>

                <h2
                  style={{
                    margin: "3px 0 0",
                    fontSize: 25,
                  }}
                >
                  {modifierItem.name}
                </h2>
              </div>

              <button
                type="button"
                onClick={closeModifierModal}
                style={{
                  width: 38,
                  height: 38,

                  border: "1px solid #e5e7eb",

                  borderRadius: 19,

                  background: "#ffffff",

                  fontSize: 20,

                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            {/* GROUPS */}

            {modalGroups.map((group) => (
              <section
                key={group.id}
                style={{
                  marginBottom: 24,
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 7,
                    marginBottom: 10,
                  }}
                >
                  <h3
                    style={{
                      margin: 0,
                      fontSize: 17,
                    }}
                  >
                    {group.name}
                  </h3>

                  {group.required && (
                    <span
                      style={{
                        fontSize: 11,
                        fontWeight: 900,
                        color: "#FA994F",
                      }}
                    >
                      REQUIRED
                    </span>
                  )}

                  {group.multiple && (
                    <span
                      style={{
                        fontSize: 11,
                        color: "#9ca3af",
                      }}
                    >
                      choose multiple
                    </span>
                  )}
                </div>

                <div
                  style={{
                    display: "grid",

                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(135px, 1fr))",

                    gap: 8,
                  }}
                >
                  {group.options.map((option) => {
                    const selected = (
                      selectedModifiers[group.id] ?? []
                    ).includes(option.id);

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleModifier(group, option)}
                        style={{
                          minHeight: 65,

                          padding: "9px 10px",

                          border: selected
                            ? "2px solid #5AD7D9"
                            : "1px solid #d1d5db",

                          borderRadius: 10,

                          background: selected ? "#effefe" : "#ffffff",

                          color: "#111827",

                          fontWeight: selected ? 900 : 700,

                          cursor: "pointer",
                        }}
                      >
                        <div>{option.name}</div>

                        {!!option.price && (
                          <div
                            style={{
                              marginTop: 4,
                              color: "#6b7280",
                              fontSize: 12,
                            }}
                          >
                            +{formatMoney(option.price)}
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </section>
            ))}

            {/* CUSTOM NOTE */}

            <section
              style={{
                marginBottom: 22,
              }}
            >
              <label
                style={{
                  display: "block",
                  marginBottom: 8,
                  fontWeight: 800,
                }}
              >
                Special note
              </label>

              <input
                type="text"
                value={modifierNote}
                onChange={(event) => setModifierNote(event.target.value)}
                placeholder="e.g. separate glass..."
                style={{
                  width: "100%",
                  boxSizing: "border-box",

                  minHeight: 48,

                  padding: "0 13px",

                  border: "1px solid #d1d5db",

                  borderRadius: 10,

                  fontSize: 16,
                }}
              />
            </section>

            {/* QUANTITY + ADD */}

            <div
              style={{
                position: "sticky",
                bottom: 0,

                display: "flex",
                alignItems: "center",

                gap: 12,

                paddingTop: 12,

                background: "#ffffff",
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",

                  border: "1px solid #d1d5db",

                  borderRadius: 10,

                  overflow: "hidden",
                }}
              >
                <button
                  type="button"
                  disabled={modifierQuantity <= 1}
                  onClick={() =>
                    setModifierQuantity((current) => Math.max(1, current - 1))
                  }
                  style={{
                    width: 44,
                    height: 48,
                    border: "none",
                    background: "#ffffff",
                    fontSize: 20,
                    cursor: "pointer",
                  }}
                >
                  −
                </button>

                <div
                  style={{
                    minWidth: 40,
                    textAlign: "center",
                    fontWeight: 900,
                  }}
                >
                  {modifierQuantity}
                </div>

                <button
                  type="button"
                  onClick={() => setModifierQuantity((current) => current + 1)}
                  style={{
                    width: 44,
                    height: 48,
                    border: "none",
                    background: "#ffffff",
                    fontSize: 20,
                    cursor: "pointer",
                  }}
                >
                  +
                </button>
              </div>

              <button
                type="button"
                onClick={confirmModifiedProduct}
                style={{
                  flex: 1,
                  minHeight: 50,

                  border: "none",

                  borderRadius: 10,

                  background: "#FA994F",

                  color: "#ffffff",

                  fontSize: 16,

                  fontWeight: 900,

                  cursor: "pointer",
                }}
              >
                ADD · {formatMoney(getModifierModalPrice())}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
