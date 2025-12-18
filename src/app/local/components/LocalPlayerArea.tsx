"use client";

import React, { useEffect } from "react";
import { Box, VStack, HStack, Button, Center, Text } from "@chakra-ui/react";
import { Player } from "@/types";
import { useGameSound } from "@/lib/use-game-sound";
import NanaCard from "@/components/NanaCard";
import CollectionArea from "@/components/CollectionArea";
import PlayerInfo from "@/components/PlayerInfo";

interface LocalPlayerAreaProps {
  player: Player;
  isMe?: boolean;
  onRevealCard: (playerId: string, minMax: "min" | "max") => void;
  isMyTurn: boolean;
  compact?: boolean;
}

const LocalPlayerArea = ({
  player,
  isMe = false,
  onRevealCard,
  isMyTurn,
  compact = false,
}: LocalPlayerAreaProps) => {
  const { playWoosh, playSuccess } = useGameSound();
  const revealedCount = player?.hand?.filter((card) => card.isRevealed).length || 0;
  const collectionCount = player?.collection?.length || 0;

  useEffect(() => {
    if (revealedCount > 0) {
      playWoosh();
    }
  }, [revealedCount]);

  useEffect(() => {
    if (collectionCount > 0) {
      playSuccess();
    }
  }, [collectionCount]);

  if (!player) {
    return null;
  }

  const cardWidth = compact ? "70px" : "90px";
  const cardHeight = compact ? "93px" : "120px";
  const buttonHeight = compact ? "70px" : "90px";

  return (
    <VStack
      w={compact ? "auto" : "100%"}
      minW={compact ? "280px" : "auto"}
      maxW={compact ? "350px" : "100%"}
      bg="blackAlpha.300"
      p="8px"
      borderRadius="12px"
      border={player.isPlaying ? "2px solid" : "none"}
      borderColor={player.isPlaying ? "green.400" : "transparent"}
    >
      {/* Player info and collection */}
      <HStack w="100%" justify="space-between" px="4px">
        <PlayerInfo seatNumber={player.seat} player={player} />
        <CollectionArea cards={player.collection || []} />
      </HStack>

      {/* Hand area with min/max buttons */}
      {player.hand && player.hand.length > 0 && (
        <HStack w="100%" justify="center" spacing="4px">
          <Button
            colorScheme="gray"
            size="sm"
            h={buttonHeight}
            w="32px"
            sx={{ writingMode: "vertical-rl" }}
            onClick={() => onRevealCard(player.id, "min")}
            isDisabled={!isMyTurn}
            opacity={isMyTurn ? 1 : 0.6}
          >
            选最小
          </Button>

          <HStack
            flex={1}
            h={compact ? "100px" : "136px"}
            p="8px"
            justify="center"
            overflow="hidden"
          >
            {player.hand.map((card) => (
              <Box
                key={card.id}
                position="relative"
                h="100%"
                w="100%"
                maxW={cardWidth}
              >
                <NanaCard
                  sx={{
                    position: "absolute",
                    top: isMe && card.isRevealed ? "-24px" : "0",
                  }}
                  onClick={() => {}}
                  cardId={card.id}
                  isRevealed={isMe ? true : card.isRevealed}
                  w={cardWidth}
                  h={cardHeight}
                />
              </Box>
            ))}
          </HStack>

          <Button
            colorScheme="gray"
            size="sm"
            h={buttonHeight}
            w="32px"
            sx={{ writingMode: "vertical-rl" }}
            onClick={() => onRevealCard(player.id, "max")}
            isDisabled={!isMyTurn}
            opacity={isMyTurn ? 1 : 0.6}
          >
            选最大
          </Button>
        </HStack>
      )}

      {/* Show message if no cards */}
      {(!player.hand || player.hand.length === 0) && (
        <Center h="100px">
          <Text color="gray.400">无手牌</Text>
        </Center>
      )}
    </VStack>
  );
};

export default LocalPlayerArea;

