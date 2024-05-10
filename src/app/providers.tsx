"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { GameContextProvider } from "@/lib/game-context";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ChakraProvider>
      <GameContextProvider>{children}</GameContextProvider>
    </ChakraProvider>
  );
}
