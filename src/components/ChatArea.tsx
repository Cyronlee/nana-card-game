import React, { useState } from "react";
import {
  InputGroup,
  InputRightElement,
  Input,
  Button,
  Box,
  Text,
} from "@chakra-ui/react";
import { ActionPrefix, Message } from "@/types";
import { SystemStyleObject } from "@chakra-ui/styled-system";
import { motion, useSpring } from "framer-motion";

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
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);

  return (
    <Box
      w="320px"
      padding="4px"
      border="1px solid white"
      borderRadius="8px"
      sx={{ ...sx }}
      position="relative"
      bgColor="gray.700"
    >
      <button
        style={{
          position: "absolute",
          top: "4px",
          right: "4px",
        }}
        onClick={() => setIsCollapsed((prev) => !prev)}
      >
        {isCollapsed ? "🔼" : "🔽"}
      </button>
      <Box h={isCollapsed ? "24px" : "96px"} overflow="scroll">
        {messages.map((m: Message) => (
          <Text
            color="white"
            key={m.timestamp}
          >{`[${toHHSS(m.timestamp)}] ${m.playerName}: ${m.content}`}</Text>
        ))}
      </Box>
      {!isCollapsed && (
        <InputGroup size="sm">
          <Input
            value={message}
            onChange={(e: any) => setMessage(e.target.value)}
            color="white"
          />
          <InputRightElement>
            <button
              onClick={() => {
                act("action:chat", { message: message });
                setMessage("");
              }}
            >
              🆗
            </button>
          </InputRightElement>
        </InputGroup>
      )}
    </Box>
  );
};

export default ChatArea;
