import { describe, test, expect } from "vitest";
import { Card, Player } from "@/types";
import {
  BotMemory,
  CardSlot,
  initBotMemory,
  updateMemoryOnReveal,
  updateMemoryOnCollect,
  getKnownHeadValue,
  getKnownTailValue,
  getHandSize,
  getGlobalRemainingCount,
  getExcludedNumbers,
  getUnknownPublicCount,
  getKnownPublicCountForNumber,
  calculateProbability,
  makeBotDecision,
  getNumberRangeForPlayerCount,
  getAllPossibleActions,
  evaluateAllActions,
} from "../bot-logic";

// Helper functions to create test data
function createCard(id: string, number: number, isRevealed = false): Card {
  return { id, number, isRevealed };
}

function createPlayer(
  id: string,
  hand: Card[],
  options: Partial<Player> = {}
): Player {
  return {
    id,
    name: id,
    seat: 1,
    isHost: false,
    isPlaying: false,
    hand,
    collection: [],
    ...options,
  };
}

function createTestPlayers(): Player[] {
  return [
    createPlayer("me", [
      createCard("2-a", 2),
      createCard("5-b", 5),
      createCard("8-c", 8),
    ]),
    createPlayer("bot-1", [
      createCard("3-a", 3),
      createCard("6-b", 6),
      createCard("9-c", 9),
    ]),
    createPlayer("bot-2", [
      createCard("4-a", 4),
      createCard("7-b", 7),
      createCard("10-c", 10),
    ]),
  ];
}

function createTestPublicCards(): Card[] {
  return [
    createCard("1-a", 1),
    createCard("1-b", 1),
    createCard("11-a", 11),
    createCard("12-a", 12),
  ];
}

// ==================== Memory Initialization Tests ====================

describe("BotMemory Initialization", () => {
  const players = createTestPlayers();
  const publicCards = createTestPublicCards();
  const botHand = players[1].hand; // bot-1's hand

  test("应正确初始化 bot 自己的手牌（完整已知）", () => {
    const memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    expect(memory.myHand).toHaveLength(3);
    expect(memory.myHand[0]).toEqual({ cardId: "3-a", number: 3 });
    expect(memory.myHand[1]).toEqual({ cardId: "6-b", number: 6 });
    expect(memory.myHand[2]).toEqual({ cardId: "9-c", number: 9 });
  });

  test("应正确初始化其他玩家手牌（全部未知）", () => {
    const memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    const meHand = memory.otherPlayersHands.get("me");
    expect(meHand?.cards).toHaveLength(3);
    expect(meHand?.cards.every((slot) => slot.number === null)).toBe(true);

    const bot2Hand = memory.otherPlayersHands.get("bot-2");
    expect(bot2Hand?.cards).toHaveLength(3);
    expect(bot2Hand?.cards.every((slot) => slot.number === null)).toBe(true);
  });

  test("应正确初始化公共区牌（全部未知）", () => {
    const memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    expect(memory.publicCards).toHaveLength(4);
    expect(memory.publicCards.every((slot) => slot.number === null)).toBe(true);
  });

  test("应正确设置数字范围", () => {
    const memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 10 }
    );

    expect(memory.numberRange).toEqual({ min: 1, max: 10 });
  });

  test("应初始化为空的收集记录", () => {
    const memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    expect(memory.collectedSets.size).toBe(0);
  });
});

// ==================== Memory Update Tests ====================

describe("Memory Update on Reveal", () => {
  const players = createTestPlayers();
  const publicCards = createTestPublicCards();
  const botHand = players[1].hand;

  test("翻开其他玩家牌时应更新对应槽位的 number", () => {
    let memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );
    const cardId = memory.otherPlayersHands.get("me")?.cards[0].cardId!;

    memory = updateMemoryOnReveal(memory, cardId, 2, {
      type: "player",
      playerId: "me",
    });

    expect(memory.otherPlayersHands.get("me")?.cards[0].number).toBe(2);
  });

  test("翻开公共牌时应更新对应槽位的 number", () => {
    let memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );
    const cardId = memory.publicCards[0].cardId;

    memory = updateMemoryOnReveal(memory, cardId, 1, { type: "public" });

    expect(memory.publicCards[0].number).toBe(1);
  });

  test("更新应该是不可变的（返回新对象）", () => {
    const memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );
    const cardId = memory.publicCards[0].cardId;
    const newMemory = updateMemoryOnReveal(memory, cardId, 1, { type: "public" });

    expect(newMemory).not.toBe(memory);
    expect(newMemory.publicCards).not.toBe(memory.publicCards);
    expect(memory.publicCards[0].number).toBeNull(); // 原对象未改变
    expect(newMemory.publicCards[0].number).toBe(1); // 新对象已改变
  });

  test("翻开自己的牌时应正确更新（理论上已知）", () => {
    let memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    memory = updateMemoryOnReveal(memory, "3-a", 3, {
      type: "player",
      playerId: "bot-1",
    });

    expect(memory.myHand[0].number).toBe(3);
  });
});

describe("Memory Update on Collect", () => {
  const players = createTestPlayers();
  const publicCards = createTestPublicCards();
  const botHand = players[1].hand;

  test("收集三条后应记录收集", () => {
    let memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    memory = updateMemoryOnCollect(memory, "me", 5);

    expect(memory.collectedSets.get("me")).toContain(5);
  });

  test("收集后应从自己手牌移除该数字的牌", () => {
    let memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );
    const initialLength = memory.myHand.length;

    // bot-1 手牌中没有5，所以不变
    memory = updateMemoryOnCollect(memory, "me", 5);
    expect(memory.myHand.length).toBe(initialLength);

    // bot-1 手牌中有3
    memory = updateMemoryOnCollect(memory, "me", 3);
    expect(memory.myHand.length).toBe(initialLength - 1);
    expect(memory.myHand.find((s) => s.number === 3)).toBeUndefined();
  });

  test("收集后其他玩家已知的该数字牌也应被移除", () => {
    let memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    // 先翻开一张牌使其已知
    const cardId = memory.otherPlayersHands.get("me")?.cards[0].cardId!;
    memory = updateMemoryOnReveal(memory, cardId, 2, {
      type: "player",
      playerId: "me",
    });

    // 收集2
    memory = updateMemoryOnCollect(memory, "someone", 2);

    // me 手牌中已知的2被移除
    const meCards = memory.otherPlayersHands.get("me")?.cards;
    expect(meCards?.find((s) => s.number === 2)).toBeUndefined();
  });

  test("收集后公共区已知的该数字牌也应被移除", () => {
    let memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    // 先翻开公共牌使其已知
    memory = updateMemoryOnReveal(memory, memory.publicCards[0].cardId, 1, {
      type: "public",
    });

    // 收集1
    memory = updateMemoryOnCollect(memory, "someone", 1);

    // 公共区已知的1被移除
    expect(memory.publicCards.find((s) => s.number === 1)).toBeUndefined();
  });

  test("收集是不可变操作", () => {
    const memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );
    const newMemory = updateMemoryOnCollect(memory, "me", 3);

    expect(newMemory).not.toBe(memory);
    expect(newMemory.collectedSets).not.toBe(memory.collectedSets);
    expect(memory.collectedSets.size).toBe(0);
    expect(newMemory.collectedSets.size).toBe(1);
  });
});

// ==================== Derived Calculations Tests ====================

describe("Derived Calculations", () => {
  describe("getKnownHeadValue / getKnownTailValue", () => {
    const players = createTestPlayers();
    const publicCards = createTestPublicCards();
    const botHand = players[1].hand;

    test("自己的头尾值总是已知", () => {
      const memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      expect(getKnownHeadValue(memory, "bot-1")).toBe(3);
      expect(getKnownTailValue(memory, "bot-1")).toBe(9);
    });

    test("其他玩家未翻牌时头尾值为 null", () => {
      const memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      expect(getKnownHeadValue(memory, "me")).toBeNull();
      expect(getKnownTailValue(memory, "me")).toBeNull();
    });

    test("翻开头牌后 knownHeadValue 应返回该值", () => {
      let memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );
      const headCardId = memory.otherPlayersHands.get("me")?.cards[0].cardId!;
      memory = updateMemoryOnReveal(memory, headCardId, 2, {
        type: "player",
        playerId: "me",
      });

      expect(getKnownHeadValue(memory, "me")).toBe(2);
    });

    test("翻开尾牌后 knownTailValue 应返回该值", () => {
      let memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );
      const meCards = memory.otherPlayersHands.get("me")?.cards!;
      const tailCardId = meCards[meCards.length - 1].cardId;
      memory = updateMemoryOnReveal(memory, tailCardId, 8, {
        type: "player",
        playerId: "me",
      });

      expect(getKnownTailValue(memory, "me")).toBe(8);
    });

    test("空手牌时返回 null", () => {
      const emptyPlayers = [
        createPlayer("me", []),
        createPlayer("bot-1", [createCard("3-a", 3)]),
      ];
      const memory = initBotMemory(
        "bot-1",
        [createCard("3-a", 3)],
        emptyPlayers,
        publicCards,
        { min: 1, max: 12 }
      );

      expect(getKnownHeadValue(memory, "me")).toBeNull();
      expect(getKnownTailValue(memory, "me")).toBeNull();
    });
  });

  describe("getHandSize", () => {
    const players = createTestPlayers();
    const publicCards = createTestPublicCards();
    const botHand = players[1].hand;

    test("应返回正确的手牌数量", () => {
      const memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      expect(getHandSize(memory, "bot-1")).toBe(3);
      expect(getHandSize(memory, "me")).toBe(3);
    });

    test("收集后手牌数量应减少", () => {
      let memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );
      const before = getHandSize(memory, "bot-1");

      memory = updateMemoryOnCollect(memory, "me", 3); // bot-1 有一张3

      expect(getHandSize(memory, "bot-1")).toBe(before - 1);
    });

    test("不存在的玩家返回 0", () => {
      const memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      expect(getHandSize(memory, "non-existent")).toBe(0);
    });
  });

  describe("getGlobalRemainingCount", () => {
    const players = createTestPlayers();
    const publicCards = createTestPublicCards();
    const botHand = players[1].hand;

    test("初始时每个数字剩余 3 - 自己手中的数量", () => {
      // bot-1 手牌：[3, 6, 9]
      const memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      expect(getGlobalRemainingCount(memory, 3)).toBe(2); // 3-1=2
      expect(getGlobalRemainingCount(memory, 6)).toBe(2); // 3-1=2
      expect(getGlobalRemainingCount(memory, 1)).toBe(3); // 未知位置
    });

    test("收集后该数字剩余为 0", () => {
      let memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );
      memory = updateMemoryOnCollect(memory, "me", 5);

      expect(getGlobalRemainingCount(memory, 5)).toBe(0);
    });

    test("翻开牌后剩余数量应正确更新", () => {
      let memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      // 翻开一张公共牌是 1
      memory = updateMemoryOnReveal(memory, memory.publicCards[0].cardId, 1, {
        type: "public",
      });

      // 现在1剩余2张
      expect(getGlobalRemainingCount(memory, 1)).toBe(2);
    });
  });

  describe("getExcludedNumbers", () => {
    const players = createTestPlayers();
    const publicCards = createTestPublicCards();
    const botHand = players[1].hand;

    test("已知头值后应排除更小的数字", () => {
      let memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );
      const headCardId = memory.otherPlayersHands.get("me")?.cards[0].cardId!;
      memory = updateMemoryOnReveal(memory, headCardId, 5, {
        type: "player",
        playerId: "me",
      });

      const excluded = getExcludedNumbers(memory, "me");
      expect(excluded.has(1)).toBe(true);
      expect(excluded.has(4)).toBe(true);
      expect(excluded.has(5)).toBe(false); // 5本身不排除
      expect(excluded.has(6)).toBe(false);
    });

    test("已知尾值后应排除更大的数字", () => {
      let memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );
      const meCards = memory.otherPlayersHands.get("me")?.cards!;
      const tailCardId = meCards[meCards.length - 1].cardId;
      memory = updateMemoryOnReveal(memory, tailCardId, 9, {
        type: "player",
        playerId: "me",
      });

      const excluded = getExcludedNumbers(memory, "me");
      expect(excluded.has(10)).toBe(true);
      expect(excluded.has(12)).toBe(true);
      expect(excluded.has(9)).toBe(false);
      expect(excluded.has(8)).toBe(false);
    });

    test("自己的排除数字基于实际手牌范围", () => {
      // bot-1 手牌：[3, 6, 9]
      const memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      const excluded = getExcludedNumbers(memory, "bot-1");
      expect(excluded.has(1)).toBe(true); // < 3
      expect(excluded.has(2)).toBe(true); // < 3
      expect(excluded.has(3)).toBe(false); // = 头
      expect(excluded.has(10)).toBe(true); // > 9
      expect(excluded.has(9)).toBe(false); // = 尾
    });
  });

  describe("getUnknownPublicCount", () => {
    const players = createTestPlayers();
    const publicCards = createTestPublicCards();
    const botHand = players[1].hand;

    test("初始时所有公共牌都未知", () => {
      const memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      expect(getUnknownPublicCount(memory)).toBe(4);
    });

    test("翻开公共牌后未知数量减少", () => {
      let memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      memory = updateMemoryOnReveal(memory, memory.publicCards[0].cardId, 1, {
        type: "public",
      });

      expect(getUnknownPublicCount(memory)).toBe(3);
    });
  });

  describe("getKnownPublicCountForNumber", () => {
    const players = createTestPlayers();
    const publicCards = createTestPublicCards();
    const botHand = players[1].hand;

    test("初始时所有数字在公共区的已知数量为 0", () => {
      const memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      expect(getKnownPublicCountForNumber(memory, 1)).toBe(0);
      expect(getKnownPublicCountForNumber(memory, 5)).toBe(0);
    });

    test("翻开公共牌后应正确计数", () => {
      let memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      // 翻开两张1
      memory = updateMemoryOnReveal(memory, memory.publicCards[0].cardId, 1, {
        type: "public",
      });
      memory = updateMemoryOnReveal(memory, memory.publicCards[1].cardId, 1, {
        type: "public",
      });

      expect(getKnownPublicCountForNumber(memory, 1)).toBe(2);
    });
  });
});

// ==================== Probability Calculation Tests ====================

describe("Probability Calculation", () => {
  const players = createTestPlayers();
  const publicCards = createTestPublicCards();
  const botHand = players[1].hand;

  test("已知头值等于目标时概率应为 1.0", () => {
    let memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );
    const headCardId = memory.otherPlayersHands.get("me")?.cards[0].cardId!;
    memory = updateMemoryOnReveal(memory, headCardId, 2, {
      type: "player",
      playerId: "me",
    });

    const prob = calculateProbability(memory, 2, {
      type: "player",
      playerId: "me",
      position: "head",
    });
    expect(prob).toBe(1.0);
  });

  test("已知头值不等于目标时概率应为 0.0", () => {
    let memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );
    const headCardId = memory.otherPlayersHands.get("me")?.cards[0].cardId!;
    memory = updateMemoryOnReveal(memory, headCardId, 2, {
      type: "player",
      playerId: "me",
    });

    const prob = calculateProbability(memory, 5, {
      type: "player",
      playerId: "me",
      position: "head",
    });
    expect(prob).toBe(0.0);
  });

  test("目标数字已全部收集时概率应为 0", () => {
    let memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );
    memory = updateMemoryOnCollect(memory, "me", 5);

    const prob = calculateProbability(memory, 5, {
      type: "player",
      playerId: "me",
      position: "head",
    });
    expect(prob).toBe(0);
  });

  test("目标数字被头约束排除时概率应为 0", () => {
    let memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );
    // me 的头值是5，则不可能有1-4
    const headCardId = memory.otherPlayersHands.get("me")?.cards[0].cardId!;
    memory = updateMemoryOnReveal(memory, headCardId, 5, {
      type: "player",
      playerId: "me",
    });

    const prob = calculateProbability(memory, 3, {
      type: "player",
      playerId: "me",
      position: "tail",
    });
    expect(prob).toBe(0);
  });

  test("自己的头尾概率应正确计算", () => {
    // bot-1 手牌：[3, 6, 9]
    const memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    // 自己头是3
    expect(
      calculateProbability(memory, 3, {
        type: "player",
        playerId: "bot-1",
        position: "head",
      })
    ).toBe(1.0);

    expect(
      calculateProbability(memory, 5, {
        type: "player",
        playerId: "bot-1",
        position: "head",
      })
    ).toBe(0.0);

    // 自己尾是9
    expect(
      calculateProbability(memory, 9, {
        type: "player",
        playerId: "bot-1",
        position: "tail",
      })
    ).toBe(1.0);
  });

  test("公共区概率应正确计算", () => {
    let memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    // 公共区4张，翻开1张是1
    memory = updateMemoryOnReveal(memory, memory.publicCards[0].cardId, 1, {
      type: "public",
    });

    // 1 剩余2张（已知1张在公共区），可能在剩余3张未知公共牌中的概率
    const prob = calculateProbability(memory, 1, { type: "public" });
    expect(prob).toBeGreaterThan(0);
    expect(prob).toBeLessThanOrEqual(1);
  });
});

// ==================== Decision Making Tests ====================

describe("Bot Decision Making", () => {
  describe("空链状态 (flip-1)", () => {
    test("应优先翻自己的头牌作为起点", () => {
      const players = createTestPlayers();
      const publicCards = createTestPublicCards();
      const botHand = players[1].hand;

      const memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );
      const decision = makeBotDecision(memory, [], players, publicCards);

      expect(decision.action).toBe("reveal-player-card");
      expect(decision.playerId).toBe("bot-1"); // 自己
      expect(decision.minMax).toBe("min"); // 头牌
    });

    test("当已知两处有相同数字时应利用这个信息", () => {
      const players = createTestPlayers();
      const publicCards = createTestPublicCards();
      const botHand = players[1].hand;

      let memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      // 设置 me 头值=4, bot-2 头值=4
      const meHeadId = memory.otherPlayersHands.get("me")?.cards[0].cardId!;
      const bot2HeadId = memory.otherPlayersHands.get("bot-2")?.cards[0].cardId!;
      memory = updateMemoryOnReveal(memory, meHeadId, 4, {
        type: "player",
        playerId: "me",
      });
      memory = updateMemoryOnReveal(memory, bot2HeadId, 4, {
        type: "player",
        playerId: "bot-2",
      });

      const decision = makeBotDecision(memory, [], players, publicCards);

      // 应该翻其中一个已知是4的头
      expect(decision.action).toBe("reveal-player-card");
      expect(["me", "bot-2"]).toContain(decision.playerId);
      expect(decision.confidence).toBe(1.0);
    });
  });

  describe("已翻1张状态 (flip-2)", () => {
    test("应优先选择确定性来源", () => {
      const players = createTestPlayers();
      const publicCards = createTestPublicCards();
      const botHand = players[1].hand;

      let memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      // me 的头值已知是6
      const meHeadId = memory.otherPlayersHands.get("me")?.cards[0].cardId!;
      memory = updateMemoryOnReveal(memory, meHeadId, 6, {
        type: "player",
        playerId: "me",
      });

      // 当前链有一张6
      const currentChain = [createCard("6-x", 6, true)];
      const decision = makeBotDecision(memory, currentChain, players, publicCards);

      expect(decision.action).toBe("reveal-player-card");
      expect(decision.playerId).toBe("me");
      expect(decision.minMax).toBe("min");
      expect(decision.confidence).toBe(1.0);
    });
  });

  describe("已翻2张状态 (flip-3)", () => {
    test("有确定性第三张时应立即选择（目标在头或尾）", () => {
      // bot手牌中头牌是5
      const customBotHand = [
        createCard("5-a", 5),
        createCard("7-c", 7),
        createCard("9-a", 9),
      ];
      const players = [
        createPlayer("me", [
          createCard("2-a", 2),
          createCard("6-b", 6),
          createCard("8-c", 8),
        ]),
        createPlayer("bot-1", customBotHand),
      ];
      const publicCards = createTestPublicCards();

      const memory = initBotMemory(
        "bot-1",
        customBotHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      const currentChain = [
        createCard("5-x", 5, true),
        createCard("5-y", 5, true),
      ];
      const decision = makeBotDecision(memory, currentChain, players, publicCards);

      // bot知道自己头牌是5，应该翻自己的头牌
      expect(decision.action).toBe("reveal-player-card");
      expect(decision.playerId).toBe("bot-1");
      expect(decision.minMax).toBe("min");
      expect(decision.confidence).toBe(1.0);
    });

    test("当目标在自己的尾牌时应翻尾牌", () => {
      // bot手牌中尾牌是5
      const customBotHand = [
        createCard("3-a", 3),
        createCard("4-c", 4),
        createCard("5-a", 5),
      ];
      const players = [
        createPlayer("me", [
          createCard("2-a", 2),
          createCard("6-b", 6),
          createCard("8-c", 8),
        ]),
        createPlayer("bot-1", customBotHand),
      ];
      const publicCards = createTestPublicCards();

      const memory = initBotMemory(
        "bot-1",
        customBotHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      const currentChain = [
        createCard("5-x", 5, true),
        createCard("5-y", 5, true),
      ];
      const decision = makeBotDecision(memory, currentChain, players, publicCards);

      // bot知道自己尾牌是5，应该翻自己的尾牌
      expect(decision.action).toBe("reveal-player-card");
      expect(decision.playerId).toBe("bot-1");
      expect(decision.minMax).toBe("max");
      expect(decision.confidence).toBe(1.0);
    });

    test("应避免翻已知不匹配的来源", () => {
      const players = createTestPlayers();
      const publicCards = createTestPublicCards();
      const botHand = players[1].hand;

      let memory = initBotMemory(
        "bot-1",
        botHand,
        players,
        publicCards,
        { min: 1, max: 12 }
      );

      // me 的头值已知是2
      const meHeadId = memory.otherPlayersHands.get("me")?.cards[0].cardId!;
      memory = updateMemoryOnReveal(memory, meHeadId, 2, {
        type: "player",
        playerId: "me",
      });

      const currentChain = [
        createCard("5-a", 5, true),
        createCard("5-b", 5, true),
      ];
      const decision = makeBotDecision(memory, currentChain, players, publicCards);

      // 不应该选择已知是2的头
      if (
        decision.action === "reveal-player-card" &&
        decision.playerId === "me"
      ) {
        expect(decision.minMax).not.toBe("min");
      }
    });
  });
});

// ==================== Number Range Tests ====================

describe("getNumberRangeForPlayerCount", () => {
  test("2人局应去掉11、12", () => {
    expect(getNumberRangeForPlayerCount(2)).toEqual({ min: 1, max: 10 });
  });

  test("3人局应去掉12", () => {
    expect(getNumberRangeForPlayerCount(3)).toEqual({ min: 1, max: 11 });
  });

  test("4-6人局应使用全部数字", () => {
    expect(getNumberRangeForPlayerCount(4)).toEqual({ min: 1, max: 12 });
    expect(getNumberRangeForPlayerCount(5)).toEqual({ min: 1, max: 12 });
    expect(getNumberRangeForPlayerCount(6)).toEqual({ min: 1, max: 12 });
  });
});

// ==================== Edge Cases Tests ====================

describe("Edge Cases", () => {
  test("手牌有重复数字时应正确处理", () => {
    const duplicateHand = [
      createCard("3-a", 3),
      createCard("3-b", 3),
      createCard("5-c", 5),
    ];
    const players = [
      createPlayer("me", [createCard("2-a", 2)]),
      createPlayer("bot-1", duplicateHand),
    ];
    const publicCards = createTestPublicCards();

    const memory = initBotMemory(
      "bot-1",
      duplicateHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    // 手牌应正确记录
    expect(memory.myHand).toHaveLength(3);
    expect(memory.myHand[0].number).toBe(3);
    expect(memory.myHand[1].number).toBe(3);

    // 头尾值应正确
    expect(getKnownHeadValue(memory, "bot-1")).toBe(3);
    expect(getKnownTailValue(memory, "bot-1")).toBe(5);
  });

  test("所有玩家手牌为空时应只翻公共牌", () => {
    const emptyPlayers = [
      createPlayer("me", []),
      createPlayer("bot-1", []),
    ];
    const publicCards = createTestPublicCards();

    const memory = initBotMemory(
      "bot-1",
      [],
      emptyPlayers,
      publicCards,
      { min: 1, max: 12 }
    );

    const decision = makeBotDecision(memory, [], emptyPlayers, publicCards);

    expect(decision.action).toBe("reveal-public-card");
  });

  test("头牌被移除后下一张成为新的头", () => {
    const players = createTestPlayers();
    const publicCards = createTestPublicCards();
    const botHand = players[1].hand;

    let memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    // 翻开 me 的头牌是2
    const meHeadId = memory.otherPlayersHands.get("me")?.cards[0].cardId!;
    memory = updateMemoryOnReveal(memory, meHeadId, 2, {
      type: "player",
      playerId: "me",
    });
    expect(getKnownHeadValue(memory, "me")).toBe(2);

    // 收集2
    memory = updateMemoryOnCollect(memory, "someone", 2);

    // 头牌被移除，新头未知
    expect(getKnownHeadValue(memory, "me")).toBeNull();
  });

  test("getAllPossibleActions 应返回所有可能行动", () => {
    const players = createTestPlayers();
    const publicCards = createTestPublicCards();
    const botHand = players[1].hand;

    const memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    const actions = getAllPossibleActions(memory, players, publicCards);

    // 应该有玩家头尾和公共牌的行动
    expect(actions.length).toBeGreaterThan(0);
    expect(actions.some((a) => a.action === "reveal-player-card")).toBe(true);
    expect(actions.some((a) => a.action === "reveal-public-card")).toBe(true);
  });

  test("evaluateAllActions 应返回排序后的候选行动", () => {
    const players = createTestPlayers();
    const publicCards = createTestPublicCards();
    const botHand = players[1].hand;

    const memory = initBotMemory(
      "bot-1",
      botHand,
      players,
      publicCards,
      { min: 1, max: 12 }
    );

    const candidates = evaluateAllActions(memory, [], players, publicCards);

    expect(candidates.length).toBeGreaterThan(0);
    // 应该按期望收益排序
    for (let i = 1; i < candidates.length; i++) {
      expect(candidates[i - 1].expectedValue).toBeGreaterThanOrEqual(
        candidates[i].expectedValue
      );
    }
  });
});

