"use client";

import React, { useEffect, useState } from "react";
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
import { useGameStore } from "@/store/GameStore";
import Confetti from "react-confetti";

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

export default function GamePage() {
  const toast = useToast();
  // const [cardDeck, setCardDeck] = useState(ALL_GAME_CARDS);
  // const [myCards, setMyCards] = useState([]);
  // const [botCards, setBotCards] = useState([]);
  // const [publicCards, setPublicCards] = useState([]);
  const [revealedCards, setRevealedCards] = useState<string[]>([]);
  const [isWon, setIsWon] = useState(false);

  const {
    cardDeck,
    myCards,
    botCards,
    publicCards,
    dealToMe,
    dealToBot,
    dealToPublic,
    sortPlayerCards,
    reset,
  } = useGameStore();

  const shuffleCards = () => {
    // setCardDeck((prev) => shuffle(prev));
    console.log(cardDeck);
  };

  const handleGameStart = () => {
    dealCards();
  };

  const dealCards = () => {
    let times = 0;
    let intervalId = setInterval(() => {
      dealRandomCard("me");
      dealRandomCard("bot");
      dealRandomCard("public");
      if (++times >= 3) {
        clearInterval(intervalId);
        setTimeout(() => {
          sortPlayerCards();
        }, 500);
      }
    }, 500);
  };

  const dealRandomCard = (target: string) => {
    if (cardDeck.length === 0) return;
    // let optCards = [...cardDeck];
    const randomIndex = Math.floor(Math.random() * cardDeck.length);
    const [removedCard] = cardDeck.splice(randomIndex, 1);
    // setCardDeck(optCards);
    // removeFromCardDeck(removedCard);
    if (target === "me") {
      dealToMe(removedCard);
    } else if (target === "bot") {
      dealToBot(removedCard);
    } else if (target === "public") {
      dealToPublic(removedCard);
    }
  };

  const resetAll = () => {
    // setMyCards([]);
    // setBotCards([]);
    // setPublicCards([]);
    reset();
    setRevealedCards([]);
    // setCardDeck(ALL_GAME_CARDS);
  };

  const onFlipToFront = (cardId: string) => {
    setRevealedCards((prev) => [...prev, cardId]);
  };

  const onFlipToBack = (cardId: string) => {
    setRevealedCards((prev) => prev.filter((n) => n !== cardId));
  };

  useEffect(() => {
    if (revealedCards.length <= 1) {
      return;
    }
    for (let i = 1; i < revealedCards.length; i++) {
      if (revealedCards[i].split("-")[0] !== revealedCards[0].split("-")[0]) {
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
        return;
      }
    }
    if (revealedCards.length >= 3) {
      setIsWon(true);
      toast({
        title: "挑战成功",
        description: "恭喜你连续翻出三张相同数字",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      return;
    }
  }, [revealedCards]);

  const revealMyMinCard = () => {
    onFlipToFront(myCards[0]);
  };

  return (
    <VStack w="100vw" h="100vh" bgColor="gray.100">
      <Confetti
        width={window.innerWidth}
        height={window.innerWidth}
        recycle={false}
        run={isWon}
        onConfettiComplete={() => setIsWon(false)}
      />
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
          <Button colorScheme="cyan" onClick={() => handleGameStart()}>
            开始游戏
          </Button>
          <Button colorScheme="cyan" onClick={() => shuffleCards()}>
            洗牌
          </Button>
          {/*<Button colorScheme="cyan" onClick={() => dealRandomCard("bot")}>*/}
          {/*  发牌给机器人*/}
          {/*</Button>*/}
          {/*<Button colorScheme="cyan" onClick={() => dealRandomCard("public")}>*/}
          {/*  发牌到公共区*/}
          {/*</Button>*/}
          {/*<Button colorScheme="cyan" onClick={() => dealRandomCard("me")}>*/}
          {/*  发牌给我*/}
          {/*</Button>*/}
          <Button colorScheme="cyan" onClick={() => resetAll()}>
            重置
          </Button>
        </VStack>
      </HStack>

      <HStack>
        <Button colorScheme="cyan" onClick={() => revealMyMinCard()}>
          最小
        </Button>
        <VStack w="600px" bgColor="#333" borderRadius="24px">
          <Text color="white">已揭示的卡牌：{revealedCards}</Text>
          <Text color="white">我的卡牌 {myCards.join(", ")}</Text>
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
