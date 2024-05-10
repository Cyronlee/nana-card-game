"use client";

import React from "react";
import { BsQuestionCircle } from "react-icons/bs";
import {
  IconButton,
  Modal,
  Button,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Text,
  ModalFooter,
  VStack,
  useDisclosure,
} from "@chakra-ui/react";

const GameRuleButton = () => {
  const { isOpen, onOpen, onClose } = useDisclosure();

  return (
    <>
      <IconButton
        variant="outline"
        color="white"
        colorScheme="none"
        aria-label="Mute"
        size="sm"
        fontSize="20px"
        onClick={() => onOpen()}
        icon={<BsQuestionCircle />}
      />

      <Modal isOpen={isOpen} onClose={onClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>游戏规则</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack alignItems="start">
              <Text>游戏的目标是收集3张相同数字的卡牌</Text>
              <Text>一共有36张卡牌，数字从1-12，每个数字3张牌</Text>
              <Text>挑战开始：</Text>
              <Text>
                每个玩家回合中，你可以从玩家手牌中揭示最大/最小的卡牌，也可以从公共区任选一张牌
              </Text>
              <Text>挑战的两种结果：</Text>
              <Text>
                1. 一旦出现不同数字的卡牌，则挑战失败，轮到下位玩家操作
              </Text>
              <Text>
                2. 如果连续找出3张数字相同的卡牌，则挑战成功，轮到下位玩家操作
              </Text>
              <Text>游戏结束条件：</Text>
              <Text>1. 当任意一位玩家收集了3套卡牌，该玩家获胜</Text>
              <Text>
                2.
                当任意一位玩家收集的2套卡牌中的数字相加/相减等于7时（如2+5=7，11-4=7），该玩家获胜
              </Text>
              <Text>3. 当任意一位玩家收集了三张数字7，该玩家立刻获胜</Text>
              <Text>
                注：2人游戏中没有数字11和12，3人游戏中没有数字12，4-6人为全部36张牌
              </Text>
            </VStack>
          </ModalBody>

          <ModalFooter>{/*<Button variant="ghost">OK</Button>*/}</ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
};

export default GameRuleButton;
