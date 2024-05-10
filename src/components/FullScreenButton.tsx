"use client";

import React from "react";
import { RiFullscreenFill } from "react-icons/ri";
import { IconButton } from "@chakra-ui/react";

const FullScreenButton = () => {
  return (
    <IconButton
      variant="outline"
      color="white"
      colorScheme="none"
      aria-label="Fullscreen"
      size="sm"
      fontSize="20px"
      onClick={() => {
        if (document.fullscreenElement) {
          document.exitFullscreen();
        } else {
          document.body.requestFullscreen();
        }
      }}
      icon={<RiFullscreenFill />}
    />
  );
};

export default FullScreenButton;
