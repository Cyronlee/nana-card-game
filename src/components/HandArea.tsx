"use client";

import React from "react";
import NanaCard from "@/components/NanaCard";
import { Box, HStack } from "@chakra-ui/react";
import { Card } from "@/types";
import { useGameToast } from "@/lib/use-game-toast";

const HandArea = ({
  isMe = false,
  cards,
}: {
  isMe: boolean;
  cards: Card[] | undefined;
}) => {
  let { toastError, toastInfo, toastOk } = useGameToast();

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
            onClick={() => toastInfo("只可以选择玩家的最大/最小手牌")}
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
