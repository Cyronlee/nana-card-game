import React from "react";
import NanaCard from "@/components/NanaCard";
import { Box, HStack } from "@chakra-ui/react";
import { Card } from "@/types";

const HandArea = ({
  isMe = false,
  cards,
  onCardClick,
}: {
  isMe: boolean;
  cards: Card[] | undefined;
  onCardClick: (cardId: string) => void;
}) => {
  return (
    <HStack h="136px" w="-webkit-fill-available" padding="8px">
      {cards?.map((card) => (
        <Box
          key={card.id}
          sx={{
            height: "100%",
            width: "100%",
            maxWidth: "90px",
            position: "relative",
            // border: "1px solid white",
          }}
        >
          <NanaCard
            sx={{
              position: "absolute",
              top: isMe && card.isRevealed ? "-32px" : "0",
            }}
            // onClick={(cardId) =>
            //   act("action:reveal-player-card", {
            //     playerId: player1.id,
            //     cardId: card.id,
            //   })
            // }
            onClick={() => onCardClick(card.id)}
            cardId={card.id}
            isRevealed={isMe ? true : card.isRevealed}
            w="90px"
            h="120px"
          />
        </Box>
      ))}
      <Box
        sx={{
          height: "100%",
          width: "50%",
          // border: "1px solid white",
        }}
      ></Box>
    </HStack>
  );
};

export default HandArea;
