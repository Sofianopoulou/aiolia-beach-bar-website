export const createSlug = (value: string) =>
  value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");

export const createProductId = (sectionName: string, productName: string) =>
  `${createSlug(sectionName)}__${createSlug(productName)}`;
