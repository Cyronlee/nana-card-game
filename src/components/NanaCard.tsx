"use client";

import React, { useEffect, useRef, useState } from "react";
import { motion, useSpring } from "framer-motion";
import { Box } from "@chakra-ui/react";

import { SystemStyleObject } from "@chakra-ui/styled-system";

const spring = {
  type: "spring",
  stiffness: 300,
  damping: 40,
};

const cardAssetMap = new Map([
  ["1", "card_1.png"],
  ["2", "card_2.png"],
  ["3", "card_3.png"],
  ["4", "card_4.png"],
  ["5", "card_5.png"],
  ["6", "card_6.png"],
  ["7", "card_7.png"],
  ["8", "card_8.png"],
  ["9", "card_9.png"],
  ["10", "card_10.png"],
  ["11", "card_11.png"],
  ["12", "card_12.png"],
]);

const NanaCardBody = ({
  number,
  variant,
}: {
  number: string;
  variant: "front" | "back";
}) => {
  let imgFileName = cardAssetMap.get(number);
  return (
    <Box
      w="100%"
      h="100%"
      // bgColor={variant === "front" ? "orange" : "cyan"}
      border="1px solid gray"
      borderRadius="10px"
      overflow="hidden"
    >
      {variant === "front" ? (
        <img
          style={{ width: "100%", height: "100%" }}
          src={`/img/nana/${imgFileName}`}
          alt="front"
        />
      ) : (
        <img
          style={{ width: "100%", height: "100%" }}
          src="/img/nana/card_back.png"
          alt="back"
        />
      )}
    </Box>
  );
};

const NanaCard = ({
  cardId,
  w,
  h,
  onClick,
  isRevealed,
  // onFlipToFront,
  // onFlipToBack,
  sx,
}: {
  cardId: string;
  w: string;
  h: string;
  sx?: SystemStyleObject;
  onClick: (cardId: string) => void;
  isRevealed: boolean;
  // onFlipToFront: any;
  // onFlipToBack: any;
}) => {
  const [rotateXaxis, setRotateXaxis] = useState(0);
  const [rotateYaxis, setRotateYaxis] = useState(0);
  const ref = useRef(null);

  const handleMouseMove = (event: any) => {
    const element = ref.current;
    // @ts-ignore
    const elementRect = element.getBoundingClientRect();
    const elementWidth = elementRect.width;
    const elementHeight = elementRect.height;
    const elementCenterX = elementWidth / 2;
    const elementCenterY = elementHeight / 2;
    const mouseX = event.clientY - elementRect.y - elementCenterY;
    const mouseY = event.clientX - elementRect.x - elementCenterX;
    const degreeX = (mouseX / elementWidth) * 20; //The number is the rotation factor
    const degreeY = (mouseY / elementHeight) * 20; //The number is the rotation factor
    setRotateXaxis(degreeX);
    setRotateYaxis(degreeY);
  };

  const handleMouseEnd = () => {
    setRotateXaxis(0);
    setRotateYaxis(0);
  };

  const dx = useSpring(0, spring);
  const dy = useSpring(0, spring);

  useEffect(() => {
    dx.set(-rotateXaxis);
    dy.set(rotateYaxis);
  }, [rotateXaxis, rotateYaxis]);

  return (
    <motion.div
      layoutId={cardId}
      onClick={() => onClick(cardId)}
      transition={spring}
      style={
        {
          perspective: "1200px",
          transformStyle: "preserve-3d",
          width: w,
          height: h,
          cursor: "pointer",
          ...sx,
        } as any
      }
    >
      <motion.div
        ref={ref}
        whileHover={{ scale: 1.1 }} //Change the scale of zooming in when hovering
        onMouseMove={handleMouseMove}
        onMouseLeave={handleMouseEnd}
        transition={spring}
        style={{
          width: "100%",
          height: "100%",
          rotateX: dx,
          rotateY: dy,
        }}
      >
        <div
          style={{
            perspective: "1200px",
            transformStyle: "preserve-3d",
            width: "100%",
            height: "100%",
          }}
        >
          <motion.div
            animate={{ rotateY: isRevealed ? -180 : 0 }}
            transition={spring}
            style={{
              width: "100%",
              height: "100%",
              zIndex: isRevealed ? 0 : 1,
              backfaceVisibility: "hidden",
              position: "absolute",
            }}
          >
            <NanaCardBody number={cardId.split("-")[0]} variant="back" />
          </motion.div>
          <motion.div
            initial={{ rotateY: 180 }}
            animate={{ rotateY: isRevealed ? 0 : 180 }}
            transition={spring}
            style={{
              width: "100%",
              height: "100%",
              zIndex: isRevealed ? 1 : 0,
              backfaceVisibility: "hidden",
              position: "absolute",
            }}
          >
            <NanaCardBody number={cardId.split("-")[0]} variant="front" />
          </motion.div>
        </div>
      </motion.div>
      {/*<span style={{ position: "absolute", bottom: 0 }}>{cardId}</span>*/}
    </motion.div>
  );
};

export default NanaCard;
