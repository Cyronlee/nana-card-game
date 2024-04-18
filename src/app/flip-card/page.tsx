"use client";

import type { ComponentType } from "react";
import { motion, useSpring } from "framer-motion";
import React, { useState, useRef, useEffect } from "react";
import { Box } from "@chakra-ui/react";

// Learn more: https://www.framer.com/docs/guides/overrides/

//Spring animation parameters
const spring = {
  type: "spring",
  stiffness: 300,
  damping: 40,
};

/**
 * 3D Flip
 * Created By Joshua Guo
 *
 * @framerSupportedLayoutWidth fixed
 * @framerSupportedLayoutHeight fixed
 */

const PokerCard = ({ variant, style }) => {
  return (
    <Box
      w={292}
      h={411}
      bgColor={variant === "Front" ? "orange" : "cyan"}
      style={style}
    >
      {variant === "Front" ? (
        <img src="/img/poker-front.png" alt="front" />
      ) : (
        <img src="/img/poker-back.png" alt="front" />
      )}
    </Box>
  );
};

const Page = () => {
  const [isFlipped, setIsFlipped] = useState(false);

  const handleClick = () => {
    setIsFlipped((prevState) => !prevState);
  };

  const [rotateXaxis, setRotateXaxis] = useState(0);
  const [rotateYaxis, setRotateYaxis] = useState(0);
  const ref = useRef(null);

  const handleMouseMove = (event) => {
    const element = ref.current;
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
      onClick={handleClick}
      transition={spring}
      style={{
        perspective: "1200px",
        transformStyle: "preserve-3d",
        // width: `${props.width}`,
        // height: `${props.height}`,
        width: "292px",
        height: "411px",
      }}
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
            animate={{ rotateY: isFlipped ? -180 : 0 }}
            transition={spring}
            style={{
              width: "100%",
              height: "100%",
              zIndex: isFlipped ? 0 : 1,
              backfaceVisibility: "hidden",
              position: "absolute",
            }}
          >
            <PokerCard
              variant="Front"
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          </motion.div>
          <motion.div
            initial={{ rotateY: 180 }}
            animate={{ rotateY: isFlipped ? 0 : 180 }}
            transition={spring}
            style={{
              width: "100%",
              height: "100%",
              zIndex: isFlipped ? 1 : 0,
              backfaceVisibility: "hidden",
              position: "absolute",
            }}
          >
            <PokerCard
              variant="Back"
              style={{
                width: "100%",
                height: "100%",
              }}
            />
          </motion.div>
        </div>
      </motion.div>
    </motion.div>
  );
};

export default Page;
