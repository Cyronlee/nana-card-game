import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

type SupportedLang = "zh" | "en";

interface SettingState {
  playerId: string;
  playerName: string;
  soundEnabled: boolean;
  language: SupportedLang | "";
}
interface SettingAction {
  toggleSoundEnabled: any;
  switchLanguage: any;
}

export const useGameSettingsStore = create<SettingState & SettingAction>()(
  persist(
    (set, get) => ({
      playerId: "",
      playerName: "",
      soundEnabled: false,
      language: "",
      toggleSoundEnabled: () => set({ soundEnabled: !get().soundEnabled }),
      switchLanguage: (lang: SupportedLang) => set({ language: lang }),
    }),
    {
      name: "game-settings", // name of the item in the storage (must be unique)
      storage: createJSONStorage(() => localStorage), // (optional) by default, 'localStorage' is used
    },
  ),
);
