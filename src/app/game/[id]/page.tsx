"use client";
import { Button, useToast } from "@chakra-ui/react";
import React, { useEffect, useState } from "react";
import { useLocalStorageState, useRequest } from "ahooks";
import { kv } from "@vercel/kv";
import GameMain from "@/components/GameMain";
import { ActionPrefix, LocalPlayerInfo } from "@/types";

const GameRoomPage = ({ params }: { params: { id: string } }) => {
  const toast = useToast();

  const [playerInfo] = useLocalStorageState<LocalPlayerInfo>("player-info");

  const gameStateFetcher = async (): Promise<any> => {
    const res = await fetch(
      `/api/game-state?id=${params.id}&playerId=${playerInfo?.id}`,
      {
        cache: "no-cache",
      },
    );
    return res.json();
  };

  const { data, run, cancel } = useRequest(gameStateFetcher, {
    pollingInterval: 2000,
  });

  const act = async (actionType: ActionPrefix, data?: any) => {
    const res = await fetch("/api/action", {
      method: "POST",
      body: JSON.stringify({
        gameId: params.id,
        playerId: playerInfo?.id,
        action: actionType,
        data: data,
      }),
    });
    if (res.ok) {
      run();
      toast({
        title: `${actionType} 执行成功`,
        description: `action: ${actionType}, data: ${JSON.stringify(data)}`,
        status: "success",
        duration: 2000,
        isClosable: true,
      });
    } else {
      const error = await res.json();
      toast({
        title: `${actionType} 执行失败`,
        description: error.error,
        status: "error",
        duration: 2000,
        isClosable: true,
      });
    }
  };

  return <>{data && <GameMain serverState={data} act={act} />}</>;
};

export default GameRoomPage;
