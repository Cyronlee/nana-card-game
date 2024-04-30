"use client";

import React, { useEffect } from "react";
import {
  Button,
  Center,
  Text,
  VStack,
  Box,
  HStack,
  Tag,
  Icon,
} from "@chakra-ui/react";
import { useLocalStorageState } from "ahooks";
import { ActionPrefix, LocalPlayerInfo, Message, ServerState } from "@/types";
import PlayerArea from "@/components/PlayerArea";
import CardDeck from "@/components/CardDeck";
import PublicArea from "@/components/PublicArea";
import { calculateDisplayPlayerIndices } from "@/lib/game-helper";
import { useGameToast } from "@/lib/use-game-toast";
import Confetti from "react-confetti";
import { useWindowSize } from "react-use";
import ChatArea from "@/components/ChatArea";
import { RiFullscreenFill } from "react-icons/ri";

export default function GameMain({
  serverState,
  act,
}: {
  serverState: ServerState;
  act: (action: ActionPrefix, data?: any) => void;
}) {
  const { width, height } = useWindowSize();
  let { toastError, toastInfo, toastOk } = useGameToast();

  const [playerInfo] = useLocalStorageState<LocalPlayerInfo>("player-info");
  const displayPlayerIndices = calculateDisplayPlayerIndices(
    playerInfo?.id,
    serverState.players,
  );
  const myPlayer = serverState.players.find((p) => p.id === playerInfo?.id);

  // const toast = useToast();

  useEffect(() => {
    if (myPlayer?.isPlaying) {
      toastOk("我的回合");
    }
  }, [myPlayer?.isPlaying]);

  useEffect(() => {
    if (serverState?.gameStage === "stage:game-over") {
      toastOk("游戏结束");
    }
  }, [serverState?.gameStage]);

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
        <HStack>
          <Text color="white">游戏ID:</Text>
          <Tag
            colorScheme="gray"
            cursor="pointer"
            onClick={() => {
              const joinUrl = `${window.location.origin}?join=${serverState.gameId}`;
              navigator.clipboard.writeText(joinUrl);
              toastInfo("邀请链接已拷贝到剪贴板");
            }}
          >
            {serverState.gameId}
          </Tag>
        </HStack>
        <Button
          colorScheme="blue"
          onClick={() => act("action:start-game")}
          // isDisabled={gameStage !== "seat"}
        >
          开始游戏
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
          <Text color="white">公共区</Text>
          {serverState?.cardDeck && serverState.cardDeck.length > 0 && (
            <VStack>
              <CardDeck cards={serverState.cardDeck}></CardDeck>
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

      <Box sx={{ position: "fixed", bottom: 2, left: 2 }}>
        {/*<Text color="white">*/}
        {/*  服务器状态: {serverState.gameStage} - {serverState.gameSubStage} -{" "}*/}
        {/*  {serverState.timestamp}*/}
        {/*</Text>*/}
        <ChatArea messages={serverState.messages} act={act}></ChatArea>
      </Box>

      <Confetti
        width={width}
        height={height}
        recycle={false}
        run={serverState?.gameStage === "stage:game-over"}
        // onConfettiComplete={() => setRoundStage("")}
      />
    </Center>
  );
}
