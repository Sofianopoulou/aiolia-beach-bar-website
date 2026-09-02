export interface ModifierOption {
  id: string;
  name: string;

  // Additional price added to the base product price.
  // Omit it when the modifier is free.
  price?: number;
}

export interface ModifierGroup {
  id: string;
  name: string;

  // If true, the waiter must choose something
  // before adding the product.
  required?: boolean;

  // false / omitted = one option max
  // true = multiple options can be selected
  multiple?: boolean;

  options: ModifierOption[];
}

export interface MenuItem {
  name: string;
  description?: string;
  price?: string;
  image?: string;
  label?: string;

  // Product-specific modifiers.
  modifierGroups?: ModifierGroup[];
  inheritSectionModifiers?: boolean;
}

export interface Section {
  name: string;
  description?: string;
  labelImage?: string;

  station?: "BAR" | "KITCHEN";

  // Modifiers inherited by every product
  // inside this section/category.
  modifierGroups?: ModifierGroup[];

  items: MenuItem[];
}

export interface MenuData {
  sections: Section[];
}

export interface OrderableMenuItem {
  productId: string;
  name: string;
  price: string;
}
