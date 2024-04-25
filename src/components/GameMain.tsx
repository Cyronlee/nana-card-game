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
  Flex,
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
import PlayerArea from "@/components/PlayerArea";
import CardDeck from "@/components/CardDeck";
import PublicArea from "@/components/PublicArea";
import { calculateDisplayPlayerIndices } from "@/lib/game-helper";

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
  // const { width, height } = useWindowSize();

  const [playerInfo] = useLocalStorageState<LocalPlayerInfo>("player-info");

  // const toast = useToast();

  const displayPlayerIndices = calculateDisplayPlayerIndices(
    playerInfo?.id,
    serverState.players,
  );

  return (
    <Center
      w="100vw"
      h="100vh"
      bgColor="gray.700"
      sx={{
        position: "relative",
      }}
      justifyContent="space-evenly"
    >
      <VStack sx={{ position: "fixed", top: "16px", right: "16px" }}>
        <Button
          colorScheme="blue"
          onClick={() => act("action:start-game")}
          // isDisabled={gameStage !== "seat"}
        >
          开始游戏
        </Button>
        <Button
          colorScheme="blue"
          onClick={() => act("action:restart-game")}
          // isDisabled={gameStage !== "seat"}
        >
          重新开始
        </Button>
      </VStack>

      <VStack h="100vh" flex={3} gap="16px" justifyContent="center">
        <PlayerArea
          player={serverState.players[displayPlayerIndices[2]]}
          act={act}
        ></PlayerArea>
        <PlayerArea
          player={serverState.players[displayPlayerIndices[1]]}
          act={act}
        ></PlayerArea>
      </VStack>

      <VStack flex={4} h="100vh" justifyContent="center">
        <PlayerArea
          player={serverState.players[displayPlayerIndices[3]]}
          act={act}
        ></PlayerArea>

        <VStack
          // w="576px"
          w="100%"
          h="400px"
          padding="24px"
          bgColor="gray.700"
          borderRadius="16px"
          justifyContent="center"
        >
          <Text color="white">
            游戏ID: {serverState.gameId} 服务器状态: {serverState.gameStage} -{" "}
            {serverState.gameSubStage} - {serverState.timestamp}
          </Text>
          {/*<Text color="white">公共区</Text>*/}
          {serverState?.cardDeck && serverState.cardDeck.length > 0 && (
            <VStack>
              <CardDeck cards={serverState.cardDeck}></CardDeck>
              <Button
                colorScheme="blue"
                onClick={() => act("action:start-game")}
                // isDisabled={gameStage !== "seat"}
              >
                开始游戏
              </Button>
            </VStack>
          )}

          {serverState?.publicCards && (
            <PublicArea cards={serverState?.publicCards} act={act}></PublicArea>
          )}
        </VStack>

        <PlayerArea
          isMe={true}
          player={serverState.players[displayPlayerIndices[0]]}
          act={act}
        ></PlayerArea>
      </VStack>

      <VStack flex={3} h="100vh" gap="16px" justifyContent="center">
        <PlayerArea
          player={serverState.players[displayPlayerIndices[4]]}
          act={act}
        ></PlayerArea>
        <PlayerArea
          player={serverState.players[displayPlayerIndices[5]]}
          act={act}
        ></PlayerArea>
      </VStack>
    </Center>
  );
}
