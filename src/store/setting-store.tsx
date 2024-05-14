import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { randomString } from "@/lib/random";

type SupportedLang = "zh" | "en";

interface SettingState {
  playerId: string;
  playerName: string;
  soundEnabled: boolean;
  language: SupportedLang | "";
  _hasHydrated: boolean;
}
interface SettingAction {
  toggleSoundEnabled: any;
  setLanguage: any;
  setPlayerId: any;
  setPlayerName: any;
}

export const useGameSettingsStore = create<SettingState & SettingAction>()(
  persist(
    (set, get) => ({
      playerId: randomString(8),
      playerName: "",
      soundEnabled: false,
      language: "zh",
      setPlayerId: (playerId: string) => set({ playerId: playerId }),
      setPlayerName: (playerName: string) => set({ playerName: playerName }),
      toggleSoundEnabled: () => set({ soundEnabled: !get().soundEnabled }),
      setLanguage: (lang: SupportedLang) => set({ language: lang }),
      _hasHydrated: false,
      setHasHydrated: () => set({ _hasHydrated: true }),
    }),
    {
      name: "game-settings", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
      onRehydrateStorage: () => (state) => {
        if (state) {
          state._hasHydrated = true;
        }
      },
    },
  ),
);
