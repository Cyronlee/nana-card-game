"use client";

import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  Center,
  HStack,
  VStack,
  Text,
  Heading,
  Select,
  Card,
  CardBody,
  CardFooter,
  Divider,
  IconButton,
} from "@chakra-ui/react";
import { useWindowSize } from "react-use";
import Confetti from "react-confetti";
import { useRouter } from "next/navigation";
import { BsArrowLeft } from "react-icons/bs";

import { useLocalGameStore } from "@/store/local-game-store";
import { useGameSound } from "@/lib/use-game-sound";
import { useGameToast } from "@/lib/use-game-toast";
import { useTranslation } from "@/i18n/index";
import BigToast from "@/components/BigToast";
import LocalPlayerArea from "@/app/local/components/LocalPlayerArea";
import LocalPublicArea from "@/app/local/components/LocalPublicArea";
import CardDeck from "@/components/CardDeck";
import GameRuleButton from "@/components/GameRuleButton";

// Configuration screen
function ConfigScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { botCount, setBotCount, startGame } = useLocalGameStore();

  const getBotInfo = (count: number) => {
    const totalPlayers = count + 1;
    switch (totalPlayers) {
      case 2:
        return { numbers: "1-10", handCards: 10, publicCards: 10 };
      case 3:
        return { numbers: "1-11", handCards: 8, publicCards: 9 };
      case 4:
        return { numbers: "1-12", handCards: 7, publicCards: 8 };
      case 5:
        return { numbers: "1-12", handCards: 6, publicCards: 6 };
      case 6:
        return { numbers: "1-12", handCards: 5, publicCards: 6 };
      default:
        return { numbers: "1-12", handCards: 7, publicCards: 8 };
    }
  };

  const info = getBotInfo(botCount);

  return (
    <Center w="100vw" h="100vh" bgColor="gray.700">
      <VStack gap="16px">
        <VStack>
          <Text
            bgGradient="linear(to-r, gray.300, yellow.400, pink.200)"
            bgClip="text"
            fontSize="5xl"
            fontWeight="extrabold"
          >
            {t("SINGLE_PLAYER_MODE")}
          </Text>
          <Text color="gray.300" fontSize="lg">
            {t("PLAY_AGAINST_BOTS")} <GameRuleButton />
          </Text>
        </VStack>

        <Card w="sm" bg="gray.800" color="white">
          <CardBody>
            <VStack spacing="24px" alignItems="start">
              <Heading size="md">{t("GAME_SETTINGS")}</Heading>

              <VStack w="100%" alignItems="start" spacing="12px">
                <Text>{t("SELECT_BOT_COUNT")}:</Text>
                <Select
                  value={botCount}
                  onChange={(e) => setBotCount(parseInt(e.target.value))}
                  bg="gray.700"
                  borderColor="gray.600"
                >
                  <option value={1}>{t("BOT_COUNT_1")}</option>
                  <option value={2}>{t("BOT_COUNT_2")}</option>
                  <option value={3}>{t("BOT_COUNT_3")}</option>
                  <option value={4}>{t("BOT_COUNT_4")}</option>
                  <option value={5}>{t("BOT_COUNT_5")}</option>
                </Select>
              </VStack>

              <VStack
                w="100%"
                p="12px"
                bg="gray.700"
                borderRadius="8px"
                alignItems="start"
                spacing="8px"
              >
                <Text fontWeight="bold">{t("GAME_CONFIG")}:</Text>
                <HStack justify="space-between" w="100%">
                  <Text color="gray.400">{t("NUMBERS_USED")}:</Text>
                  <Text>{info.numbers}</Text>
                </HStack>
                <HStack justify="space-between" w="100%">
                  <Text color="gray.400">{t("HAND_CARDS")}:</Text>
                  <Text>
                    {info.handCards} {t("CARDS_UNIT")}
                  </Text>
                </HStack>
                <HStack justify="space-between" w="100%">
                  <Text color="gray.400">{t("PUBLIC_CARDS")}:</Text>
                  <Text>
                    {info.publicCards} {t("CARDS_UNIT")}
                  </Text>
                </HStack>
              </VStack>
            </VStack>
          </CardBody>
          <Divider borderColor="gray.600" />
          <CardFooter justifyContent="space-between">
            <Button
              size="sm"
              variant="ghost"
              colorScheme="gray"
              leftIcon={<BsArrowLeft />}
              onClick={() => router.push("/")}
            >
              {t("BACK")}
            </Button>
            <Button size="sm" colorScheme="green" onClick={startGame}>
              {t("START_GAME")}
            </Button>
          </CardFooter>
        </Card>
      </VStack>
    </Center>
  );
}

// Main game screen
function GameScreen() {
  const { width, height } = useWindowSize();
  const { t } = useTranslation();
  const {
    gameStage,
    turnPhase,
    players,
    publicCards,
    cardDeck,
    currentPlayerIndex,
    winner,
    turnMessage,
    resetGame,
    revealPlayerCard,
    revealPublicCard,
    isCurrentPlayerBot,
    getMyPlayer,
    getCurrentPlayer,
    executeBotTurn,
  } = useLocalGameStore();

  const { playWoosh, playWin, playSuccess, playDingDong } = useGameSound();
  const { toastInfo, toastError, toastOk } = useGameToast();
  const router = useRouter();

  const [bigToastMessage, setBigToastMessage] = useState<string | undefined>();

  const currentPlayer = getCurrentPlayer();
  const myPlayer = getMyPlayer();
  const isMyTurn = currentPlayer?.id === "me";
  const gameBgColor = isMyTurn ? "green.700" : "gray.700";

  // Sound and toast effects
  useEffect(() => {
    if (turnMessage) {
      setBigToastMessage(turnMessage);
      if (isMyTurn) {
        playDingDong();
      }
    }
  }, [turnMessage, currentPlayerIndex]);

  useEffect(() => {
    if (gameStage === "game-over") {
      playWin();
    }
  }, [gameStage]);

  // Handle player card reveal action
  const handleRevealPlayerCard = (playerId: string, minMax: "min" | "max") => {
    if (!isMyTurn) {
      toastInfo(t("WAIT_YOUR_TURN"));
      return;
    }
    revealPlayerCard(playerId, minMax);
  };

  // Handle public card reveal action
  const handleRevealPublicCard = (cardId: string) => {
    if (!isMyTurn) {
      toastInfo(t("WAIT_YOUR_TURN"));
      return;
    }
    revealPublicCard(cardId);
  };

  // Calculate display indices for players around the table
  const getDisplayPlayers = () => {
    const myIndex = players.findIndex((p) => p.id === "me");
    if (myIndex === -1) return { me: undefined, others: [] };

    const me = players[myIndex];
    const others = [
      ...players.slice(myIndex + 1),
      ...players.slice(0, myIndex),
    ];

    return { me, others };
  };

  const { me, others } = getDisplayPlayers();

  // Layout based on number of bot players
  const renderOtherPlayers = () => {
    if (others.length === 0) return null;

    if (others.length === 1) {
      // 2 player game - opponent on top
      return (
        <LocalPlayerArea
          player={others[0]}
          onRevealCard={handleRevealPlayerCard}
          isMyTurn={isMyTurn}
        />
      );
    }

    if (others.length === 2) {
      // 3 player game - two opponents
      return (
        <HStack w="100%" justify="space-around">
          <LocalPlayerArea
            player={others[0]}
            onRevealCard={handleRevealPlayerCard}
            isMyTurn={isMyTurn}
          />
          <LocalPlayerArea
            player={others[1]}
            onRevealCard={handleRevealPlayerCard}
            isMyTurn={isMyTurn}
          />
        </HStack>
      );
    }

    if (others.length <= 3) {
      // 4 player game
      return (
        <HStack w="100%" justify="space-around">
          {others.map((player) => (
            <LocalPlayerArea
              key={player.id}
              player={player}
              onRevealCard={handleRevealPlayerCard}
              isMyTurn={isMyTurn}
            />
          ))}
        </HStack>
      );
    }

    // 5-6 player game - two rows
    const topRow = others.slice(0, Math.ceil(others.length / 2));
    const bottomRow = others.slice(Math.ceil(others.length / 2));

    return (
      <VStack w="100%" spacing="8px">
        <HStack w="100%" justify="space-around">
          {topRow.map((player) => (
            <LocalPlayerArea
              key={player.id}
              player={player}
              onRevealCard={handleRevealPlayerCard}
              isMyTurn={isMyTurn}
              compact
            />
          ))}
        </HStack>
        <HStack w="100%" justify="space-around">
          {bottomRow.map((player) => (
            <LocalPlayerArea
              key={player.id}
              player={player}
              onRevealCard={handleRevealPlayerCard}
              isMyTurn={isMyTurn}
              compact
            />
          ))}
        </HStack>
      </VStack>
    );
  };

  return (
    <Center
      w="100vw"
      h="100vh"
      bgColor={gameBgColor}
      position="relative"
      overflow="hidden"
    >
      {/* Top right controls */}
      <VStack position="fixed" top="16px" right="16px" zIndex={10}>
        <HStack>
          <Text color="white" fontSize="sm">
            {turnPhase === "flip-1" && t("FLIP_CARD_1")}
            {turnPhase === "flip-2" && t("FLIP_CARD_2")}
            {turnPhase === "flip-3" && t("FLIP_CARD_3")}
            {turnPhase === "success" && t("CHALLENGE_SUCCESS")}
            {turnPhase === "failed" && t("CHALLENGE_FAILED")}
          </Text>
        </HStack>
        <Button size="sm" colorScheme="gray" onClick={resetGame}>
          {t("RESTART")}
        </Button>
        <Button
          size="sm"
          variant="ghost"
          colorScheme="gray"
          color="white"
          onClick={() => {
            resetGame();
            router.push("/");
          }}
        >
          {t("BACK_HOME")}
        </Button>
      </VStack>

      {/* Main game layout */}
      <VStack
        w="100%"
        maxW="1200px"
        h="100vh"
        p="16px"
        spacing="16px"
        justify="space-between"
      >
        {/* Other players area */}
        <Box w="100%" minH="200px">
          {renderOtherPlayers()}
        </Box>

        {/* Public area */}
        <VStack
          w="100%"
          flex={1}
          p="16px"
          bgColor="blackAlpha.300"
          borderRadius="16px"
          justify="center"
        >
          <Text color="white" fontWeight="bold">
            {t("PUBLIC_AREA")}
          </Text>
          {cardDeck && cardDeck.length > 0 && <CardDeck cards={cardDeck} />}
          {publicCards && (
            <LocalPublicArea
              cards={publicCards}
              onRevealCard={handleRevealPublicCard}
              isMyTurn={isMyTurn}
            />
          )}
        </VStack>

        {/* My player area */}
        {me && (
          <LocalPlayerArea
            player={me}
            isMe={true}
            onRevealCard={handleRevealPlayerCard}
            isMyTurn={isMyTurn}
          />
        )}
      </VStack>

      {/* Confetti for win */}
      <Confetti
        width={width}
        height={height}
        recycle={false}
        run={gameStage === "game-over"}
      />

      {/* Big toast message */}
      <BigToast message={bigToastMessage} />
    </Center>
  );
}

// Main component
export default function LocalGamePage() {
  const { gameStage } = useLocalGameStore();

  if (gameStage === "config") {
    return <ConfigScreen />;
  }

  return <GameScreen />;
}
