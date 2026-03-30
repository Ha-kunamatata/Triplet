import { create } from 'zustand';
import type { Place, SavedPlace } from '@types/index';

interface PlaceState {
  searchResults: Place[];
  savedPlaces: SavedPlace[];
  recentSearches: string[];
  isSearching: boolean;

  // Actions
  setSearchResults: (places: Place[]) => void;
  setSavedPlaces: (places: SavedPlace[]) => void;
  addSavedPlace: (place: SavedPlace) => void;
  removeSavedPlace: (placeId: string) => void;
  addRecentSearch: (query: string) => void;
  clearRecentSearches: () => void;
  setSearching: (searching: boolean) => void;
  clearSearchResults: () => void;
}

export const usePlaceStore = create<PlaceState>((set) => ({
  searchResults: [],
  savedPlaces: [],
  recentSearches: [],
  isSearching: false,

  setSearchResults: (places) => set({ searchResults: places }),

  setSavedPlaces: (places) => set({ savedPlaces: places }),

  addSavedPlace: (place) =>
    set((state) => ({
      savedPlaces: [place, ...state.savedPlaces],
    })),

  removeSavedPlace: (placeId) =>
    set((state) => ({
      savedPlaces: state.savedPlaces.filter((p) => p.place.id !== placeId),
    })),

  addRecentSearch: (query) =>
    set((state) => {
      const filtered = state.recentSearches.filter((q) => q !== query);
      return {
        recentSearches: [query, ...filtered].slice(0, 10),
      };
    }),

  clearRecentSearches: () => set({ recentSearches: [] }),

  setSearching: (isSearching) => set({ isSearching }),

  clearSearchResults: () => set({ searchResults: [] }),
}));
