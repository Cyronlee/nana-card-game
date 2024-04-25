import { Card } from "@/types";
import { Box, HStack } from "@chakra-ui/react";
import { motion } from "framer-motion";
import NanaCard from "@/components/NanaCard";
import React from "react";

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
    <HStack>
      {Object.keys(groupedCards).map((key) => (
        <Box w="45px" key={key}>
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
