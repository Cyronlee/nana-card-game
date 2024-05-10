"use client";

import React, { useState } from "react";
import {
  InputGroup,
  InputRightElement,
  Input,
  Button,
  Box,
  Text,
  Icon,
} from "@chakra-ui/react";
import { ActionPrefix, Message } from "@/types";
import { SystemStyleObject } from "@chakra-ui/styled-system";
import { motion, useAnimate, useSpring } from "framer-motion";
import {
  RiSendPlaneFill,
  RiArrowDownSFill,
  RiArrowUpSFill,
} from "react-icons/ri";

const toHHSS = (timestamp: number) => {
  return new Date(timestamp).toLocaleTimeString("en-US", {
    hour12: false,
    hour: "2-digit",
    minute: "2-digit",
  });
};

const ChatArea = ({
  sx,
  messages,
  act,
}: {
  sx?: SystemStyleObject;
  messages: Message[];
  act: (action: ActionPrefix, data?: any) => void;
}) => {
  const [message, setMessage] = useState<string>("");
  const [isCollapsed, setIsCollapsed] = useState<boolean>(true);
  const [animateRef, animate] = useAnimate();

  const onClick = () => {
    animate(animateRef.current, { y: isCollapsed ? 128 : 24 });
    setIsCollapsed((prev) => !prev);
  };

  const sendMessage = () => {
    if (message && message !== "") {
      act("action:chat", { message: message });
      setMessage("");
    }
  };

  return (
    <motion.div initial={{ y: 24 }} ref={animateRef}>
      <Box
        w="320px"
        padding="4px"
        border="1px solid white"
        borderRadius="8px"
        sx={{ ...sx }}
        position="relative"
        bgColor="gray.700"
        paddingBottom="24px"
      >
        <button
          style={{
            position: "absolute",
            top: "4px",
            right: "4px",
            width: "120px",
            display: "flex",
            justifyContent: "flex-end",
          }}
          onClick={() => onClick()}
        >
          <Icon
            w="24px"
            h="24px"
            color="white"
            as={isCollapsed ? RiArrowDownSFill : RiArrowUpSFill}
          />
        </button>
        <Box h={"96px"} overflow="scroll">
          {messages.map((m: Message) => (
            <Text
              color="white"
              key={m.timestamp}
            >{`[${toHHSS(m.timestamp)}] ${m.playerName}: ${m.content}`}</Text>
          ))}
        </Box>
        <InputGroup size="sm">
          <Input
            value={message}
            onChange={(e: any) => setMessage(e.target.value)}
            color="white"
            placeholder="send message"
            onKeyDown={(e: any) => {
              if (e.key === "Enter") {
                sendMessage();
              }
            }}
            enterKeyHint="send"
          />
          <InputRightElement>
            <button onClick={sendMessage}>
              <Icon w="16px" h="16px" color="white" as={RiSendPlaneFill} />
            </button>
          </InputRightElement>
        </InputGroup>
      </Box>
    </motion.div>
  );
};

export default ChatArea;
