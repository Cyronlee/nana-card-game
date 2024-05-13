"use client";

import React from "react";
import { IconButton } from "@chakra-ui/react";
import { BiVolumeFull, BiVolumeMute } from "react-icons/bi";

import { useGameSound } from "@/lib/use-game-sound";
import { useGameSettingsStore } from "@/store/setting-store";

const VolumeButton = () => {
  let { soundEnabled, toggleSoundEnabled } = useGameSettingsStore();

  let { playToggle } = useGameSound();

  return (
    <IconButton
      variant="outline"
      color="white"
      colorScheme="none"
      aria-label="Sound"
      size="sm"
      fontSize="20px"
      onClick={() => {
        if (!soundEnabled) {
          playToggle();
        }
        toggleSoundEnabled();
      }}
      icon={soundEnabled ? <BiVolumeFull /> : <BiVolumeMute />}
    />
  );
};

export default VolumeButton;
