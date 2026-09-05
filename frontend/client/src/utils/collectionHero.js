const STORAGE_KEY = "lyzov-collection-hero-seen";

export const hasSeenCollectionHero = () => {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(STORAGE_KEY) === "1";
};

export const markCollectionHeroSeen = () => {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(STORAGE_KEY, "1");
};
