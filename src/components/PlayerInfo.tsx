"use client";

import React from "react";
import { Avatar, Box, Heading, HStack, Text } from "@chakra-ui/react";
import { Player } from "@/types";

const PlayerInfo = ({
  seatNumber,
  player,
}: {
  seatNumber: number;
  player: Player | undefined;
}) => {
  return (
    <HStack width="200px" gap="4">
      <Avatar
        bg={player?.isPlaying ? "green.500" : "gray.500"}
        src={player?.isWinner ? "/img/player/winner.png" : ""}
      />
      <Box>
        <Heading color="white" size="sm">
          玩家 {seatNumber} {player?.isPlaying && " - 正在操作"}{" "}
          {player?.isWinner && " - 获胜者"}
        </Heading>
        <Text color="white">{player ? player.name : "等待加入..."} </Text>
      </Box>
    </HStack>
  );
};

export default PlayerInfo;
