"use client";

import React from "react";
// @ts-ignore
import useSound from "use-sound";
import { Button, Center, Text, VStack } from "@chakra-ui/react";

const Page = () => {
  const [playWin] = useSound("/sound/win.mp3");
  const [playSuccess] = useSound("/sound/success.mp3");

  return (
    <VStack w="100vw" h="100vh" bgColor="gray.700" justifyContent="center">
      <Text fontSize="6xl" color="white">
        Sounds FX
      </Text>
      <Button onClick={playWin}>Win</Button>
      <Button onClick={playSuccess}>Success</Button>
    </VStack>
  );
};

export default Page;
