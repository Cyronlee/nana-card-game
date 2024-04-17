"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Button } from "@chakra-ui/react";

export default function App() {
  const [cards, setCards] = useState(
    Array.from({ length: 52 }, (_, index) => index + 1),
  );
  const [myCards, setMyCards] = useState([]);
  const dealCards = () => {
    let newCards = cards.slice(0, 1);
    const shuffledCards = [...cards].sort(() => Math.random() - 0.5);
    const dealtCards = shuffledCards.slice(0, 10);
    setCards(dealtCards);
  };

  return (
    <div
      style={{
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        height: "100vh",
      }}
    >
      <AnimatePresence>
        {cards.map((card, index) => (
          <motion.div
            key={card}
            initial={{ opacity: 0, x: -200, y: 100 * index }}
            animate={{ opacity: 1, x: 2 + index, y: 2 + index }}
            exit={{ opacity: 0, x: 200, y: 100 * index }}
            transition={{ duration: 1 }}
            style={{ position: "absolute", bottom: 0 }}
          >
            <Box
              bg="cyan.500"
              w="70px"
              h="100px"
              border="1px solid gray"
              borderRadius="4px"
            >
              <p style={{ textAlign: "center", fontSize: "24px" }}>{card}</p>
            </Box>
          </motion.div>
        ))}
      </AnimatePresence>
      <Button
        onClick={dealCards}
        style={{
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
        }}
      >
        发牌
      </Button>
    </div>
  );
}
