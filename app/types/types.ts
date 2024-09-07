export interface MenuItem {
  name: string;
  description: string;
  price: string;
  image?: string;
  label?: string;
}

export interface Section {
  name: string;
  description: string;
  labelImage?: string;
  items: MenuItem[];
}

export interface MenuData {
  sections: Section[];
}
