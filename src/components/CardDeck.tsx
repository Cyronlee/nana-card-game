"use client";

import React from "react";
import { motion } from "framer-motion";
import NanaCard from "@/components/NanaCard";
import { Center } from "@chakra-ui/react";
import { Card } from "@/types";

const CardDeck = ({ cards }: { cards: Card[] }) => {
  return (
    <Center
      w="140px"
      h="180px"
      borderRadius="24px"
      // bgColor="#fff"
      // border="2px solid white"
    >
      {cards &&
        cards.map((card, index) => (
          <motion.div
            key={card.id}
            initial={{ opacity: 0, x: -200, y: -100 * index }}
            animate={{ opacity: 1, x: 2 + index, y: 2 + index }}
            transition={{ duration: 1 }}
            style={{ position: "absolute" }}
          >
            <NanaCard
              onClick={(cardId) => {}}
              key={card.id}
              cardId={card.id}
              isRevealed={card.isRevealed}
              w="90px"
              h="120px"
            />
          </motion.div>
        ))}
    </Center>
  );
};

export default CardDeck;
