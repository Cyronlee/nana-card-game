"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Button, Center, VStack, HStack } from "@chakra-ui/react";
import PokerCard from "@/components/PokerCard";

export default function App() {
  const [cards, setCards] = useState(
    Array.from({ length: 9 }, (_, index) => index + 1),
  );
  const [myCards, setMyCards] = useState([]);
  const dealCards = () => {
    let newCards = [...cards];
    let lastCard = newCards.pop();
    // let newCards = cards.slice(0, -1);
    setCards(newCards);
    setMyCards([...myCards, lastCard]);
  };

  return (
    <VStack>
      <Center h="300px" w="400px" border="1px solid">
        <AnimatePresence>
          {cards.map((number, index) => (
            <motion.div
              key={number}
              // layoutId={`card-${number}`}
              initial={{ opacity: 0, x: -200, y: -100 * index }}
              animate={{ opacity: 1, x: 2 + index, y: 2 + index }}
              transition={{ duration: 1 }}
              style={{ position: "absolute" }}
            >
              <PokerCard
                // key={number}
                layoutId={`card-${number}`}
                w="182px"
                h="256px"
              />
            </motion.div>
          ))}
        </AnimatePresence>
      </Center>
      <Button onClick={dealCards}>发牌</Button>

      <VStack>
        <div>my cards</div>
        <HStack h="30vh" w="80vw" border="1px solid" justifyContent="center">
          {myCards.map((number, index) => (
            <PokerCard
              key={number}
              layoutId={`card-${number}`}
              w="182px"
              h="256px"
            />
          ))}
        </HStack>
      </VStack>
    </VStack>
  );
}
