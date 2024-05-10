"use client";

import React, { useEffect } from "react";
import NanaCard from "@/components/NanaCard";
import { HStack, Box } from "@chakra-ui/react";
import { SystemStyleObject } from "@chakra-ui/styled-system";
import { ActionPrefix, Card, Player } from "@/types";
import { useGameSound } from "@/lib/use-game-sound";

const PublicArea = ({
  sx,
  cards,
  act,
}: {
  sx?: SystemStyleObject;
  cards: Card[];
  act: (action: ActionPrefix, data?: any) => void;
}) => {
  const { playWoosh } = useGameSound();
  const revealedCount = cards.filter((card) => card.isRevealed).length;

  useEffect(() => {
    revealedCount && revealedCount > 0 && playWoosh();
  }, [revealedCount]);

  return (
    <HStack padding="8px" flexWrap="wrap">
      {cards.map((card, i) =>
        card.id ? (
          <NanaCard
            onClick={(cardId) =>
              act("action:reveal-public-card", { cardId: card.id })
            }
            key={card.id}
            cardId={card.id}
            isRevealed={card.isRevealed}
            w="90px"
            h="120px"
          />
        ) : (
          <Box key={`placeholder-${i}`} w="90px" h="120px"></Box>
        ),
      )}
    </HStack>
  );
};

export default PublicArea;
