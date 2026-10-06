import type { MenuData } from "../types/types";

let cachedMenu: MenuData | null = null;
let menuRequest: Promise<MenuData> | null = null;

export function getCachedMenu(): MenuData | null {
  return cachedMenu;
}

export function getMenu(): Promise<MenuData> {
  if (cachedMenu) {
    return Promise.resolve(cachedMenu);
  }

  if (menuRequest) {
    return menuRequest;
  }

  menuRequest = fetch("/menu.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error("Could not load menu");
      }

      return response.json() as Promise<MenuData>;
    })
    .then((menu) => {
      cachedMenu = menu;
      return menu;
    })
    .catch((error: unknown) => {
      // Let a later mount retry if the network or server failed.
      menuRequest = null;
      throw error;
    });

  return menuRequest;
}
