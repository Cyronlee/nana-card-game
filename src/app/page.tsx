"use client";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Heading,
  Text,
  Input,
  Center,
  InputGroup,
  InputLeftAddon,
  VStack,
  IconButton,
  useToast,
} from "@chakra-ui/react";
import React, { Suspense, useEffect, useLayoutEffect, useState } from "react";
import { useLocalStorageState } from "ahooks";
import { randomString } from "@/lib/random";
import { BsGithub } from "react-icons/bs";
import { useRouter, useSearchParams } from "next/navigation";
import { LocalPlayerInfo } from "@/types";
import GameRuleButton from "@/components/GameRuleButton";

const GamePage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const joinParam = searchParams.get("join");

  const toast = useToast();

  const [playerInfo, setPlayerInfo] = useLocalStorageState<LocalPlayerInfo>(
    "player-info",
    {
      defaultValue: {
        id: randomString(4),
        name: "",
      },
    },
  );

  const [joinRoomId, setJoinRoomId] = useState("");

  useLayoutEffect(() => {
    if (joinParam) setJoinRoomId(joinParam);
  }, [joinParam]);

  const hostRoom = async () => {
    if (!playerInfo?.name) {
      toast({
        title: `请输入玩家名称`,
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    let newGameId = randomString(4);
    const res = await fetch("/api/action", {
      method: "POST",
      body: JSON.stringify({
        gameId: newGameId,
        playerId: playerInfo?.id,
        action: "action:host",
        data: {
          playerId: playerInfo?.id,
          playerName: playerInfo?.name,
        },
      }),
    });
    if (res.ok) {
      router.push(`/${newGameId}`);
    } else {
      toast({
        title: `服务器错误`,
        description:
          "Vercel KV max daily request limit exceeded. Limit: 10000, Usage: 10000.",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
    }
  };

  const joinRoom = async () => {
    if (!playerInfo?.name) {
      toast({
        title: `请输入玩家名称`,
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
      return;
    }
    const res = await fetch("/api/action", {
      method: "POST",
      body: JSON.stringify({
        action: "action:join",
        gameId: joinRoomId,
        playerId: playerInfo?.id,
        data: {
          playerId: playerInfo?.id,
          playerName: playerInfo?.name,
        },
      }),
    });
    if (res.ok) {
      router.push(`/${joinRoomId}`);
    } else {
      toast({
        title: `服务器错误`,
        description:
          "Vercel KV max daily request limit exceeded. Limit: 10000, Usage: 10000.",
        status: "error",
        duration: 2000,
        isClosable: true,
        position: "top",
      });
    }
  };

  return (
    <Center w="100vw" h="100vh" bgColor="gray.700">
      <VStack gap="12px">
        <VStack>
          <Text
            bgGradient="linear(to-r, gray.300, yellow.400, pink.200)"
            bgClip="text"
            fontSize="6xl"
            fontWeight="extrabold"
          >
            NANA Card Game{" "}
            <IconButton
              variant="outline"
              color="white"
              colorScheme="none"
              aria-label="Mute"
              size="sm"
              fontSize="20px"
              onClick={() =>
                window.open("https://github.com/Cyronlee/nana-card-game")
              }
              icon={<BsGithub />}
            />
          </Text>
          <Text
            bgGradient="linear(to-r, gray.300, yellow.400, pink.200)"
            bgClip="text"
            fontSize="lg"
            fontWeight="extrabold"
          >
            2 ~ 6 Players Online <GameRuleButton />
          </Text>
        </VStack>
        {!joinParam && (
          <Card w="sm">
            <CardBody>
              <VStack spacing="24px" alignItems="start">
                <Heading size="md">Create Game</Heading>
                {/*<Heading size="md">*/}
                {/*  {playerInfo.id} {playerInfo.name}*/}
                {/*</Heading>*/}
                <InputGroup>
                  <InputLeftAddon>Your Name</InputLeftAddon>
                  <Input
                    value={playerInfo?.name}
                    onChange={(e) =>
                      // @ts-ignore
                      setPlayerInfo((prev) => ({
                        ...prev,
                        name: e.target.value,
                      }))
                    }
                    placeholder="Your Name"
                  />
                </InputGroup>
              </VStack>
            </CardBody>
            <Divider sx={{ borderColor: "gray.300" }} />
            <CardFooter justifyContent="flex-end">
              <Button
                size="sm"
                variant="solid"
                colorScheme="blue"
                onClick={() => hostRoom()}
              >
                Create Game
              </Button>
            </CardFooter>
          </Card>
        )}
        <Card w="sm">
          <CardBody>
            <VStack spacing="24px" alignItems="start">
              <Heading size="md">Join Game</Heading>
              <InputGroup>
                <InputLeftAddon>Game ID</InputLeftAddon>
                <Input
                  placeholder="Game ID"
                  value={joinRoomId}
                  onChange={(e) => setJoinRoomId(e.target.value)}
                />
              </InputGroup>
              <InputGroup>
                <InputLeftAddon>Your Name</InputLeftAddon>
                <Input
                  value={playerInfo?.name}
                  onChange={(e) =>
                    // @ts-ignore
                    setPlayerInfo((prev) => ({
                      ...prev,
                      name: e.target.value,
                    }))
                  }
                  placeholder="Your Name"
                />
              </InputGroup>
            </VStack>
          </CardBody>
          <Divider sx={{ borderColor: "gray.300" }} />
          <CardFooter justifyContent="flex-end">
            <Button
              size="sm"
              variant="solid"
              colorScheme="blue"
              onClick={() => joinRoom()}
            >
              Join Game Room
            </Button>
          </CardFooter>
        </Card>
      </VStack>
    </Center>
  );
};

export default GamePage;
