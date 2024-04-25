import React from "react";
import NanaCard from "@/components/NanaCard";
import { HStack } from "@chakra-ui/react";
import { SystemStyleObject } from "@chakra-ui/styled-system";
import { ActionPrefix, Card, Player } from "@/types";

const PublicArea = ({
  sx,
  cards,
  act,
}: {
  sx?: SystemStyleObject;
  cards: Card[];
  act: (action: ActionPrefix, data?: any) => void;
}) => {
  return (
    <HStack padding="8px" flexWrap="wrap">
      {cards.map((card) => (
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
      ))}
    </HStack>
  );
};

export default PublicArea;
