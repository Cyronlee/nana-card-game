"use client";
import { Button, useToast } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useLocalStorageState, useRequest } from "ahooks";
import { kv } from "@vercel/kv";
import GameMain from "@/components/GameMain";
import { ActionPrefix, LocalPlayerInfo, ServerState } from "@/types";
import { useRouter } from "next/navigation";

const GameRoomPage = ({ params }: { params: { id: string } }) => {
  const router = useRouter();
  const toast = useToast();

  const [playerInfo] = useLocalStorageState<LocalPlayerInfo>("player-info");

  const gameStateFetcher = async (): Promise<ServerState> => {
    const res = await fetch(
      `/api/game-state?id=${params.id}&playerId=${playerInfo?.id}`,
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
    pollingInterval: 2000,
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
    const res = await fetch("/api/action", {
      method: "POST",
      body: JSON.stringify({
        gameId: params.id,
        playerId: playerInfo?.id,
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
    debounceWait: 800,
    manual: true,
    onSuccess: (result, params) => {
      mutateServerState(result);
      toast({
        title: `操作成功`,
        description: `${JSON.stringify(params)}`,
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

  return <>{serverState && <GameMain serverState={serverState} act={act} />}</>;
};

export default GameRoomPage;
