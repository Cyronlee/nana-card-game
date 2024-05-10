"use client";

import React from "react";
import { IconButton } from "@chakra-ui/react";
import { useLocalStorageState } from "ahooks";
import { BiVolumeFull, BiVolumeMute } from "react-icons/bi";

import { useGameSound } from "@/lib/use-game-sound";

const SoundFXButton = () => {
  const [enableSound, setEnableSound] =
    useLocalStorageState<boolean>("enable-sound");

  let { playWoosh } = useGameSound();

  return (
    <IconButton
      variant="outline"
      color="white"
      colorScheme="none"
      aria-label="Sound"
      size="sm"
      fontSize="20px"
      onClick={() => {
        if (!enableSound) {
          playWoosh();
        }
        setEnableSound(!enableSound);
      }}
      icon={enableSound ? <BiVolumeFull /> : <BiVolumeMute />}
    />
  );
};

export default SoundFXButton;
