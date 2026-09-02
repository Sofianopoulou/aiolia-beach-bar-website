import type { MenuItem, ModifierGroup, Section } from "../types/types";

export function getProductModifierGroups(
  section: Section,
  item: MenuItem,
): ModifierGroup[] {
  const inheritSectionModifiers = item.inheritSectionModifiers !== false;

  const sectionModifiers = inheritSectionModifiers
    ? (section.modifierGroups ?? [])
    : [];

  const itemModifiers = item.modifierGroups ?? [];

  return [...sectionModifiers, ...itemModifiers];
}

export function hasProductModifiers(section: Section, item: MenuItem) {
  return getProductModifierGroups(section, item).length > 0;
}
