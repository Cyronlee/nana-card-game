"use client";

import { Card } from "@/types";
import { Box, HStack, Text } from "@chakra-ui/react";
import { motion } from "framer-motion";
import NanaCard from "@/components/NanaCard";
import React, { useEffect } from "react";

const CollectionArea = ({ cards }: { cards: Card[] }) => {
  const groupedCards = cards.reduce(
    (acc, card) => {
      if (!acc[card.number]) {
        acc[card.number] = [];
      }
      acc[card.number].push(card);
      return acc;
    },
    {} as { [key: string]: Card[] },
  );

  return (
    <HStack
      sx={{
        // border: "1px solid white",
        width: "220px",
        height: "-webkit-fill-available",
      }}
    >
      {cards.length > 0 && <Text color="white">已收集:</Text>}
      {Object.keys(groupedCards).map((key) => (
        <Box h="64px" w="45px" key={key}>
          {groupedCards[key].map((c, i) => (
            <motion.div
              key={c.id}
              animate={{ y: 4 * i }}
              transition={{ duration: 1 }}
              style={{ position: "absolute" }}
            >
              <NanaCard
                onClick={() => {}}
                cardId={c.id}
                isRevealed={true}
                w="45px"
                h="60px"
              />
            </motion.div>
          ))}
        </Box>
      ))}
    </HStack>
  );
};

export default CollectionArea;
