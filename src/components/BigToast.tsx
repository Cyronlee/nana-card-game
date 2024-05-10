"use client";

import React, { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Heading, Text } from "@chakra-ui/react";

const BigToast = ({ message }: { message: string | undefined }) => {
  const [isShowing, setIsShowing] = useState(true);

  useEffect(() => {
    setIsShowing(true);
    setTimeout(() => {
      setIsShowing(false);
    }, 3000);
  }, [message]);

  return (
    <AnimatePresence>
      {message && isShowing && (
        <motion.div
          style={{
            position: "fixed",
            top: "auto",
            left: "auto",
            cursor: "none",
            width: "80%",
            // top: "50%",
            // left: "50%",
            // transform: "translate(-50%, -50%)",
          }}
          initial={{ y: 1024 }}
          animate={{ y: 0 }}
          exit={{ y: -1024 }}
          transition={{ type: "spring", duration: 1 }}
        >
          <Text
            fontSize={`calc(80vw / ${message.length})`}
            fontWeight="bold"
            textAlign="center"
            color="white"
          >
            {message}
          </Text>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default BigToast;
