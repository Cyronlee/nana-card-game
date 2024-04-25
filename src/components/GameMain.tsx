"use client";

import React, {
  memo,
  useEffect,
  useLayoutEffect,
  useMemo,
  useState,
} from "react";
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
import { useClientGameStore } from "@/store/client-game-store";
import { useLocalStorageState } from "ahooks";
import { randomString } from "@/lib/random";
import { ActionPrefix, Card, LocalPlayerInfo, ServerState } from "@/types";
import CollectionArea from "@/components/CollectionArea";
import PlayerInfo from "@/components/PlayerInfo";
import HandArea from "@/components/HandArea";

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
  serverState: ServerState;
  act: (action: ActionPrefix, data?: any) => void;
}) {
  const { width, height } = useWindowSize();

  const [playerInfo] = useLocalStorageState<LocalPlayerInfo>("player-info");

  const toast = useToast();

  useLayoutEffect(() => {
    console.log(serverState);
  }, []);

  useEffect(() => {
    console.log(serverState);
  }, [serverState]);

  const handleGameStart = () => {
    act("action:start-game");
  };

  const player1 = serverState.players.find((p) => p.id == playerInfo?.id);
  const player2 = serverState.players.find((p) => p.id != playerInfo?.id);

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
        <HStack>
          <Button
            colorScheme="green"
            onClick={() =>
              act("action:reveal-player-card", {
                targetPlayerId: player2?.id,
                minMax: "min",
              })
            }
          >
            最小
          </Button>

          <HStack w="900px" bgColor="#333" paddingX="24px" borderRadius="24px">
            <PlayerInfo seatNumber={2} player={player2}></PlayerInfo>

            <HandArea
              cards={player2?.hand}
              onCardClick={(cardId) => {
                // act("action:reveal-player-card", {
                //   playerId: player2?.id,
                //   cardId: cardId,
                // });
              }}
            />
            <Box h="136px" padding="8px">
              {player2?.collection && (
                <CollectionArea cards={player2.collection}></CollectionArea>
              )}
            </Box>
          </HStack>
          <Button
            colorScheme="green"
            onClick={() =>
              act("action:reveal-player-card", {
                targetPlayerId: player2?.id,
                minMax: "max",
              })
            }
          >
            最大
          </Button>
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
            <Text color="white">
              游戏状态: {serverState.gameStage} - {serverState.gameSubStage} -{" "}
              {serverState.timestamp}
            </Text>
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
            {/*<Button colorScheme="green" onClick={() => resetGame()}>*/}
            {/*  重置*/}
            {/*</Button>*/}
          </VStack>
        </HStack>

        <HStack>
          <Button
            colorScheme="green"
            onClick={() =>
              act("action:reveal-player-card", {
                targetPlayerId: player1?.id,
                minMax: "min",
              })
            }
          >
            最小
          </Button>
          <HStack w="900px" bgColor="#333" paddingX="24px" borderRadius="24px">
            <PlayerInfo seatNumber={1} player={player1}></PlayerInfo>
            <HandArea
              cards={player1?.hand}
              onCardClick={(cardId) => {
                // act("action:reveal-player-card", {
                //   playerId: player1?.id,
                //   cardId: cardId,
                // });
              }}
            />
            <Box h="136px" padding="8px">
              {player1?.collection && (
                <CollectionArea cards={player1.collection}></CollectionArea>
              )}
            </Box>
          </HStack>
          <Button
            colorScheme="green"
            onClick={() =>
              act("action:reveal-player-card", {
                targetPlayerId: player1?.id,
                minMax: "max",
              })
            }
          >
            最大
          </Button>
        </HStack>
      </VStack>
    </Center>
  );
}
