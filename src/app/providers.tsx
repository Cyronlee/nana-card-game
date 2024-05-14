"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/index";
import { useGameSettingsStore } from "@/store/setting-store";
import { useEffect } from "react";

export function Providers({ children }: { children: React.ReactNode }) {
  const { _hasHydrated, language } = useGameSettingsStore();

  i18n.changeLanguage(language);

  return (
    <ChakraProvider>
      <I18nextProvider i18n={i18n}>{_hasHydrated && children}</I18nextProvider>
    </ChakraProvider>
  );
}
