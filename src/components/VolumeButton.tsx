"use client";

import React from "react";
import { IconButton } from "@chakra-ui/react";
import { useLocalStorageState } from "ahooks";
import { BiVolumeFull, BiVolumeMute } from "react-icons/bi";

import { useGameSound } from "@/lib/use-game-sound";
import { useGameContext } from "@/lib/game-context";

const VolumeButton = () => {
  const { gameState, setGameState } = useGameContext();

  let { playWoosh, playToggle } = useGameSound();

  return (
    <IconButton
      variant="outline"
      color="white"
      colorScheme="none"
      aria-label="Sound"
      size="sm"
      fontSize="20px"
      onClick={() => {
        setGameState({ soundEnabled: !gameState.soundEnabled });
        if (!gameState.soundEnabled) {
          playToggle();
        }
      }}
      icon={gameState.soundEnabled ? <BiVolumeFull /> : <BiVolumeMute />}
    />
  );
};

export default VolumeButton;
