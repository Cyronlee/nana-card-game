"use client";

import {
  Button,
  Card,
  CardBody,
  CardFooter,
  Divider,
  Heading,
  Input,
  InputGroup,
  InputLeftAddon,
  VStack,
} from "@chakra-ui/react";
import React, { useState } from "react";
import { useLocalStorageState } from "ahooks";
import { randomString } from "@/lib/random";
// import { useLocalStorage } from "react-use";
import { useRouter } from "next/navigation";
import { LocalPlayerInfo } from "@/types";

const GamePage = () => {
  const router = useRouter();

  const [playerInfo, setPlayerInfo] = useLocalStorageState<LocalPlayerInfo>(
    "player-info",
    {
      defaultValue: {
        id: randomString(6),
        name: "Your Name",
      },
    },
  );

  const [joinRoomId, setJoinRoomId] = useState("");

  const hostRoom = async () => {
    let newGameId = randomString(6);
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
      router.push(`/game/${newGameId}`);
    }
  };

  const joinRoom = async () => {
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
      router.push(`/game/${joinRoomId}`);
    }
  };

  return (
    <VStack>
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
            Create
          </Button>
        </CardFooter>
      </Card>
      <Card w="sm">
        <CardBody>
          <VStack spacing="24px" alignItems="start">
            <Heading size="md">Join Game</Heading>
            <InputGroup>
              <InputLeftAddon>Game ID</InputLeftAddon>
              <Input
                placeholder="Game ID"
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
            Join
          </Button>
        </CardFooter>
      </Card>
    </VStack>
  );
};

export default GamePage;
