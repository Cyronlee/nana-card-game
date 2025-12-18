"use client";

import React, { useEffect } from "react";
import { Box, HStack } from "@chakra-ui/react";
import { Card } from "@/types";
import { useGameSound } from "@/lib/use-game-sound";
import NanaCard from "@/components/NanaCard";

interface LocalPublicAreaProps {
  cards: Card[];
  onRevealCard: (cardId: string) => void;
  isMyTurn: boolean;
}

const LocalPublicArea = ({
  cards,
  onRevealCard,
  isMyTurn,
}: LocalPublicAreaProps) => {
  const { playWoosh } = useGameSound();
  const revealedCount = cards.filter((card) => card.isRevealed).length;

  useEffect(() => {
    if (revealedCount > 0) {
      playWoosh();
    }
  }, [revealedCount]);

  return (
    <HStack p="8px" flexWrap="wrap" justify="center" gap="8px">
      {cards.map((card, i) =>
        card.id ? (
          <NanaCard
            onClick={() => {
              if (isMyTurn && !card.isRevealed) {
                onRevealCard(card.id);
              }
            }}
            key={card.id}
            cardId={card.id}
            isRevealed={card.isRevealed}
            w="90px"
            h="120px"
            sx={{
              cursor: isMyTurn && !card.isRevealed ? "pointer" : "default",
              opacity: isMyTurn ? 1 : 0.8,
            }}
          />
        ) : (
          <Box
            key={`placeholder-${i}`}
            w="90px"
            h="120px"
            borderRadius="10px"
            border="2px dashed"
            borderColor="gray.600"
          />
        )
      )}
    </HStack>
  );
};

export default LocalPublicArea;

