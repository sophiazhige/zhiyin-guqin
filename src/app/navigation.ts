import { createContext, useContext } from "react";

export interface NavigationContext {
  goNext: () => void;
  goPrev: () => void;
  goTo: (page: number) => void;
  currentPage: number;
}

export const NavContext = createContext<NavigationContext>({
  goNext: () => {},
  goPrev: () => {},
  goTo: () => {},
  currentPage: 0,
});

export function useNav() {
  return useContext(NavContext);
}

export const PAGES = {
  WELCOME: 0,
  INTAKE_D: 1,
  INTAKE_A: 2,
  INTAKE_B: 3,
  INTAKE_C: 4,
  INTAKE_F: 5,
  INTAKE_E: 6,
  TRANSITION: 7,
  DIAGNOSIS: 8,
  PRESCRIPTION: 9,
  PLAYER: 10,
  MY: 11,
  HISTORY: 12,
  FAVORITES: 13,
  PROGRESS: 14,
  CARE: 15,
} as const;
