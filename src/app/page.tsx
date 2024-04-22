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
import { useGameStore } from "@/store/game-store";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";

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
  const { width, height } = useWindowSize();
  const toast = useToast();
  // const [cardDeck, setCardDeck] = useState(ALL_GAME_CARDS);
  // const [myCards, setMyCards] = useState([]);
  // const [botCards, setBotCards] = useState([]);
  // const [publicCards, setPublicCards] = useState([]);
  const [roundStage, setRoundStage] = useState("");
  // const [revealedCards, setRevealedCards] = useState<string[]>([]);

  const {
    players,
    gameStage,
    setGameStage,
    dealRandomCardTo,
    gameSubStage,
    cardDeck,
    publicCards,
    getPlayer,
    dealRestOfCards,
    revealPublicCard,
    revealPlayerCard,
    resetTable,
    getRevealedCards,
  } = useGameStore();

  const handleGameStart = () => {
    if (gameStage === "seat") {
      setGameStage("in-game");
      dealCards();
    }
  };

  const dealCards = () => {
    let times = 0;
    let intervalId = setInterval(() => {
      dealRandomCardTo("me");
      dealRandomCardTo("bot");
      // dealRandomCard("public");
      if (++times >= 3) {
        clearInterval(intervalId);
        setTimeout(() => {
          dealRestOfCards();
        }, 500);
      }
    }, 500);
  };

  const resetGame = () => {
    resetTable();
  };

  useEffect(() => {
    const revealedCards = getRevealedCards();
    if (revealedCards.length <= 1) {
      return;
    }
    for (let i = 1; i < revealedCards.length; i++) {
      if (
        revealedCards[i].id.split("-")[0] !== revealedCards[0].id.split("-")[0]
      ) {
        setTimeout(() => {
          setRoundStage("failed");
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
      setRoundStage("success");
      toast({
        title: "挑战成功",
        description: "恭喜你连续翻出三张相同数字",
        status: "success",
        duration: 9000,
        isClosable: true,
      });
      return;
    }
  }, [getRevealedCards()]);

  const revealMyMinCard = () => {
    // onFlipToFront(myCards[0]);
  };

  return (
    <Center w="100vw" h="100vh" bgColor="gray.100">
      <Confetti
        width={width}
        height={height}
        recycle={false}
        run={gameSubStage === "win"}
        onConfettiComplete={() => setRoundStage("")}
      />
      <VStack
      // w="100vw"
      // h="100vh"
      >
        <Text>Game Stage: {gameStage}</Text>
        <Text>Round Stage: {roundStage}</Text>

        <VStack w="900px" bgColor="#333" borderRadius="24px">
          <Text color="white">电脑</Text>
          <HStack h="136px" padding="8px" flexWrap="wrap">
            {getPlayer("bot").hand.map((card, index) => (
              <NanaCard
                onClick={(cardId) => revealPlayerCard("bot", card.id)}
                key={card.id}
                cardId={card.id}
                isRevealed={card.isRevealed}
                w="90px"
                h="120px"
              />
            ))}
          </HStack>
        </VStack>

        <HStack
          w="1200px"
          // h="400px"
          padding="24px"
          border="24px solid "
          bgColor="#333"
          borderRadius="96px"
          justifyContent="center"
        >
          <Center
            w="140px"
            h="180px"
            borderRadius="24px"
            // bgColor="#fff"
            border="2px solid white"
          >
            {cardDeck.map((card, index) => (
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
          <VStack
            w="600px"
            h="320px"
            // bgColor="#fff"
            border="2px solid white"
            borderRadius="24px"
          >
            <Text fontColor="white">公共区</Text>
            <HStack padding="8px" flexWrap="wrap">
              {publicCards.map((card) => (
                <NanaCard
                  onClick={(cardId) => revealPublicCard(card.id)}
                  key={card.id}
                  cardId={card.id}
                  isRevealed={card.isRevealed}
                  w="90px"
                  h="120px"
                />
              ))}
            </HStack>
          </VStack>

          <VStack>
            <Button
              colorScheme="green"
              onClick={() => handleGameStart()}
              isDisabled={gameStage !== "seat"}
            >
              开始游戏
            </Button>
            {/*<Button colorScheme="green" onClick={() => shuffleCards()}>*/}
            {/*  洗牌*/}
            {/*</Button>*/}
            {/*<Button colorScheme="green" onClick={() => dealRandomCard("bot")}>*/}
            {/*  发牌给机器人*/}
            {/*</Button>*/}
            {/*<Button colorScheme="green" onClick={() => dealRandomCard("public")}>*/}
            {/*  发牌到公共区*/}
            {/*</Button>*/}
            {/*<Button colorScheme="green" onClick={() => dealRandomCard("me")}>*/}
            {/*  发牌给我*/}
            {/*</Button>*/}
            <Button colorScheme="green" onClick={() => resetGame()}>
              重置
            </Button>
          </VStack>
        </HStack>

        <HStack>
          <Button colorScheme="green" onClick={() => revealMyMinCard()}>
            最小
          </Button>
          <VStack w="900px" bgColor="#333" borderRadius="24px">
            <Text color="white">
              已揭示的卡牌：
              {getRevealedCards()
                .map((c) => c.id)
                .join(", ")}
            </Text>
            <HStack h="136px" padding="8px" flexWrap="wrap">
              {getPlayer("me").hand.map((card) => (
                <NanaCard
                  onClick={(cardId) => revealPlayerCard("me", card.id)}
                  key={card.id}
                  cardId={card.id}
                  isRevealed={card.isRevealed}
                  w="90px"
                  h="120px"
                />
              ))}
            </HStack>
          </VStack>
          <Button colorScheme="green">最大</Button>
        </HStack>
      </VStack>
    </Center>
  );
}
