"use client";

import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Button,
  Center,
  HStack,
  VStack,
  Text,
  ButtonGroup,
  useToast,
} from "@chakra-ui/react";
import NanaCard from "@/components/NanaCard";
import { shuffle } from "@/lib/random";

// const ALL_CARDS = Array.from({ length: 9 }, (_, index) => index + 1);
const ALL_GAME_CARDS = [
  "1-a",
  "1-b",
  "1-c",
  "2-a",
  "2-b",
  "2-c",
  // "3-a",
  // "3-b",
  // "3-c",
];

export default function App() {
  const toast = useToast();
  const [cardDeck, setCardDeck] = useState(ALL_GAME_CARDS);
  const [myCards, setMyCards] = useState([]);
  const [botCards, setBotCards] = useState([]);
  const [publicCards, setPublicCards] = useState([]);
  const [revealedCardNumbers, setRevealedCardNumbers] = useState([]);

  const shuffleCards = () => {
    setCardDeck((prev) => shuffle(prev));
    console.log(cardDeck);
  };

  const dealRandomCard = (target: string) => {
    if (cardDeck.length === 0) return;
    let optCards = [...cardDeck];
    const randomIndex = Math.floor(Math.random() * optCards.length);
    const [removedCard] = optCards.splice(randomIndex, 1);
    setCardDeck(optCards);
    if (target === "me") {
      setMyCards((prev) => [...prev, removedCard]);
    } else if (target === "bot") {
      setBotCards((prev) => [...prev, removedCard]);
    } else if (target === "public") {
      setPublicCards((prev) => [...prev, removedCard]);
    }
  };

  const resetAll = () => {
    setMyCards([]);
    setBotCards([]);
    setPublicCards([]);
    setRevealedCardNumbers([]);
    setCardDeck(ALL_GAME_CARDS);
  };

  const onFlipToFront = (cardId: string) => {
    const cardNumber = cardId.split("-")[0];
    if (revealedCardNumbers.length === 0) {
      setRevealedCardNumbers([cardNumber]);
    } else if (revealedCardNumbers.includes(cardNumber)) {
      setRevealedCardNumbers((prev) => [...prev, cardNumber]);
    } else {
      setTimeout(() => {
        resetAll();
        toast({
          title: "挑战失败",
          description: "试着连续翻出三张一样的数字",
          status: "error",
          duration: 9000,
          isClosable: true,
        });
      }, 1000);
    }
  };

  const onFlipToBack = (cardId: number) => {
    // setRevealedCardNumbers((prev) => prev.filter((n) => n != cardId));
  };

  return (
    <VStack w="100vw" h="100vh" bgColor="gray.100">
      <VStack w="600px" bgColor="#333" borderRadius="24px">
        <Text color="white">电脑</Text>
        <HStack h="136px" padding="8px" flexWrap="wrap">
          {botCards.map((cardId, index) => (
            <NanaCard
              onFlipToFront={onFlipToFront}
              onFlipToBack={onFlipToBack}
              key={cardId}
              cardId={cardId}
              w="90px"
              h="120px"
            />
          ))}
        </HStack>
      </VStack>

      <HStack
        // w="800px"
        // h="400px"
        padding="24px"
        border="24px solid "
        bgColor="#333"
        borderRadius="96px"
        justifyContent="center"
      >
        <Center w="140px" h="180px" borderRadius="24px" bgColor="#fff">
          <AnimatePresence>
            {cardDeck.map((cardId, index) => (
              <motion.div
                key={cardId}
                // layoutId={`card-${number}`}
                initial={{ opacity: 0, x: -200, y: -100 * index }}
                animate={{ opacity: 1, x: 2 + index, y: 2 + index }}
                transition={{ duration: 1 }}
                style={{ position: "absolute" }}
              >
                <NanaCard
                  onFlipToFront={onFlipToFront}
                  onFlipToBack={onFlipToBack}
                  key={cardId}
                  cardId={cardId}
                  w="90px"
                  h="120px"
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </Center>
        <VStack w="600px" h="320px" bgColor="#fff" borderRadius="24px">
          <p>公共区</p>
          <HStack padding="8px" flexWrap="wrap">
            {publicCards.map((cardId, index) => (
              <NanaCard
                onFlipToFront={onFlipToFront}
                onFlipToBack={onFlipToBack}
                key={cardId}
                cardId={cardId}
                w="90px"
                h="120px"
              />
            ))}
          </HStack>
        </VStack>

        <VStack>
          <Button colorScheme="cyan" onClick={() => shuffleCards()}>
            洗牌
          </Button>
          <Button colorScheme="cyan" onClick={() => dealRandomCard("bot")}>
            发牌给机器人
          </Button>
          <Button colorScheme="cyan" onClick={() => dealRandomCard("public")}>
            发牌到公共区
          </Button>
          <Button colorScheme="cyan" onClick={() => dealRandomCard("me")}>
            发牌给我
          </Button>
          <Button colorScheme="cyan" onClick={() => resetAll()}>
            重置
          </Button>
        </VStack>
      </HStack>

      <HStack>
        <Button colorScheme="cyan">最小</Button>
        <VStack w="600px" bgColor="#333" borderRadius="24px">
          <Text color="white">已揭示的卡牌：{revealedCardNumbers}</Text>
          <Text color="white">我的卡牌</Text>
          <HStack h="136px" padding="8px" flexWrap="wrap">
            {myCards.map((cardId, index) => (
              <NanaCard
                onFlipToFront={onFlipToFront}
                onFlipToBack={onFlipToBack}
                key={cardId}
                cardId={cardId}
                w="90px"
                h="120px"
              />
            ))}
          </HStack>
        </VStack>
        <Button colorScheme="cyan">最大</Button>
      </HStack>
    </VStack>
  );
}
