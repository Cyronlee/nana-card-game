"use client";
import { Box, useToast } from "@chakra-ui/react";
import React from "react";
import { useRequest } from "ahooks";
import GameMain from "@/components/GameMain";
import { ActionPrefix, ServerState } from "@/types";
import { useRouter } from "next/navigation";
import GameRuleButton from "@/components/GameRuleButton";
import FullScreenButton from "@/components/FullScreenButton";
import VolumeButton from "@/components/VolumeButton";
import { useGameSettingsStore } from "@/store/setting-store";

const GameRoomPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const toast = useToast();

  const { playerId, playerName } = useGameSettingsStore();

  const gameStateFetcher = async (): Promise<ServerState> => {
    const res = await fetch(
      `/api/game-state?id=${params.id}&playerId=${playerId}`,
      {
        cache: "no-cache",
      },
    );
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error);
    }
    return res.json();
  };

  const {
    data: serverState,
    // refresh: refreshServerState,
    mutate: mutateServerState,
  } = useRequest(gameStateFetcher, {
    pollingInterval: 1000,
    onError: (error) => {
      toast({
        title: "房间读取失败",
        description: error.message,
        status: "error",
        duration: 6000,
        isClosable: true,
        position: "top-right",
      });
      router.push("/");
    },
  });

  const actionExecutor = async (
    actionType: ActionPrefix,
    data?: any,
  ): Promise<ServerState> => {
    if (actLoading) {
      console.log("Action is currently loading, skipping fetch.");
      return Promise.reject("Action is currently loading.");
    }
    const res = await fetch("/api/action", {
      method: "POST",
      body: JSON.stringify({
        gameId: params.id,
        playerId: playerId,
        action: actionType,
        data: data,
      }),
    });
    if (!res.ok) {
      const error = await res.json();
      throw new Error(error.error);
    }
    return res.json();
  };

  const { run: act, loading: actLoading } = useRequest(actionExecutor, {
    manual: true,
    onSuccess: (result, params) => {
      mutateServerState(result);
      toast({
        title: `操作成功`,
        // description: `${JSON.stringify(params)}`,
        status: "success",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    },
    onError: (error) => {
      toast({
        title: `操作失败`,
        description: error.message,
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top-right",
      });
    },
  });

  return (
    <>
      {serverState && <GameMain serverState={serverState} act={act} />}

      <Box
        sx={{
          position: "fixed",
          top: "16px",
          left: "16px",
          display: "flex",
          flexDirection: "column",
          gap: "8px",
        }}
      >
        <FullScreenButton />
        <VolumeButton />
        <GameRuleButton />
      </Box>
    </>
  );
};

export default GameRoomPage;
