import React from "react";
import { Center } from "@chakra-ui/react";
import PokerCard from "@/components/PokerCard";

const Page = () => {
  return (
    <Center w="100vw" h="100vh" bgColor="gray">
      <PokerCard w="91px" h="128px"></PokerCard>
    </Center>
  );
};

export default Page;
