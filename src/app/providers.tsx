"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { I18nextProvider } from "react-i18next";
import i18n from "@/i18n/index";
import { useGameSettingsStore } from "@/store/setting-store";

export function Providers({ children }: { children: React.ReactNode }) {
  let { language } = useGameSettingsStore();

  i18n.changeLanguage(language || "zh");

  return (
    <ChakraProvider>
      <I18nextProvider i18n={i18n}>{language && children}</I18nextProvider>
    </ChakraProvider>
  );
}
