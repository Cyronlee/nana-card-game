"use client";
import React, { useEffect } from "react";
import styled from "@emotion/styled";
import { AnimatePresence, LayoutGroup, motion, useCycle } from "framer-motion";
import { Box } from "@chakra-ui/react";

const Child = () => {
  return (
    <Big purple>
      <Small purple />
    </Big>
  );
};

const Sibling = () => {
  return (
    <>
      <Big />
      <Small />
    </>
  );
};

const Example = () => {
  const [isOn, toggleOn] = useCycle(false, true);

  useEffect(() => {
    setTimeout(toggleOn, 1000);
  }, [isOn, toggleOn]);

  return (
    <Container>
      {/*<LayoutGroup>*/}
      {/*<AnimatePresence>*/}
      {isOn ? <Child /> : <Sibling />}
      {/*</AnimatePresence>*/}
      {/*</LayoutGroup>*/}
    </Container>
  );
};

export default Example;

const Container = styled.div`
  width: 200px;
  height: 340px;
  overflow: visible;
  background-color: #f3f3f3;
  border-radius: 20px;
  position: relative;
`;

const Small = ({ purple }: { purple? }) => (
  <Box
    as={motion.div}
    layoutId="small"
    id="small"
    key="small"
    w="60px"
    h="60px"
    bgColor="cyan"
    overflow="visible"
    position="absolute"
    top={purple ? "30px" : "172px"}
    left={purple ? "30px" : "172px"}
  >
    Small
  </Box>
);

const Big = ({ purple, children }: { purple?; children? }) => (
  <Box
    as={motion.div}
    layoutId="big"
    id="big"
    key="big"
    w="60px"
    h="60px"
    bgColor="orange"
    overflow="visible"
    position="absolute"
    top={purple ? "137px" : "110px"}
    left={purple ? "26px" : "40px"}
    width={purple ? "120px" : "60px"}
  >
    {children}
  </Box>
);

// const Small = styled(motion.div)`
//   width: 60px;
//   height: 60px;
//   overflow: visible;
//   border-radius: 10px;
//   position: absolute;
//
//   ${({ purple }) =>
//     purple
//       ? `
//       background-color: #85f;
//       top: 30px;
//       left: 30px;
//     `
//       : `
//       background-color: #0099ff;
//       top: 172px;
//       left: 102px;
//     `}
// `;
//
// const Big = styled(motion.div)`
//   overflow: visible;
//   position: absolute;
//
//   ${({ purple }) =>
//     purple
//       ? `
//       top: 137px;
//       left: 26px;
//       width: 120px;
//       height: 120px;
//       background-color: rgba(136, 85, 255, 0.3);
//       border-radius: 20px;
//     `
//       : `
//       top: 110px;
//       left: 40px;
//       width: 60px;
//       height: 60px;
//         background-color: rgba(0, 153, 255, 0.3);
//         border-radius: 10px;
//     `}
// `;
