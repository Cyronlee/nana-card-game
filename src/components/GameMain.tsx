"use client";

import React, { useEffect, useLayoutEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Button,
  Center,
  HStack,
  VStack,
  Text,
  ButtonGroup,
  useToast,
  Avatar,
  Box,
  Heading,
} from "@chakra-ui/react";
import NanaCard from "@/components/NanaCard";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import { ServerGameState } from "@/types/server";
import { useClientGameStore } from "@/store/client-game-store";
import { ActionPrefix } from "@/app/api/action/route";
import { useLocalStorageState } from "ahooks";
import { randomString } from "@/lib/random";

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

export default function GameMain({
  serverState,
  act,
}: {
  serverState: ServerGameState;
  act: (action: ActionPrefix, data?: any) => void;
}) {
  const { width, height } = useWindowSize();

  const [playerInfo] = useLocalStorageState("player-info");

  const toast = useToast();

  useLayoutEffect(() => {
    console.log(serverState);
  }, []);

  // const {
  //   players,
  //   gameStage,
  //   // setGameStage,
  //   // dealRandomCardTo,
  //   gameSubStage,
  //   cardDeck,
  //   publicCards,
  //   getPlayer,
  //   // dealRestOfCards,
  //   // revealPublicCard,
  //   // revealPlayerCard,
  //   updatePlayers,
  //   resetTable,
  //   // getRevealedCards,
  //   updateCardDeck,
  //   dealCard,
  // } = useClientGameStore();

  useEffect(() => {
    console.log(serverState);
  }, [serverState]);

  // useEffect(() => {
  //   if (serverState.cardDeck) {
  //     updateCardDeck(serverState.cardDeck);
  //
  //     setTimeout(() => {
  //       serverState.players.forEach((p) => {
  //         p.hand.forEach((c) => {
  //           dealCard(p.id, c.id);
  //         });
  //       });
  //     }, 1000);
  //   }
  // }, [serverState.cardDeck]);

  // useEffect(() => {
  //   if (serverState.players && serverState?.gameStage === "stage:lobby") {
  //     updatePlayers(serverState.players);
  //   }
  // }, [serverState.players]);

  const handleGameStart = () => {
    act("action:start-game");
  };

  // const dealCards = () => {
  //   let times = 0;
  //   let intervalId = setInterval(() => {
  //     dealRandomCardTo("me");
  //     dealRandomCardTo("bot");
  //     // dealRandomCard("public");
  //     if (++times >= 3) {
  //       clearInterval(intervalId);
  //       setTimeout(() => {
  //         dealRestOfCards();
  //       }, 500);
  //     }
  //   }, 500);
  // };

  // useEffect(() => {
  //   const revealedCards = getRevealedCards();
  //   if (revealedCards.length <= 1) {
  //     return;
  //   }
  //   for (let i = 1; i < revealedCards.length; i++) {
  //     if (
  //       revealedCards[i].id.split("-")[0] !== revealedCards[0].id.split("-")[0]
  //     ) {
  //       setTimeout(() => {
  //         setRoundStage("failed");
  //         toast({
  //           title: "挑战失败",
  //           description: "试着连续翻出三张一样的数字",
  //           status: "error",
  //           duration: 9000,
  //           isClosable: true,
  //         });
  //       }, 1000);
  //       return;
  //     }
  //   }
  //   if (revealedCards.length >= 3) {
  //     setRoundStage("success");
  //     toast({
  //       title: "挑战成功",
  //       description: "恭喜你连续翻出三张相同数字",
  //       status: "success",
  //       duration: 9000,
  //       isClosable: true,
  //     });
  //     return;
  //   }
  // }, [getRevealedCards()]);

  const player1 = serverState.players.find((p) => p.id == playerInfo.id);
  const player2 = serverState.players.find((p) => p.id != playerInfo.id);

  return (
    <Center w={width} h={900} bgColor="gray.100">
      {/*<Confetti*/}
      {/*  width={width}*/}
      {/*  height={height}*/}
      {/*  recycle={false}*/}
      {/*  run={gameSubStage === "win"}*/}
      {/*  onConfettiComplete={() => setRoundStage("")}*/}
      {/*/>*/}
      <VStack
      // w="100vw"
      // h="100vh"
      >
        <HStack w="900px" bgColor="#333" paddingX="24px" borderRadius="24px">
          <HStack flex="1" gap="4" alignItems="center" flexWrap="wrap">
            <Avatar bg="teal.500" />
            <Box>
              <Heading color="white" size="sm">
                Player 2
              </Heading>
              <Text color="white">
                {player2 ? player2.name : "等待加入..."}
              </Text>
            </Box>
          </HStack>

          <HStack h="136px" padding="8px" flexWrap="wrap">
            {player2 &&
              player2?.hand?.map((card, index) => (
                <NanaCard
                  onClick={(cardId) =>
                    act("action:reveal-player-card", {
                      playerId: player2.id,
                      cardId: card.id,
                    })
                  }
                  key={card.id}
                  cardId={card.id}
                  isRevealed={card.isRevealed}
                  w="90px"
                  h="120px"
                />
              ))}
          </HStack>
        </HStack>

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
            {serverState?.cardDeck?.map((card, index) => (
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
            <Text color="white">游戏状态: {serverState.gameStage}</Text>
            <Text color="white">公共区</Text>
            <HStack padding="8px" flexWrap="wrap">
              {serverState?.publicCards?.map((card) => (
                <NanaCard
                  onClick={(cardId) =>
                    act("action:reveal-public-card", { cardId: card.id })
                  }
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
              // isDisabled={gameStage !== "seat"}
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
          <HStack w="900px" bgColor="#333" paddingX="24px" borderRadius="24px">
            <HStack flex="1" gap="4" alignItems="center" flexWrap="wrap">
              <Avatar bg="teal.500" />
              <Box>
                <Heading color="white" size="sm">
                  Player 1
                </Heading>
                <Text color="white">{playerInfo.name}</Text>
              </Box>
            </HStack>
            <HStack h="136px" padding="8px" flexWrap="wrap">
              {player1 &&
                player1?.hand?.map((card) => (
                  <NanaCard
                    onClick={(cardId) =>
                      act("action:reveal-player-card", {
                        playerId: player1.id,
                        cardId: card.id,
                      })
                    }
                    key={card.id}
                    cardId={card.id}
                    isRevealed={card.isRevealed}
                    w="90px"
                    h="120px"
                  />
                ))}
            </HStack>
          </HStack>
          <Button colorScheme="green">最大</Button>
        </HStack>
      </VStack>
    </Center>
  );
}
