# Bot 逻辑实现方案

## 1. 概述

本文档描述了 NANA 卡牌游戏中困难级 Bot 的实现方案。Bot 将具备完美记忆和推理能力，追求最大胜率。

## 2. 数据结构设计

### 2.1 设计原则

采用 **原始数据 + 派生计算** 的设计模式：

- **原始数据**：只存储最基本的事实数据（手牌数组、公共牌数组、收集记录）
- **派生计算**：通过纯函数计算 knownHeadValue、knownTailValue、excludedNumbers 等

这样设计的优点：

1. **避免数据冗余** - 只维护一份原始数据，不会出现不一致
2. **单一数据源** - 派生数据通过计算得出，始终正确
3. **易于维护** - 更新原始数据时不需要同步更新多个字段
4. **更直观** - 数据结构更接近实际游戏状态

### 2.2 原始数据结构 (`BotMemory`)

```typescript
// src/lib/bot-logic.ts

/**
 * 牌槽：表示一个位置上的牌，可能已知或未知
 */
interface CardSlot {
  cardId: string;
  number: number | null; // null 表示未知
}

/**
 * 玩家手牌记忆：从 bot 视角记录某玩家的手牌
 * 数组已排序（从小到大），已知的牌有 number，未知的牌 number 为 null
 */
interface PlayerHandMemory {
  playerId: string;
  cards: CardSlot[]; // 排序后的手牌槽位
}

/**
 * Bot 记忆系统 - 只存储原始事实数据
 */
interface BotMemory {
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
```

### 2.3 派生计算函数

```typescript
/**
 * 获取玩家已知的头值（最小端）
 * 如果头牌已被翻开过且未被移除，返回该值；否则返回 null
 */
function getKnownHeadValue(memory: BotMemory, playerId: string): number | null;

/**
 * 获取玩家已知的尾值（最大端）
 */
function getKnownTailValue(memory: BotMemory, playerId: string): number | null;

/**
 * 获取玩家当前手牌数量
 */
function getHandSize(memory: BotMemory, playerId: string): number;

/**
 * 获取某数字在全局的剩余张数
 * 计算方式：3 - 已收集的 - 已知在各位置的
 */
function getGlobalRemainingCount(
  memory: BotMemory,
  targetNumber: number
): number;

/**
 * 获取玩家手牌中已排除的数字集合
 * 基于头尾约束推理：如果头=5，则 1-4 被排除
 */
function getExcludedNumbers(memory: BotMemory, playerId: string): Set<number>;

/**
 * 获取公共区未知牌数量
 */
function getUnknownPublicCount(memory: BotMemory): number;

/**
 * 获取公共区中某数字的已知张数
 */
function getKnownPublicCountForNumber(
  memory: BotMemory,
  targetNumber: number
): number;
```

### 2.4 Bot 决策结果 (`BotDecision`)

```typescript
interface BotDecision {
  action: "reveal-player-card" | "reveal-public-card";
  playerId?: string; // 目标玩家ID（翻玩家牌时）
  minMax?: "min" | "max"; // 翻头还是翻尾
  cardId?: string; // 公共区牌ID（翻公共牌时）
  confidence: number; // 决策置信度 0-1
  reasoning: string; // 决策理由（用于调试）
}
```

## 3. 核心函数设计

### 3.1 记忆初始化

```typescript
function initBotMemory(
  botId: string,
  botHand: Card[],
  players: Player[],
  publicCards: Card[],
  numberRange: { min: number; max: number }
): BotMemory;
```

初始化逻辑：

```typescript
function initBotMemory(...): BotMemory {
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
```

### 3.2 记忆更新

```typescript
/**
 * 当牌被翻开时更新记忆
 */
function updateMemoryOnReveal(
  memory: BotMemory,
  revealedCardId: string,
  revealedNumber: number,
  source: { type: "player"; playerId: string } | { type: "public" }
): BotMemory;
```

更新逻辑：

```typescript
function updateMemoryOnReveal(...): BotMemory {
  // 创建新的记忆对象（不可变更新）
  const newMemory = { ...memory };

  if (source.type === "player") {
    // 更新对应玩家手牌中的 CardSlot
    const playerHand = newMemory.otherPlayersHands.get(source.playerId);
    if (playerHand) {
      const newCards = playerHand.cards.map((slot) =>
        slot.cardId === revealedCardId ? { ...slot, number: revealedNumber } : slot
      );
      newMemory.otherPlayersHands.set(source.playerId, {
        ...playerHand,
        cards: newCards,
      });
    }
  } else {
    // 更新公共区牌
    newMemory.publicCards = memory.publicCards.map((slot) =>
      slot.cardId === revealedCardId ? { ...slot, number: revealedNumber } : slot
    );
  }

  return newMemory;
}

/**
 * 当三条被收集时更新记忆
 */
function updateMemoryOnCollect(
  memory: BotMemory,
  collectorId: string,
  collectedNumber: number
): BotMemory;
```

更新逻辑：

```typescript
function updateMemoryOnCollect(...): BotMemory {
  const newMemory = { ...memory };

  // 1. 记录收集
  const newCollectedSets = new Map(memory.collectedSets);
  const existing = newCollectedSets.get(collectorId) || [];
  newCollectedSets.set(collectorId, [...existing, collectedNumber]);
  newMemory.collectedSets = newCollectedSets;

  // 2. 从自己手牌移除
  newMemory.myHand = memory.myHand.filter((slot) => slot.number !== collectedNumber);

  // 3. 从其他玩家手牌移除
  const newOtherHands = new Map<string, PlayerHandMemory>();
  for (const [playerId, hand] of memory.otherPlayersHands) {
    newOtherHands.set(playerId, {
      ...hand,
      cards: hand.cards.filter((slot) => slot.number !== collectedNumber),
    });
  }
  newMemory.otherPlayersHands = newOtherHands;

  // 4. 从公共区移除
  newMemory.publicCards = memory.publicCards.filter(
    (slot) => slot.number !== collectedNumber
  );

  return newMemory;
}
```

### 3.3 派生计算实现

```typescript
function getKnownHeadValue(memory: BotMemory, playerId: string): number | null {
  if (playerId === memory.botId) {
    // 自己的头值总是已知
    return memory.myHand[0]?.number ?? null;
  }
  const hand = memory.otherPlayersHands.get(playerId);
  if (!hand || hand.cards.length === 0) return null;
  // 头牌（第一张）如果已知则返回
  return hand.cards[0].number;
}

function getKnownTailValue(memory: BotMemory, playerId: string): number | null {
  if (playerId === memory.botId) {
    return memory.myHand[memory.myHand.length - 1]?.number ?? null;
  }
  const hand = memory.otherPlayersHands.get(playerId);
  if (!hand || hand.cards.length === 0) return null;
  return hand.cards[hand.cards.length - 1].number;
}

function getHandSize(memory: BotMemory, playerId: string): number {
  if (playerId === memory.botId) {
    return memory.myHand.length;
  }
  return memory.otherPlayersHands.get(playerId)?.cards.length ?? 0;
}

function getGlobalRemainingCount(
  memory: BotMemory,
  targetNumber: number
): number {
  let remaining = 3; // 每个数字初始3张

  // 减去已收集的
  for (const collected of memory.collectedSets.values()) {
    if (collected.includes(targetNumber)) {
      return 0; // 已被收集，剩余0张
    }
  }

  // 减去自己手中的
  remaining -= memory.myHand.filter((s) => s.number === targetNumber).length;

  // 减去其他玩家已知的
  for (const hand of memory.otherPlayersHands.values()) {
    remaining -= hand.cards.filter((s) => s.number === targetNumber).length;
  }

  // 减去公共区已知的
  remaining -= memory.publicCards.filter(
    (s) => s.number === targetNumber
  ).length;

  return Math.max(0, remaining);
}

function getExcludedNumbers(memory: BotMemory, playerId: string): Set<number> {
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
```

### 3.4 概率计算

```typescript
function calculateProbability(
  memory: BotMemory,
  targetNumber: number,
  source:
    | { type: "player"; playerId: string; position: "head" | "tail" }
    | { type: "public" }
): number;
```

计算逻辑：

```typescript
function calculateProbability(...): number {
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
    return Math.min(1, globalRemaining / possibleNumbers);
  } else {
    // 公共区概率
    const unknownCount = memory.publicCards.filter((s) => s.number === null).length;
    if (unknownCount === 0) return 0;

    // 已知在公共区的数量
    const knownInPublic = memory.publicCards.filter(
      (s) => s.number === targetNumber
    ).length;

    // 剩余可能在公共区的数量
    const possibleInPublic = globalRemaining - knownInPublic;
    return possibleInPublic / unknownCount;
  }
}
```

### 3.5 期望收益计算

```typescript
interface ActionCandidate {
  decision: BotDecision;
  probability: number; // 翻到目标的概率
  expectedValue: number; // 期望收益
}

function evaluateAllActions(
  memory: BotMemory,
  currentChain: Card[], // 当前已翻开的牌
  availableActions: BotDecision[]
): ActionCandidate[];
```

期望收益计算：

- **空链**：EV = P(翻到有价值数字) × 后续成功期望
- **1张T**：EV = P(翻到T) × P(找到第三张T|已有两张T)
- **2张T**：EV = P(翻到T) × 1.0

### 3.6 主决策函数

```typescript
function makeBotDecision(
  memory: BotMemory,
  currentChain: Card[],
  players: Player[],
  publicCards: Card[]
): BotDecision;
```

**决策流程：**

```
1. 枚举所有可能的行动
   - 每个玩家（包括自己）的头/尾（如果有未翻开的牌）
   - 每张未翻开的公共牌

2. 根据当前链状态决策：

   [空链 - flip-1]
   - 优先翻自己的头牌（已知值，信息优势）
   - 或寻找已知两处相同值的情况

   [已翻1张T - flip-2]
   - 寻找第二张T
   - 优先级：确定性(1.0) > 高概率 > 低概率
   - 如果最高概率 < 阈值，考虑放弃当前链

   [已翻2张T - flip-3]
   - 寻找第三张T，同上优先级

3. 计算每个行动的期望收益，选择最高者
```

## 4. local-game-store.tsx 集成

### 4.1 状态扩展

```typescript
export interface LocalGameState {
  // ... 现有字段 ...

  // Bot 记忆存储：每个 bot 维护自己的视角
  botMemories: Map<string, BotMemory>;
}
```

### 4.2 需要修改的函数

#### `startGame()`

```typescript
// 在创建玩家后初始化所有 bot 的记忆
const botMemories = new Map<string, BotMemory>();
const numberRange = getNumberRangeForPlayerCount(totalPlayers);

for (const player of players) {
  if (player.id.startsWith("bot-")) {
    const memory = initBotMemory(
      player.id,
      player.hand, // bot 自己的手牌（完整已知）
      players,
      publicCards,
      numberRange
    );
    botMemories.set(player.id, memory);
  }
}

set((state) => {
  // ... 其他状态更新 ...
  state.botMemories = botMemories;
});
```

#### `revealPlayerCard()` 和 `revealPublicCard()`

```typescript
// 在牌被翻开后更新所有 bot 的记忆
set((draft) => {
  // ... 现有的翻牌逻辑 ...

  // 更新所有 bot 的记忆
  for (const [botId, memory] of draft.botMemories) {
    draft.botMemories.set(
      botId,
      updateMemoryOnReveal(
        memory,
        card.id, // 被翻开的牌ID
        card.number, // 翻开后的数字
        { type: "player", playerId } // 或 { type: "public" }
      )
    );
  }
});
```

#### `processTurnResult()` - 成功收集时

```typescript
// 收集成功后更新所有 bot 的记忆
set((draft) => {
  // ... 现有的收集逻辑 ...

  // 更新所有 bot 的记忆
  for (const [botId, memory] of draft.botMemories) {
    draft.botMemories.set(
      botId,
      updateMemoryOnCollect(memory, currentPlayerId, collectedNumber)
    );
  }
});
```

#### `executeBotTurn()`

```typescript
executeBotTurn: async () => {
  const state = get();
  if (state.gameStage !== "in-game") return;
  if (!state.isCurrentPlayerBot()) return;

  const currentPlayer = state.getCurrentPlayer();
  if (!currentPlayer) return;

  const memory = state.botMemories.get(currentPlayer.id);
  if (!memory) return;

  const revealedCards = state.getRevealedCards();

  // 做出决策（使用新的数据结构）
  const decision = makeBotDecision(
    memory,
    revealedCards,
    state.players,
    state.publicCards
  );

  // 调试日志（开发模式）
  if (process.env.NODE_ENV === "development") {
    console.log(`[Bot ${currentPlayer.id}] Decision:`, decision.reasoning);
  }

  // 执行决策（带动画延迟）
  await new Promise((resolve) => setTimeout(resolve, 800));

  if (decision.action === "reveal-player-card" && decision.playerId) {
    get().revealPlayerCard(decision.playerId, decision.minMax || "min");
  } else if (decision.action === "reveal-public-card" && decision.cardId) {
    get().revealPublicCard(decision.cardId);
  }
};
```

### 4.3 辅助函数

```typescript
// 根据玩家数量确定数字范围
function getNumberRangeForPlayerCount(playerCount: number): {
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
```

## 5. 测试场景

### 5.1 单元测试 - 记忆初始化与原始数据

#### 测试文件: `src/lib/__tests__/bot-logic.test.ts`

```typescript
describe("BotMemory Initialization", () => {
  const players = [
    { id: "me", hand: createCards(7) },
    { id: "bot-1", hand: createCards(7) },
    { id: "bot-2", hand: createCards(7) },
  ];
  const publicCards = createCards(8);

  test("应正确初始化 bot 自己的手牌（完整已知）", () => {
    const botHand = [
      { id: "2-a", number: 2, isRevealed: false },
      { id: "5-b", number: 5, isRevealed: false },
      { id: "8-c", number: 8, isRevealed: false },
    ];
    const memory = initBotMemory("bot-1", botHand, players, publicCards, {
      min: 1,
      max: 12,
    });

    expect(memory.myHand).toHaveLength(3);
    expect(memory.myHand[0]).toEqual({ cardId: "2-a", number: 2 });
    expect(memory.myHand[1]).toEqual({ cardId: "5-b", number: 5 });
    expect(memory.myHand[2]).toEqual({ cardId: "8-c", number: 8 });
  });

  test("应正确初始化其他玩家手牌（全部未知）", () => {
    const memory = initBotMemory("bot-1", botHand, players, publicCards, {
      min: 1,
      max: 12,
    });

    const meHand = memory.otherPlayersHands.get("me");
    expect(meHand?.cards).toHaveLength(7);
    expect(meHand?.cards.every((slot) => slot.number === null)).toBe(true);
  });

  test("应正确初始化公共区牌（全部未知）", () => {
    const memory = initBotMemory("bot-1", botHand, players, publicCards, {
      min: 1,
      max: 12,
    });

    expect(memory.publicCards).toHaveLength(8);
    expect(memory.publicCards.every((slot) => slot.number === null)).toBe(true);
  });
});
```

### 5.2 单元测试 - 记忆更新

```typescript
describe("Memory Update on Reveal", () => {
  test("翻开玩家牌时应更新对应槽位的 number", () => {
    let memory = initBotMemory(...);
    const cardId = memory.otherPlayersHands.get("me")?.cards[0].cardId;

    memory = updateMemoryOnReveal(memory, cardId, 3, { type: "player", playerId: "me" });

    expect(memory.otherPlayersHands.get("me")?.cards[0].number).toBe(3);
  });

  test("翻开公共牌时应更新对应槽位的 number", () => {
    let memory = initBotMemory(...);
    const cardId = memory.publicCards[0].cardId;

    memory = updateMemoryOnReveal(memory, cardId, 7, { type: "public" });

    expect(memory.publicCards[0].number).toBe(7);
  });

  test("更新应该是不可变的（返回新对象）", () => {
    const memory = initBotMemory(...);
    const newMemory = updateMemoryOnReveal(memory, cardId, 3, { type: "public" });

    expect(newMemory).not.toBe(memory);
    expect(newMemory.publicCards).not.toBe(memory.publicCards);
  });
});

describe("Memory Update on Collect", () => {
  test("收集三条后应从所有位置移除该数字的牌", () => {
    let memory = initBotMemory(...);
    // 假设 memory.myHand 中有一张 5
    const initialMyHandLength = memory.myHand.length;

    memory = updateMemoryOnCollect(memory, "me", 5);

    // 自己手牌中的5被移除
    expect(memory.myHand.filter((s) => s.number === 5)).toHaveLength(0);
    // 收集记录已更新
    expect(memory.collectedSets.get("me")).toContain(5);
  });

  test("收集后其他玩家已知的该数字牌也应被移除", () => {
    let memory = initBotMemory(...);
    // 先翻开一张牌使其已知
    memory = updateMemoryOnReveal(memory, cardId, 5, { type: "player", playerId: "bot-2" });

    memory = updateMemoryOnCollect(memory, "me", 5);

    // bot-2 手牌中已知的5被移除
    const bot2Cards = memory.otherPlayersHands.get("bot-2")?.cards;
    expect(bot2Cards?.find((s) => s.number === 5)).toBeUndefined();
  });
});
```

### 5.3 单元测试 - 派生计算

```typescript
describe("Derived Calculations", () => {
  describe("getKnownHeadValue / getKnownTailValue", () => {
    test("自己的头尾值总是已知", () => {
      const memory = initBotMemory("bot-1", botHand, ...);

      expect(getKnownHeadValue(memory, "bot-1")).toBe(2); // 假设最小牌是2
      expect(getKnownTailValue(memory, "bot-1")).toBe(8); // 假设最大牌是8
    });

    test("其他玩家未翻牌时头尾值为 null", () => {
      const memory = initBotMemory(...);

      expect(getKnownHeadValue(memory, "me")).toBeNull();
      expect(getKnownTailValue(memory, "me")).toBeNull();
    });

    test("翻开头牌后 knownHeadValue 应返回该值", () => {
      let memory = initBotMemory(...);
      const headCardId = memory.otherPlayersHands.get("me")?.cards[0].cardId;
      memory = updateMemoryOnReveal(memory, headCardId, 3, { type: "player", playerId: "me" });

      expect(getKnownHeadValue(memory, "me")).toBe(3);
    });
  });

  describe("getHandSize", () => {
    test("应返回正确的手牌数量", () => {
      const memory = initBotMemory(...);

      expect(getHandSize(memory, "bot-1")).toBe(3); // bot自己
      expect(getHandSize(memory, "me")).toBe(7); // 其他玩家
    });

    test("收集后手牌数量应减少", () => {
      let memory = initBotMemory(...);
      const before = getHandSize(memory, "bot-1");

      memory = updateMemoryOnCollect(memory, "me", 5); // 假设bot有1张5

      expect(getHandSize(memory, "bot-1")).toBe(before - 1);
    });
  });

  describe("getGlobalRemainingCount", () => {
    test("初始时每个数字剩余 3 - 自己手中的数量", () => {
      // bot手牌：[2, 5, 8]
      const memory = initBotMemory("bot-1", botHand, ...);

      expect(getGlobalRemainingCount(memory, 2)).toBe(2); // 3-1
      expect(getGlobalRemainingCount(memory, 3)).toBe(3); // 未知位置
    });

    test("收集后该数字剩余为 0", () => {
      let memory = initBotMemory(...);
      memory = updateMemoryOnCollect(memory, "me", 5);

      expect(getGlobalRemainingCount(memory, 5)).toBe(0);
    });
  });

  describe("getExcludedNumbers", () => {
    test("已知头值后应排除更小的数字", () => {
      let memory = initBotMemory(...);
      // 翻开 me 的头牌，值为5
      memory = updateMemoryOnReveal(memory, headCardId, 5, { type: "player", playerId: "me" });

      const excluded = getExcludedNumbers(memory, "me");
      expect(excluded.has(1)).toBe(true);
      expect(excluded.has(4)).toBe(true);
      expect(excluded.has(5)).toBe(false); // 5本身不排除
    });

    test("已知尾值后应排除更大的数字", () => {
      let memory = initBotMemory(...);
      // 翻开 me 的尾牌，值为9
      memory = updateMemoryOnReveal(memory, tailCardId, 9, { type: "player", playerId: "me" });

      const excluded = getExcludedNumbers(memory, "me");
      expect(excluded.has(10)).toBe(true);
      expect(excluded.has(12)).toBe(true);
      expect(excluded.has(9)).toBe(false);
    });
  });
});
```

### 5.4 单元测试 - 概率计算

```typescript
describe("Probability Calculation", () => {
  test("已知头值等于目标时概率应为 1.0", () => {
    let memory = initBotMemory(...);
    memory = updateMemoryOnReveal(memory, headCardId, 3, { type: "player", playerId: "me" });

    const prob = calculateProbability(memory, 3, { type: "player", playerId: "me", position: "head" });
    expect(prob).toBe(1.0);
  });

  test("已知头值不等于目标时概率应为 0.0", () => {
    let memory = initBotMemory(...);
    memory = updateMemoryOnReveal(memory, headCardId, 3, { type: "player", playerId: "me" });

    const prob = calculateProbability(memory, 5, { type: "player", playerId: "me", position: "head" });
    expect(prob).toBe(0.0);
  });

  test("公共区概率应正确计算", () => {
    let memory = initBotMemory(...);
    // 公共区8张，翻开1张是7
    memory = updateMemoryOnReveal(memory, publicCardId, 7, { type: "public" });
    // bot手中无7，其他位置无已知7

    // 剩余7: 3-1=2张，公共区未知牌: 7张
    // 但1张7已知在公共区，所以可能在未知公共牌中的7: 2-1=1张
    const prob = calculateProbability(memory, 7, { type: "public" });
    expect(prob).toBeCloseTo(1 / 7, 2);
  });

  test("目标数字已全部收集时概率应为 0", () => {
    let memory = initBotMemory(...);
    memory = updateMemoryOnCollect(memory, "me", 5);

    const prob = calculateProbability(memory, 5, { type: "player", playerId: "me", position: "head" });
    expect(prob).toBe(0);
  });

  test("目标数字被头尾约束排除时概率应为 0", () => {
    let memory = initBotMemory(...);
    // me 的头值是5，则不可能有1-4
    memory = updateMemoryOnReveal(memory, headCardId, 5, { type: "player", playerId: "me" });

    const prob = calculateProbability(memory, 3, { type: "player", playerId: "me", position: "tail" });
    expect(prob).toBe(0);
  });
});
```

### 5.5 单元测试 - 决策逻辑

```typescript
describe("Bot Decision Making", () => {
  describe("空链状态 (flip-1)", () => {
    test("应优先翻自己的头牌作为起点", () => {
      const memory = initBotMemory("bot-1", botHand, players, publicCards, ...);
      const decision = makeBotDecision(memory, [], players, publicCards);

      expect(decision.action).toBe("reveal-player-card");
      expect(decision.playerId).toBe("bot-1"); // 自己
      expect(decision.minMax).toBe("min"); // 头牌
    });

    test("当已知两处有相同数字时应利用这个信息", () => {
      let memory = initBotMemory(...);
      // me 头值=4, bot-2 头值=4
      memory = updateMemoryOnReveal(memory, meHeadId, 4, { type: "player", playerId: "me" });
      memory = updateMemoryOnReveal(memory, bot2HeadId, 4, { type: "player", playerId: "bot-2" });

      const decision = makeBotDecision(memory, [], players, publicCards);

      // 应该翻其中一个已知是4的头
      expect(decision.action).toBe("reveal-player-card");
      expect(["me", "bot-2"]).toContain(decision.playerId);
    });
  });

  describe("已翻1张状态 (flip-2)", () => {
    test("应优先选择确定性来源", () => {
      let memory = initBotMemory(...);
      // me 的尾值已知是6
      memory = updateMemoryOnReveal(memory, meTailId, 6, { type: "player", playerId: "me" });

      const currentChain = [{ id: "6-a", number: 6, isRevealed: true }];
      const decision = makeBotDecision(memory, currentChain, players, publicCards);

      expect(decision.action).toBe("reveal-player-card");
      expect(decision.playerId).toBe("me");
      expect(decision.minMax).toBe("max");
      expect(decision.confidence).toBe(1.0);
    });

    test("无确定性来源时应选择最高概率来源", () => {
      const memory = initBotMemory(...);
      const currentChain = [{ id: "8-a", number: 8, isRevealed: true }];
      const decision = makeBotDecision(memory, currentChain, players, publicCards);

      expect(decision.confidence).toBeLessThan(1.0);
      expect(decision.confidence).toBeGreaterThan(0);
    });
  });

  describe("已翻2张状态 (flip-3)", () => {
    test("有确定性第三张时应立即选择", () => {
      // bot手牌中有5
      const botHand = [
        { id: "3-a", number: 3 },
        { id: "5-c", number: 5 },
        { id: "9-a", number: 9 },
      ];
      let memory = initBotMemory("bot-1", botHand, ...);

      const currentChain = [
        { id: "5-a", number: 5, isRevealed: true },
        { id: "5-b", number: 5, isRevealed: true },
      ];
      const decision = makeBotDecision(memory, currentChain, players, publicCards);

      // bot知道自己有5，应该翻自己的牌
      expect(decision.action).toBe("reveal-player-card");
      expect(decision.playerId).toBe("bot-1");
    });

    test("应避免翻已知不匹配的来源", () => {
      let memory = initBotMemory(...);
      // me 的头值已知是3
      memory = updateMemoryOnReveal(memory, meHeadId, 3, { type: "player", playerId: "me" });

      const currentChain = [
        { id: "5-a", number: 5, isRevealed: true },
        { id: "5-b", number: 5, isRevealed: true },
      ];
      const decision = makeBotDecision(memory, currentChain, players, publicCards);

      // 不应该选择已知是3的头
      if (decision.action === "reveal-player-card" && decision.playerId === "me") {
        expect(decision.minMax).not.toBe("min");
      }
    });
  });
});
```

### 5.6 集成测试 - 游戏流程

```typescript
describe("Bot Game Flow Integration", () => {
  test("Bot 应能完成一个完整回合", async () => {
    const store = useLocalGameStore.getState();
    store.setBotCount(1);
    store.startGame();

    // 模拟轮到 bot
    store.nextTurn();

    // 等待 bot 执行
    await waitFor(
      () => {
        const state = useLocalGameStore.getState();
        return state.turnPhase === "failed" || state.turnPhase === "flip-1";
      },
      { timeout: 5000 }
    );

    // 验证游戏状态仍然有效
    const finalState = useLocalGameStore.getState();
    expect(finalState.gameStage).toBe("in-game");
  });

  test("Bot 记忆应在游戏过程中正确更新", async () => {
    const store = useLocalGameStore.getState();
    store.setBotCount(2);
    store.startGame();

    // 人类玩家翻一张牌
    store.revealPlayerCard("me", "min");

    await waitFor(() => {
      const state = useLocalGameStore.getState();
      const bot1Memory = state.botMemories.get("bot-1");
      // 检查 me 的头牌槽位是否已更新
      const meHand = bot1Memory?.otherPlayersHands.get("me");
      return meHand?.cards[0].number !== null;
    });

    const state = useLocalGameStore.getState();
    const bot1Memory = state.botMemories.get("bot-1");
    const meHeadValue = getKnownHeadValue(bot1Memory, "me");
    expect(meHeadValue).not.toBeNull();
  });

  test("Bot 成功收集三条后应继续回合", async () => {
    const store = useLocalGameStore.getState();
    // ... 设置特定游戏状态（确保 bot 能成功）...

    await store.executeBotTurn();

    const state = useLocalGameStore.getState();
    if (state.turnPhase === "flip-1") {
      // Bot 成功并继续
      expect(state.isCurrentPlayerBot()).toBe(true);
    }
  });
});
```

### 5.7 边界情况测试

```typescript
describe("Edge Cases", () => {
  test("当某数字只剩1张时不应以此为目标", () => {
    // bot 手中有 [3]，全局3只剩1张（不可能凑三条）
    const botHand = [{ id: "3-a", number: 3, isRevealed: false }];
    const memory = initBotMemory("bot-1", botHand, players, publicCards, ...);

    // getGlobalRemainingCount 应返回正确值
    expect(getGlobalRemainingCount(memory, 3)).toBe(2); // 3-1=2

    // 假设其他玩家收集了一套3
    const memory2 = updateMemoryOnCollect(memory, "me", 3);
    expect(getGlobalRemainingCount(memory2, 3)).toBe(0);

    // 决策时不应选择3作为目标
    const decision = makeBotDecision(memory2, [], players, publicCards);
    // ... 验证不会尝试翻3 ...
  });

  test("手牌有重复数字时应正确处理", () => {
    const botHand = [
      { id: "3-a", number: 3, isRevealed: false },
      { id: "3-b", number: 3, isRevealed: false },
      { id: "5-c", number: 5, isRevealed: false },
    ];
    const memory = initBotMemory("bot-1", botHand, players, publicCards, ...);

    // 手牌应正确记录
    expect(memory.myHand).toHaveLength(3);
    expect(memory.myHand[0].number).toBe(3);
    expect(memory.myHand[1].number).toBe(3);

    // 头尾值应正确
    expect(getKnownHeadValue(memory, "bot-1")).toBe(3);
    expect(getKnownTailValue(memory, "bot-1")).toBe(5);
  });

  test("所有玩家手牌为空时应只翻公共牌", () => {
    // 创建一个手牌全为空的情况
    const emptyPlayers = players.map((p) => ({ ...p, hand: [] }));
    const memory = initBotMemory("bot-1", [], emptyPlayers, publicCards, ...);

    const decision = makeBotDecision(memory, [], emptyPlayers, publicCards);

    expect(decision.action).toBe("reveal-public-card");
  });

  test("公共区为空时应只翻玩家牌", () => {
    const memory = initBotMemory("bot-1", botHand, players, [], ...);

    const decision = makeBotDecision(memory, [], players, []);

    expect(decision.action).toBe("reveal-player-card");
  });

  test("头牌被移除后下一张成为新的头", () => {
    let memory = initBotMemory(...);
    // 翻开 me 的头牌是3
    memory = updateMemoryOnReveal(memory, meHeadId, 3, { type: "player", playerId: "me" });
    expect(getKnownHeadValue(memory, "me")).toBe(3);

    // 收集3
    memory = updateMemoryOnCollect(memory, "someone", 3);

    // 头牌被移除，新头未知
    expect(getKnownHeadValue(memory, "me")).toBeNull();
  });
});
```

## 6. 实现步骤

### Phase 1: 基础数据结构 (bot-logic.ts)

1. 定义 `BotMemory`、`PlayerKnowledge`、`BotDecision` 接口
2. 实现 `initBotMemory()` 函数
3. 编写对应的单元测试

### Phase 2: 记忆更新逻辑 (bot-logic.ts)

1. 实现 `updateMemoryOnReveal()` 函数
2. 实现 `updateMemoryOnCollect()` 函数
3. 实现约束推理逻辑（头尾约束、排除数字）
4. 编写对应的单元测试

### Phase 3: 概率计算 (bot-logic.ts)

1. 实现 `calculateProbability()` 函数
2. 实现公共区概率计算
3. 实现玩家端概率计算（考虑约束）
4. 编写对应的单元测试

### Phase 4: 决策引擎 (bot-logic.ts)

1. 实现 `evaluateAction()` 期望收益计算
2. 实现 `makeBotDecision()` 主决策函数
3. 实现各优先级策略
4. 编写对应的单元测试

### Phase 5: Store 集成 (local-game-store.tsx)

1. 添加 `botMemories` 到状态
2. 修改 `startGame()` 初始化记忆
3. 修改 `revealPlayerCard()` 和 `revealPublicCard()` 更新记忆
4. 修改 `processTurnResult()` 在收集时更新记忆
5. 完善 `executeBotTurn()` 调用决策逻辑
6. 编写集成测试

### Phase 6: 调优与完善

1. 添加决策日志输出（开发模式）
2. 性能优化（如果需要）
3. 边界情况处理
4. 端到端测试

## 7. 注意事项

1. **不可变数据**: 使用 Immer 确保状态更新的不可变性
2. **Map/Set 支持**: 已启用 `enableMapSet()`，可以在 Immer 中使用
3. **异步处理**: Bot 决策需要适当的延迟以便用户能看到动画
4. **内存管理**: 翻牌历史可能需要限制长度或在游戏结束时清理
5. **概率计算精度**: 使用适当的数值精度，避免浮点数比较问题

## 8. 导出接口

```typescript
// src/lib/bot-logic.ts 导出

export {
  // Types
  CardSlot,
  PlayerHandMemory,
  BotMemory,
  BotDecision,
  ActionCandidate,

  // Memory Management
  initBotMemory,
  updateMemoryOnReveal,
  updateMemoryOnCollect,

  // Derived Calculations (Pure Functions)
  getKnownHeadValue,
  getKnownTailValue,
  getHandSize,
  getGlobalRemainingCount,
  getExcludedNumbers,
  getUnknownPublicCount,

  // Decision Making
  calculateProbability,
  evaluateAllActions,
  makeBotDecision,
};
```

## 9. 设计总结

### 数据流

```
游戏事件 → updateMemoryOnReveal / updateMemoryOnCollect → 更新原始数据
                                                              ↓
                                         派生计算函数（getKnownHeadValue 等）
                                                              ↓
                                           calculateProbability → makeBotDecision
```

### 优势

1. **数据一致性**：只有一份原始数据，派生数据通过计算得出，不会不一致
2. **易于调试**：可以直接查看原始数据结构，理解 bot 的"视角"
3. **易于测试**：派生计算是纯函数，易于单元测试
4. **易于扩展**：添加新的派生计算不需要修改数据结构
