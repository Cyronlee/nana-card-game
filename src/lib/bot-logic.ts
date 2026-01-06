import { Card, Player } from "@/types";
import { sortByIdAsc, sortByIdDesc } from "@/lib/game-helper";

// ==================== Types ====================

/**
 * 牌槽：表示一个位置上的牌，可能已知或未知
 */
export interface CardSlot {
  cardId: string;
  number: number | null; // null 表示未知
}

/**
 * 玩家手牌记忆：从 bot 视角记录某玩家的手牌
 * 数组已排序（从小到大），已知的牌有 number，未知的牌 number 为 null
 */
export interface PlayerHandMemory {
  playerId: string;
  cards: CardSlot[]; // 排序后的手牌槽位
}

/**
 * Bot 记忆系统 - 只存储原始事实数据
 */
export interface BotMemory {
  botId: string;

  // 自己的手牌（完整已知）
  myHand: CardSlot[];

  // 其他玩家的手牌记忆
  otherPlayersHands: Map<string, PlayerHandMemory>;

  // 公共区牌（包含已知和未知）
  publicCards: CardSlot[];

  // 已收集的三条：playerId -> 收集的数字列表
  collectedSets: Map<string, number[]>;

  // 游戏使用的数字范围（根据玩家数量不同）
  numberRange: { min: number; max: number };
}

/**
 * Bot 决策结果
 */
export interface BotDecision {
  action: "reveal-player-card" | "reveal-public-card";
  playerId?: string; // 目标玩家ID（翻玩家牌时）
  minMax?: "min" | "max"; // 翻头还是翻尾
  cardId?: string; // 公共区牌ID（翻公共牌时）
  confidence: number; // 决策置信度 0-1
  reasoning: string; // 决策理由（用于调试）
}

/**
 * 行动候选项
 */
export interface ActionCandidate {
  decision: BotDecision;
  probability: number; // 翻到目标的概率
  expectedValue: number; // 期望收益
}

// ==================== Memory Management ====================

/**
 * 根据玩家数量确定数字范围
 */
export function getNumberRangeForPlayerCount(playerCount: number): {
  min: number;
  max: number;
} {
  switch (playerCount) {
    case 2:
      return { min: 1, max: 10 }; // 2人局去掉11、12
    case 3:
      return { min: 1, max: 11 }; // 3人局去掉12
    default:
      return { min: 1, max: 12 }; // 4-6人使用全部
  }
}

/**
 * 初始化 Bot 记忆
 */
export function initBotMemory(
  botId: string,
  botHand: Card[],
  players: Player[],
  publicCards: Card[],
  numberRange: { min: number; max: number }
): BotMemory {
  // 1. 自己的手牌：完整已知，转换为 CardSlot[]
  const myHand: CardSlot[] = botHand.map((c) => ({
    cardId: c.id,
    number: c.number, // 完全已知
  }));

  // 2. 其他玩家的手牌：只知道数量，不知道具体值
  const otherPlayersHands = new Map<string, PlayerHandMemory>();
  for (const player of players) {
    if (player.id !== botId) {
      otherPlayersHands.set(player.id, {
        playerId: player.id,
        cards: player.hand.map((c) => ({
          cardId: c.id,
          number: null, // 未知
        })),
      });
    }
  }

  // 3. 公共区牌：初始全部未知
  const publicCardsSlots: CardSlot[] = publicCards.map((c) => ({
    cardId: c.id,
    number: null,
  }));

  return {
    botId,
    myHand,
    otherPlayersHands,
    publicCards: publicCardsSlots,
    collectedSets: new Map(),
    numberRange,
  };
}

/**
 * 当牌被翻开时更新记忆
 */
export function updateMemoryOnReveal(
  memory: BotMemory,
  revealedCardId: string,
  revealedNumber: number,
  source: { type: "player"; playerId: string } | { type: "public" }
): BotMemory {
  // 创建新的记忆对象（不可变更新）
  const newMemory = { ...memory };

  if (source.type === "player") {
    if (source.playerId === memory.botId) {
      // 自己的牌被翻开（理论上已经知道，但仍需标记）
      newMemory.myHand = memory.myHand.map((slot) =>
        slot.cardId === revealedCardId
          ? { ...slot, number: revealedNumber }
          : slot
      );
    } else {
      // 更新对应玩家手牌中的 CardSlot
      const playerHand = memory.otherPlayersHands.get(source.playerId);
      if (playerHand) {
        const newOtherHands = new Map(memory.otherPlayersHands);
        const newCards = playerHand.cards.map((slot) =>
          slot.cardId === revealedCardId
            ? { ...slot, number: revealedNumber }
            : slot
        );
        newOtherHands.set(source.playerId, {
          ...playerHand,
          cards: newCards,
        });
        newMemory.otherPlayersHands = newOtherHands;
      }
    }
  } else {
    // 更新公共区牌
    newMemory.publicCards = memory.publicCards.map((slot) =>
      slot.cardId === revealedCardId
        ? { ...slot, number: revealedNumber }
        : slot
    );
  }

  return newMemory;
}

/**
 * 当三条被收集时更新记忆
 */
export function updateMemoryOnCollect(
  memory: BotMemory,
  collectorId: string,
  collectedNumber: number
): BotMemory {
  const newMemory = { ...memory };

  // 1. 记录收集
  const newCollectedSets = new Map(memory.collectedSets);
  const existing = newCollectedSets.get(collectorId) || [];
  newCollectedSets.set(collectorId, [...existing, collectedNumber]);
  newMemory.collectedSets = newCollectedSets;

  // 2. 从自己手牌移除
  newMemory.myHand = memory.myHand.filter(
    (slot) => slot.number !== collectedNumber
  );

  // 3. 从其他玩家手牌移除
  const newOtherHands = new Map<string, PlayerHandMemory>();
  for (const [playerId, hand] of Array.from(memory.otherPlayersHands)) {
    newOtherHands.set(playerId, {
      ...hand,
      cards: hand.cards.filter(
        (slot: CardSlot) => slot.number !== collectedNumber
      ),
    });
  }
  newMemory.otherPlayersHands = newOtherHands;

  // 4. 从公共区移除
  newMemory.publicCards = memory.publicCards.filter(
    (slot) => slot.number !== collectedNumber
  );

  return newMemory;
}

// ==================== Derived Calculations ====================

/**
 * 获取玩家已知的头值（最小端）
 * 如果头牌已被翻开过且未被移除，返回该值；否则返回 null
 */
export function getKnownHeadValue(
  memory: BotMemory,
  playerId: string
): number | null {
  if (playerId === memory.botId) {
    // 自己的头值总是已知
    return memory.myHand[0]?.number ?? null;
  }
  const hand = memory.otherPlayersHands.get(playerId);
  if (!hand || hand.cards.length === 0) return null;
  // 头牌（第一张）如果已知则返回
  return hand.cards[0].number;
}

/**
 * 获取玩家已知的尾值（最大端）
 */
export function getKnownTailValue(
  memory: BotMemory,
  playerId: string
): number | null {
  if (playerId === memory.botId) {
    return memory.myHand[memory.myHand.length - 1]?.number ?? null;
  }
  const hand = memory.otherPlayersHands.get(playerId);
  if (!hand || hand.cards.length === 0) return null;
  return hand.cards[hand.cards.length - 1].number;
}

/**
 * 获取玩家当前手牌数量
 */
export function getHandSize(memory: BotMemory, playerId: string): number {
  if (playerId === memory.botId) {
    return memory.myHand.length;
  }
  return memory.otherPlayersHands.get(playerId)?.cards.length ?? 0;
}

/**
 * 获取某数字在全局的剩余张数
 * 计算方式：3 - 已收集的 - 已知在各位置的
 */
export function getGlobalRemainingCount(
  memory: BotMemory,
  targetNumber: number
): number {
  let remaining = 3; // 每个数字初始3张

  // 减去已收集的
  for (const collected of Array.from(memory.collectedSets.values())) {
    if (collected.includes(targetNumber)) {
      return 0; // 已被收集，剩余0张
    }
  }

  // 减去自己手中的
  remaining -= memory.myHand.filter((s) => s.number === targetNumber).length;

  // 减去其他玩家已知的
  for (const hand of Array.from(memory.otherPlayersHands.values())) {
    remaining -= hand.cards.filter(
      (s: CardSlot) => s.number === targetNumber
    ).length;
  }

  // 减去公共区已知的
  remaining -= memory.publicCards.filter(
    (s) => s.number === targetNumber
  ).length;

  return Math.max(0, remaining);
}

/**
 * 获取玩家手牌中已排除的数字集合
 * 基于头尾约束推理：如果头=5，则 1-4 被排除
 */
export function getExcludedNumbers(
  memory: BotMemory,
  playerId: string
): Set<number> {
  const excluded = new Set<number>();
  const headValue = getKnownHeadValue(memory, playerId);
  const tailValue = getKnownTailValue(memory, playerId);

  // 如果头值已知，则所有 < 头值的数字被排除
  if (headValue !== null) {
    for (let n = memory.numberRange.min; n < headValue; n++) {
      excluded.add(n);
    }
  }

  // 如果尾值已知，则所有 > 尾值的数字被排除
  if (tailValue !== null) {
    for (let n = tailValue + 1; n <= memory.numberRange.max; n++) {
      excluded.add(n);
    }
  }

  return excluded;
}

/**
 * 获取公共区未知牌数量
 */
export function getUnknownPublicCount(memory: BotMemory): number {
  return memory.publicCards.filter((s) => s.number === null).length;
}

/**
 * 获取公共区中某数字的已知张数
 */
export function getKnownPublicCountForNumber(
  memory: BotMemory,
  targetNumber: number
): number {
  return memory.publicCards.filter((s) => s.number === targetNumber).length;
}

// ==================== Probability Calculation ====================

/**
 * 计算翻到目标数字的概率
 */
export function calculateProbability(
  memory: BotMemory,
  targetNumber: number,
  source:
    | { type: "player"; playerId: string; position: "head" | "tail" }
    | { type: "public" }
): number {
  // 全局剩余0张，概率为0
  const globalRemaining = getGlobalRemainingCount(memory, targetNumber);
  if (globalRemaining === 0) return 0;

  if (source.type === "player") {
    const { playerId, position } = source;

    // 获取已知值
    const knownValue =
      position === "head"
        ? getKnownHeadValue(memory, playerId)
        : getKnownTailValue(memory, playerId);

    // 已知值：确定性判断
    if (knownValue !== null) {
      return knownValue === targetNumber ? 1.0 : 0.0;
    }

    // 未知值：概率估算
    const excluded = getExcludedNumbers(memory, playerId);
    if (excluded.has(targetNumber)) return 0;

    // 简化估算：剩余张数 / 可能的数字范围
    const possibleNumbers =
      memory.numberRange.max - memory.numberRange.min + 1 - excluded.size;
    if (possibleNumbers <= 0) return 0;

    return Math.min(1, globalRemaining / possibleNumbers);
  } else {
    // 公共区概率
    const unknownCount = memory.publicCards.filter(
      (s) => s.number === null
    ).length;
    if (unknownCount === 0) return 0;

    // 已知在公共区的数量
    const knownInPublic = memory.publicCards.filter(
      (s) => s.number === targetNumber
    ).length;

    // 剩余可能在公共区的数量
    const possibleInPublic = globalRemaining - knownInPublic;
    if (possibleInPublic <= 0) return 0;

    return Math.min(1, possibleInPublic / unknownCount);
  }
}

// ==================== Action Evaluation ====================

/**
 * 获取所有可能的行动
 */
export function getAllPossibleActions(
  memory: BotMemory,
  players: Player[],
  publicCards: Card[]
): BotDecision[] {
  const actions: BotDecision[] = [];

  // 遍历所有玩家（包括自己）
  for (const player of players) {
    const handSize = getHandSize(memory, player.id);
    if (handSize === 0) continue;

    // 检查是否有未翻开的头牌
    let hasUnrevealedHead = false;
    let hasUnrevealedTail = false;

    if (player.id === memory.botId) {
      // 自己的牌
      hasUnrevealedHead = memory.myHand.length > 0;
      hasUnrevealedTail = memory.myHand.length > 0;
    } else {
      const hand = memory.otherPlayersHands.get(player.id);
      if (hand && hand.cards.length > 0) {
        // 检查实际游戏中是否有未翻开的牌
        const playerInGame = players.find((p) => p.id === player.id);
        if (playerInGame) {
          const unrevealedCards = playerInGame.hand.filter(
            (c) => !c.isRevealed
          );
          hasUnrevealedHead = unrevealedCards.some((c) => {
            // 找到这张牌在排序后的位置
            const sortedUnrevealed = [...unrevealedCards].sort(sortByIdAsc);
            return c.id === sortedUnrevealed[0]?.id;
          });
          hasUnrevealedTail = unrevealedCards.some((c) => {
            const sortedUnrevealed = [...unrevealedCards].sort(sortByIdDesc);
            return c.id === sortedUnrevealed[0]?.id;
          });
        }
      }
    }

    if (hasUnrevealedHead) {
      actions.push({
        action: "reveal-player-card",
        playerId: player.id,
        minMax: "min",
        confidence: 0,
        reasoning: "",
      });
    }

    if (hasUnrevealedTail && handSize > 1) {
      actions.push({
        action: "reveal-player-card",
        playerId: player.id,
        minMax: "max",
        confidence: 0,
        reasoning: "",
      });
    }
  }

  // 遍历公共区未翻开的牌
  for (const card of publicCards) {
    if (!card.isRevealed && card.id) {
      actions.push({
        action: "reveal-public-card",
        cardId: card.id,
        confidence: 0,
        reasoning: "",
      });
    }
  }

  return actions;
}

/**
 * 寻找已知两处相同数字的情况
 */
function findKnownPairOpportunity(
  memory: BotMemory,
  players: Player[]
): {
  number: number;
  sources: Array<{ playerId: string; position: "head" | "tail" }>;
} | null {
  const knownValues: Array<{
    number: number;
    playerId: string;
    position: "head" | "tail";
  }> = [];

  // 收集所有已知的头尾值
  for (const player of players) {
    const headValue = getKnownHeadValue(memory, player.id);
    const tailValue = getKnownTailValue(memory, player.id);

    if (headValue !== null) {
      knownValues.push({
        number: headValue,
        playerId: player.id,
        position: "head",
      });
    }
    if (tailValue !== null && tailValue !== headValue) {
      knownValues.push({
        number: tailValue,
        playerId: player.id,
        position: "tail",
      });
    }
  }

  // 寻找两个相同数字
  for (let i = 0; i < knownValues.length; i++) {
    for (let j = i + 1; j < knownValues.length; j++) {
      if (knownValues[i].number === knownValues[j].number) {
        const num = knownValues[i].number;
        // 确保这个数字还没被收集，且还有第三张
        if (getGlobalRemainingCount(memory, num) >= 1) {
          return {
            number: num,
            sources: [
              {
                playerId: knownValues[i].playerId,
                position: knownValues[i].position,
              },
              {
                playerId: knownValues[j].playerId,
                position: knownValues[j].position,
              },
            ],
          };
        }
      }
    }
  }

  return null;
}

/**
 * 寻找最佳第二/第三张牌的来源
 */
function findBestSourceForNumber(
  memory: BotMemory,
  targetNumber: number,
  players: Player[],
  publicCards: Card[],
  excludeActions: BotDecision[] = []
): ActionCandidate | null {
  const candidates: ActionCandidate[] = [];

  // 检查所有玩家的头尾
  for (const player of players) {
    const handSize = getHandSize(memory, player.id);
    if (handSize === 0) continue;

    // 检查头
    const headProb = calculateProbability(memory, targetNumber, {
      type: "player",
      playerId: player.id,
      position: "head",
    });

    if (headProb > 0) {
      const decision: BotDecision = {
        action: "reveal-player-card",
        playerId: player.id,
        minMax: "min",
        confidence: headProb,
        reasoning: `Probability of ${targetNumber} at ${player.id}'s head: ${(headProb * 100).toFixed(1)}%`,
      };

      // 检查是否在排除列表中
      const isExcluded = excludeActions.some(
        (a) =>
          a.action === decision.action &&
          a.playerId === decision.playerId &&
          a.minMax === decision.minMax
      );

      if (!isExcluded) {
        candidates.push({
          decision,
          probability: headProb,
          expectedValue: headProb,
        });
      }
    }

    // 检查尾（如果有多张牌）
    if (handSize > 1) {
      const tailProb = calculateProbability(memory, targetNumber, {
        type: "player",
        playerId: player.id,
        position: "tail",
      });

      if (tailProb > 0) {
        const decision: BotDecision = {
          action: "reveal-player-card",
          playerId: player.id,
          minMax: "max",
          confidence: tailProb,
          reasoning: `Probability of ${targetNumber} at ${player.id}'s tail: ${(tailProb * 100).toFixed(1)}%`,
        };

        const isExcluded = excludeActions.some(
          (a) =>
            a.action === decision.action &&
            a.playerId === decision.playerId &&
            a.minMax === decision.minMax
        );

        if (!isExcluded) {
          candidates.push({
            decision,
            probability: tailProb,
            expectedValue: tailProb,
          });
        }
      }
    }
  }

  // 检查公共区
  const publicProb = calculateProbability(memory, targetNumber, {
    type: "public",
  });
  if (publicProb > 0) {
    // 找一张未翻开的公共牌
    const unrevealedPublic = publicCards.find((c) => !c.isRevealed && c.id);
    if (unrevealedPublic) {
      const decision: BotDecision = {
        action: "reveal-public-card",
        cardId: unrevealedPublic.id,
        confidence: publicProb,
        reasoning: `Probability of ${targetNumber} in public: ${(publicProb * 100).toFixed(1)}%`,
      };

      const isExcluded = excludeActions.some(
        (a) => a.action === decision.action && a.cardId === decision.cardId
      );

      if (!isExcluded) {
        candidates.push({
          decision,
          probability: publicProb,
          expectedValue: publicProb,
        });
      }
    }
  }

  // 按概率排序，返回最高的
  candidates.sort((a, b) => b.probability - a.probability);
  return candidates[0] || null;
}

/**
 * 寻找最有价值的起始目标数字
 */
function findBestTargetNumber(memory: BotMemory): number | null {
  let bestNumber: number | null = null;
  let bestScore = -1;

  for (let n = memory.numberRange.min; n <= memory.numberRange.max; n++) {
    const remaining = getGlobalRemainingCount(memory, n);
    // 至少需要3张才能收集
    if (remaining < 3) continue;

    // 优先选择自己手中有的数字
    const myCount = memory.myHand.filter((s) => s.number === n).length;
    const score = remaining + myCount * 2; // 自己手中的牌有额外权重

    if (score > bestScore) {
      bestScore = score;
      bestNumber = n;
    }
  }

  return bestNumber;
}

// ==================== Main Decision Function ====================

/**
 * Bot 主决策函数
 */
export function makeBotDecision(
  memory: BotMemory,
  currentChain: Card[],
  players: Player[],
  publicCards: Card[]
): BotDecision {
  const chainLength = currentChain.length;
  const targetNumber = chainLength > 0 ? currentChain[0].number : null;

  // ===== 已翻2张状态 (flip-3) =====
  if (chainLength === 2 && targetNumber !== null) {
    // 寻找第三张目标数字
    const bestSource = findBestSourceForNumber(
      memory,
      targetNumber,
      players,
      publicCards
    );

    if (bestSource) {
      return {
        ...bestSource.decision,
        reasoning: `[flip-3] Looking for third ${targetNumber}: ${bestSource.decision.reasoning}`,
      };
    }

    // 没有好的选择，随机翻一张（会失败但必须翻）
    return makeExploratoryDecision(
      memory,
      players,
      publicCards,
      "No good option for third card"
    );
  }

  // ===== 已翻1张状态 (flip-2) =====
  if (chainLength === 1 && targetNumber !== null) {
    // 寻找第二张目标数字
    const bestSource = findBestSourceForNumber(
      memory,
      targetNumber,
      players,
      publicCards
    );

    if (bestSource && bestSource.probability >= 0.1) {
      return {
        ...bestSource.decision,
        reasoning: `[flip-2] Looking for second ${targetNumber}: ${bestSource.decision.reasoning}`,
      };
    }

    // 概率太低，考虑放弃（翻一张不匹配的结束回合）
    // 但也可能继续冒险，困难模式倾向于冒险
    if (bestSource) {
      return {
        ...bestSource.decision,
        reasoning: `[flip-2] Taking a chance for ${targetNumber}: ${bestSource.decision.reasoning}`,
      };
    }

    return makeExploratoryDecision(
      memory,
      players,
      publicCards,
      "No source for second card"
    );
  }

  // ===== 空链状态 (flip-1) =====

  // 策略1：检查是否已知两处相同数字
  const pairOpp = findKnownPairOpportunity(memory, players);
  if (pairOpp) {
    // 先翻第一个已知位置
    const firstSource = pairOpp.sources[0];
    return {
      action: "reveal-player-card",
      playerId: firstSource.playerId,
      minMax: firstSource.position === "head" ? "min" : "max",
      confidence: 1.0,
      reasoning: `[flip-1] Found known pair of ${pairOpp.number}, starting with ${firstSource.playerId}'s ${firstSource.position}`,
    };
  }

  // 策略2：优先翻自己的头牌作为起点
  if (memory.myHand.length > 0) {
    const myHeadNumber = memory.myHand[0].number!;
    const remaining = getGlobalRemainingCount(memory, myHeadNumber);

    if (remaining >= 2) {
      // 还能凑成三条
      return {
        action: "reveal-player-card",
        playerId: memory.botId,
        minMax: "min",
        confidence: 0.8,
        reasoning: `[flip-1] Starting with my head card (${myHeadNumber}), ${remaining + 1} total remaining`,
      };
    }
  }

  // 策略3：寻找最有价值的目标数字
  const bestTarget = findBestTargetNumber(memory);
  if (bestTarget !== null) {
    // 找到这个数字最好的来源
    const bestSource = findBestSourceForNumber(
      memory,
      bestTarget,
      players,
      publicCards
    );

    if (bestSource && bestSource.probability > 0) {
      return {
        ...bestSource.decision,
        reasoning: `[flip-1] Targeting ${bestTarget}: ${bestSource.decision.reasoning}`,
      };
    }
  }

  // 策略4：探索性翻牌
  return makeExploratoryDecision(
    memory,
    players,
    publicCards,
    "No clear target, exploring"
  );
}

/**
 * 探索性决策（没有明确目标时）
 */
function makeExploratoryDecision(
  memory: BotMemory,
  players: Player[],
  publicCards: Card[],
  reason: string
): BotDecision {
  // 优先翻对手的头牌（获取信息）
  for (const player of players) {
    if (player.id === memory.botId) continue;

    const headValue = getKnownHeadValue(memory, player.id);
    if (headValue === null) {
      // 头值未知，翻开它
      const handSize = getHandSize(memory, player.id);
      if (handSize > 0) {
        return {
          action: "reveal-player-card",
          playerId: player.id,
          minMax: "min",
          confidence: 0.3,
          reasoning: `[explore] ${reason}. Revealing ${player.id}'s head for information`,
        };
      }
    }
  }

  // 翻公共牌
  const unrevealedPublic = publicCards.find((c) => !c.isRevealed && c.id);
  if (unrevealedPublic) {
    return {
      action: "reveal-public-card",
      cardId: unrevealedPublic.id,
      confidence: 0.2,
      reasoning: `[explore] ${reason}. Revealing public card for information`,
    };
  }

  // 翻自己的牌（最后选择）
  if (memory.myHand.length > 0) {
    return {
      action: "reveal-player-card",
      playerId: memory.botId,
      minMax: "min",
      confidence: 0.1,
      reasoning: `[explore] ${reason}. Revealing own card as last resort`,
    };
  }

  // 实在没有选择
  return {
    action: "reveal-public-card",
    cardId: publicCards[0]?.id || "",
    confidence: 0,
    reasoning: `[explore] No valid actions available`,
  };
}

/**
 * 评估所有行动的期望收益
 */
export function evaluateAllActions(
  memory: BotMemory,
  currentChain: Card[],
  players: Player[],
  publicCards: Card[]
): ActionCandidate[] {
  const actions = getAllPossibleActions(memory, players, publicCards);
  const candidates: ActionCandidate[] = [];

  const targetNumber = currentChain.length > 0 ? currentChain[0].number : null;

  for (const action of actions) {
    let probability = 0;
    let expectedValue = 0;

    if (targetNumber !== null) {
      // 有目标数字，计算翻到目标的概率
      if (action.action === "reveal-player-card" && action.playerId) {
        probability = calculateProbability(memory, targetNumber, {
          type: "player",
          playerId: action.playerId,
          position: action.minMax === "min" ? "head" : "tail",
        });
      } else if (action.action === "reveal-public-card") {
        probability = calculateProbability(memory, targetNumber, {
          type: "public",
        });
      }

      // 期望收益
      if (currentChain.length === 2) {
        // 第三张，成功率就是期望收益
        expectedValue = probability;
      } else if (currentChain.length === 1) {
        // 第二张，需要考虑后续成功的概率
        expectedValue = probability * 0.5; // 简化估算
      }
    } else {
      // 空链，探索价值
      expectedValue = 0.1; // 基础探索价值
    }

    candidates.push({
      decision: { ...action, confidence: probability },
      probability,
      expectedValue,
    });
  }

  // 按期望收益排序
  candidates.sort((a, b) => b.expectedValue - a.expectedValue);

  return candidates;
}
