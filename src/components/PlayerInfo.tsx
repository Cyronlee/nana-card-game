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
    <HStack flex="1" gap="4" alignItems="center" flexWrap="wrap">
      <Avatar bg="teal.500" />
      <Box>
        <Heading color="white" size="sm">
          Player {seatNumber}
        </Heading>
        <Text color="white">
          {player ? player.name : "等待加入..."}{" "}
          {player?.isPlaying && " - playing"}
        </Text>
      </Box>
    </HStack>
  );
};

export default PlayerInfo;
