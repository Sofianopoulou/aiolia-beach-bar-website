export interface MenuItem {
  name: string;
  description?: string;
  price: string;
  image?: string;
  label?: string;
}

export interface Section {
  name: string;
  description?: string;
  labelImage?: string;
  station?: "BAR" | "KITCHEN";
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
