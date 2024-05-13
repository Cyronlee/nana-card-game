"use client";

import React from "react";
import i18n from "i18next";

import { IconButton } from "@chakra-ui/react";
import { useGameSettingsStore } from "@/store/setting-store";
import { IoLanguage } from "react-icons/io5";

const LanguageButton = () => {
  let { language, switchLanguage } = useGameSettingsStore();

  return (
    <IconButton
      variant="outline"
      color="white"
      colorScheme="none"
      aria-label="Language"
      size="sm"
      fontSize="20px"
      onClick={() => {
        switchLanguage(language === "zh" ? "en" : "zh");
        i18n.changeLanguage(language === "zh" ? "en" : "zh");
      }}
      icon={<IoLanguage />}
    />
  );
};

export default LanguageButton;
