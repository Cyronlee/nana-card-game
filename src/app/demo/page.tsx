"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Box, Button, Center, VStack, HStack } from "@chakra-ui/react";

const Card = ({ number, ...props }) => (
  <Box
    as={motion.div}
    layoutId={`card-${number}`}
    bg="cyan.500"
    w="70px"
    h="100px"
    border="1px solid gray"
    borderRadius="4px"
    props
  >
    <p style={{ textAlign: "center", fontSize: "24px" }}>{number}</p>
  </Box>
);

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
            // <Card
            //   key={number}
            //   initial={{ opacity: 0, x: -200, y: 100 * index }}
            //   animate={{ opacity: 1, x: 2 + index, y: 2 + index }}
            //   exit={{ opacity: 0, x: 200, y: 100 * index }}
            //   transition={{ duration: 1 }}
            //   number={number}
            // ></Card>

            <Box
              as={motion.div}
              key={number}
              layoutId={`card-${number}`}
              bg="cyan.500"
              h="100px"
              w="70px"
              border="1px solid gray"
              borderRadius="4px"
              initial={{ opacity: 0, x: -200, y: 100 * index }}
              animate={{ opacity: 1, x: 2 + index, y: 2 + index }}
              transition={{ duration: 1 }}
              position="absolute"
            >
              <p style={{ textAlign: "center", fontSize: "24px" }}>{number}</p>
            </Box>
          ))}
        </AnimatePresence>
      </Center>
      <Button onClick={dealCards}>发牌</Button>

      <VStack>
        <div>my cards</div>
        <Center h="100px" w="400px" border="1px solid">
          {myCards.map((number, index) => (
            <Box
              as={motion.div}
              key={number}
              layoutId={`card-${number}`}
              bg="cyan.500"
              h="100px"
              w="70px"
              border="1px solid gray"
              borderRadius="4px"
              // initial={{ opacity: 0, x: -200, y: 100 * index }}
              // animate={{ opacity: 1, x: 2 + index, y: 2 + index }}
              transition={{ duration: 1 }}
              position="absolute"
            >
              <p style={{ textAlign: "center", fontSize: "24px" }}>{number}</p>
            </Box>
          ))}
        </Center>
      </VStack>
    </VStack>
  );
}
