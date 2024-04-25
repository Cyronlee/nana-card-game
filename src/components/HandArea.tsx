import React from "react";
import NanaCard from "@/components/NanaCard";
import { HStack } from "@chakra-ui/react";
import { Card } from "@/types";

const HandArea = ({
  cards,
  onCardClick,
}: {
  cards: Card[] | undefined;
  onCardClick: (cardId: string) => void;
}) => {
  return (
    <HStack h="136px" padding="8px" flexWrap="wrap">
      {cards?.map((card) => (
        <NanaCard
          // onClick={(cardId) =>
          //   act("action:reveal-player-card", {
          //     playerId: player1.id,
          //     cardId: card.id,
          //   })
          // }
          onClick={() => onCardClick(card.id)}
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

export default HandArea;
