"use client";

import React from "react";
import { Button, Center, Text, VStack } from "@chakra-ui/react";
import { useGameSound } from "@/lib/use-game-sound";
import VolumeButton from "@/components/VolumeButton";
import { useGameContext } from "@/lib/game-context";

const Page = () => {
  let { playWin, playSuccess } = useGameSound();

  return (
    <VStack w="100vw" h="100vh" bgColor="gray.700" justifyContent="center">
      <Text fontSize="6xl" color="white">
        Sound FX
      </Text>
      <VolumeButton></VolumeButton>
      <Button onClick={playWin}>Win</Button>
      <Button onClick={playSuccess}>Success</Button>
    </VStack>
  );
};

export default Page;
