import { Card, Player } from "@/types";
import { sortByIdAsc, sortByIdDesc } from "@/lib/game-helper";

/**
 * Bot Memory Structure - Perfect memory of all seen cards
 * Based on PRD: 机器人完美记忆所有历史翻牌信息
 */
export interface BotMemory {
  // self_hand: Bot's own hand values (sorted)
  selfHand: number[];
  // player_states: player_id -> {hand_size, known_head, known_tail}
  playerStates: Map<
    string,
    {
      handSize: number;
      knownHead: number | null;
      knownTail: number | null;
    }
  >;
  // center_size: Remaining public cards count
  centerSize: number;
  // remaining_counts: Each number's remaining count (initially 3)
  remainingCounts: Map<number, number>;
  // own_sets: Bot's collected set numbers
  ownSets: number[];
  // opponent_sets: opponent_id -> collected set numbers
  opponentSets: Map<string, number[]>;
  // Last seen card at each public card position: index -> cardNumber | null
  lastSeenPublic: Map<number, number | null>;
  // ALL numbers ever seen at head position for each player (perfect memory)
  seenAtHead: Map<string, Set<number>>;
  // ALL numbers ever seen at tail position for each player (perfect memory)
  seenAtTail: Map<string, Set<number>>;
}

/**
 * Card position for bot decision
 */
export interface CardPosition {
  type: "player-head" | "player-tail" | "public";
  playerId?: string;
  cardId?: string;
  publicIndex?: number;
}

/**
 * Sum-7 pairs for winning condition: A+B=7 or |A-B|=7
 */
const SUM_7_PAIRS: [number, number][] = [
  [1, 6], // 1+6=7
  [2, 5], // 2+5=7
  [3, 4], // 3+4=7
  [1, 8], // 8-1=7
  [2, 9], // 9-2=7
  [3, 10], // 10-3=7
  [4, 11], // 11-4=7
  [5, 12], // 12-5=7
];

/**
 * Create initial bot memory
 */
export function createBotMemory(): BotMemory {
  // Initialize remaining counts (1-12, each has 3 cards)
  const remainingCounts = new Map<number, number>();
  for (let i = 1; i <= 12; i++) {
    remainingCounts.set(i, 3);
  }

  return {
    selfHand: [],
    playerStates: new Map(),
    centerSize: 0,
    remainingCounts,
    ownSets: [],
    opponentSets: new Map(),
    lastSeenPublic: new Map(),
    seenAtHead: new Map(),
    seenAtTail: new Map(),
  };
}

/**
 * Initialize bot memory with game state
 */
export function initializeBotMemory(
  memory: BotMemory,
  players: Player[],
  publicCards: Card[],
  botId: string
): void {
  // Initialize player states
  for (const player of players) {
    const handSize = player.hand?.length || 0;
    memory.playerStates.set(player.id, {
      handSize,
      knownHead: null,
      knownTail: null,
    });

    // If this is the bot, store self hand
    if (player.id === botId && player.hand) {
      memory.selfHand = player.hand.map((c) => c.number).sort((a, b) => a - b);
    }

    // Initialize opponent sets
    if (player.id !== botId) {
      memory.opponentSets.set(player.id, []);
    }
  }

  // Initialize center size
  memory.centerSize = publicCards.filter((c) => c.id).length;
}

/**
 * Update bot memory after a card flip (when card is revealed but not collected)
 */
export function updateBotMemory(
  memory: BotMemory,
  position: CardPosition,
  cardNumber: number
): void {
  if (position.type === "player-head" && position.playerId) {
    const state = memory.playerStates.get(position.playerId);
    if (state) {
      state.knownHead = cardNumber;
    }
    // Also track in seenAtHead (perfect memory - never forget)
    let seenSet = memory.seenAtHead.get(position.playerId);
    if (!seenSet) {
      seenSet = new Set<number>();
      memory.seenAtHead.set(position.playerId, seenSet);
    }
    seenSet.add(cardNumber);
  } else if (position.type === "player-tail" && position.playerId) {
    const state = memory.playerStates.get(position.playerId);
    if (state) {
      state.knownTail = cardNumber;
    }
    // Also track in seenAtTail (perfect memory - never forget)
    let seenSet = memory.seenAtTail.get(position.playerId);
    if (!seenSet) {
      seenSet = new Set<number>();
      memory.seenAtTail.set(position.playerId, seenSet);
    }
    seenSet.add(cardNumber);
  } else if (position.type === "public" && position.publicIndex !== undefined) {
    memory.lastSeenPublic.set(position.publicIndex, cardNumber);
  }
}

/**
 * Update hand sizes in memory
 * Also initializes player states if they don't exist
 */
export function updateHandSizes(memory: BotMemory, players: Player[]): void {
  players.forEach((p) => {
    const handSize = p.hand?.length || 0;
    let state = memory.playerStates.get(p.id);
    if (state) {
      state.handSize = handSize;
    } else {
      // Initialize player state if it doesn't exist
      memory.playerStates.set(p.id, {
        handSize,
        knownHead: null,
        knownTail: null,
      });
    }
  });

  // Update center size if public cards info available
  // This is handled separately when needed
}

/**
 * Clear memory for positions that have been collected (cards removed)
 * Called after a successful collection
 */
export function clearCollectedCards(
  memory: BotMemory,
  collectedNumber: number,
  players: Player[],
  publicCards: Card[],
  collectorId?: string,
  botId?: string
): void {
  // Update remaining counts
  const currentCount = memory.remainingCounts.get(collectedNumber) || 0;
  memory.remainingCounts.set(collectedNumber, Math.max(0, currentCount - 3));

  // Update own_sets or opponent_sets (only if both IDs provided)
  if (collectorId && botId) {
    if (collectorId === botId) {
      memory.ownSets.push(collectedNumber);
    } else {
      const opponentSets = memory.opponentSets.get(collectorId) || [];
      opponentSets.push(collectedNumber);
      memory.opponentSets.set(collectorId, opponentSets);
    }
  }

  // Clear from player head/tail if the card at that position was collected
  players.forEach((p) => {
    const state = memory.playerStates.get(p.id);
    if (state) {
      if (state.knownHead === collectedNumber) {
        state.knownHead = null;
      }
      if (state.knownTail === collectedNumber) {
        state.knownTail = null;
      }
      // Update hand size
      state.handSize = p.hand?.length || 0;
    }
    // Also remove from seenAtHead/seenAtTail since those cards are now collected
    const seenHead = memory.seenAtHead.get(p.id);
    if (seenHead) {
      seenHead.delete(collectedNumber);
    }
    const seenTail = memory.seenAtTail.get(p.id);
    if (seenTail) {
      seenTail.delete(collectedNumber);
    }
  });

  // Clear from public cards
  publicCards.forEach((card, index) => {
    if (!card.id || memory.lastSeenPublic.get(index) === collectedNumber) {
      memory.lastSeenPublic.set(index, null);
    }
  });

  // Update center size
  memory.centerSize = publicCards.filter((c) => c.id).length;

  // Update self hand if bot collected
  if (collectorId === botId) {
    memory.selfHand = memory.selfHand.filter((n) => n !== collectedNumber);
  }
}

/**
 * Get current extreme values (min and max of remaining cards)
 */
function getCurrentExtremes(remainingCounts: Map<number, number>): {
  minV: number;
  maxV: number;
} {
  let minV = 12;
  let maxV = 1;
  for (let i = 1; i <= 12; i++) {
    if ((remainingCounts.get(i) || 0) > 0) {
      if (i < minV) minV = i;
      if (i > maxV) maxV = i;
    }
  }
  return { minV, maxV };
}

/**
 * Check if a number is extreme (equals current min or max)
 */
function isExtreme(num: number, remainingCounts: Map<number, number>): boolean {
  const { minV, maxV } = getCurrentExtremes(remainingCounts);
  return num === minV || num === maxV;
}

/**
 * Get complement numbers for win condition (A+B=7 or |A-B|=7)
 */
function getComplementNumbers(num: number): number[] {
  const complements: number[] = [];
  for (const [a, b] of SUM_7_PAIRS) {
    if (a === num) complements.push(b);
    if (b === num) complements.push(a);
  }
  return complements;
}

/**
 * Bot decision result
 */
export interface BotDecision {
  action: "reveal-player-card" | "reveal-public-card";
  playerId?: string;
  minMax?: "min" | "max";
  cardId?: string;
}

/**
 * Scored position for decision making
 */
interface ScoredPosition {
  position: CardPosition;
  score: number;
  cardId?: string;
}

/**
 * Main bot decision function
 * Based on PRD scoring system
 */
export function makeBotDecision(
  memory: BotMemory,
  players: Player[],
  publicCards: Card[],
  revealedCards: Card[],
  botId: string,
  botCollection: Card[]
): BotDecision {
  // Get already revealed numbers in current turn
  const revealedNumbers = revealedCards.map((c) => c.number);
  const targetNumber = revealedNumbers.length > 0 ? revealedNumbers[0] : null;
  const chainLen = revealedNumbers.length;

  // Update own sets from collection
  const collectedNumbers = Array.from(
    new Set(botCollection.map((c) => c.number))
  );

  // Get already flipped positions in this chain (to avoid re-flipping)
  const flippedPositions = new Set<string>();
  // We track flipped positions by marking them during the turn

  if (targetNumber !== null) {
    // Chase mode: target V is already defined
    return decideChaseMode(
      memory,
      players,
      publicCards,
      targetNumber,
      chainLen,
      botId,
      flippedPositions
    );
  }

  // Start new chain mode
  return decideStartMode(memory, players, publicCards, botId, collectedNumbers);
}

/**
 * Chase Mode (追击模式): Have a target number, need to find matching cards
 * HIGHEST PRIORITY: Currently revealed cards that match target (100% guaranteed success!)
 * Score formula from PRD:
 * - Currently revealed card == V: 150 (HIGHEST - guaranteed match!)
 * - Known head/tail == V: 100
 * - Ever seen at head/tail == V (historical memory): 90
 * - Bot's own head/tail == V: 100
 * - Public: min(80, remaining[V] * 20)
 * - Unknown opponent head: 30 if V could be min
 * - Unknown opponent tail: 30 if V could be max
 * - Known head/tail != V: 0
 */
function decideChaseMode(
  memory: BotMemory,
  players: Player[],
  publicCards: Card[],
  targetNumber: number,
  chainLen: number,
  botId: string,
  flippedPositions: Set<string>
): BotDecision {
  const scoredPositions: ScoredPosition[] = [];
  const remaining = memory.remainingCounts.get(targetNumber) || 0;
  const { minV, maxV } = getCurrentExtremes(memory.remainingCounts);

  // Calculate average card value for probability estimation
  const avgValue = 6.5;
  const isLowValue = targetNumber <= avgValue || targetNumber === minV;
  const isHighValue = targetNumber >= avgValue || targetNumber === maxV;

  // FIRST: Check for currently REVEALED cards that match target
  // These are 100% guaranteed matches - highest priority!
  for (const player of players) {
    if (!player.hand || player.hand.length === 0) continue;

    // Find revealed cards that match target number
    const revealedMatches = player.hand.filter(
      (c) => c.isRevealed && c.number === targetNumber
    );

    for (const card of revealedMatches) {
      // This is a revealed card matching our target - HIGHEST PRIORITY!
      // We need to determine if it's at head or tail position to select it
      const sortedHand = [...player.hand].sort(sortByIdAsc);
      const cardIndex = sortedHand.findIndex((c) => c.id === card.id);

      // Determine position type based on card's position in sorted hand
      let posType: "player-head" | "player-tail";
      let minMax: "min" | "max";

      // If card is in the lower half, treat as head; otherwise as tail
      if (cardIndex < sortedHand.length / 2) {
        posType = "player-head";
        minMax = "min";
      } else {
        posType = "player-tail";
        minMax = "max";
      }

      // But we can only select unrevealed cards, so skip this revealed one
      // The revealed cards are already in the chain!
    }
  }

  // Check all players for UNREVEALED cards
  for (const player of players) {
    const state = memory.playerStates.get(player.id);
    if (!state || state.handSize === 0) continue;

    const headCard = getPlayerHeadCard(player);
    const tailCard = getPlayerTailCard(player);

    // Get historical memory for this player
    const seenAtHead = memory.seenAtHead.get(player.id);
    const seenAtTail = memory.seenAtTail.get(player.id);
    const everSeenTargetAtHead = seenAtHead?.has(targetNumber) || false;
    const everSeenTargetAtTail = seenAtTail?.has(targetNumber) || false;

    // Check if the knownHead/knownTail refers to a currently revealed card
    // If so, the current unrevealed head/tail is different - treat as unknown
    const hasRevealedHead = player.hand?.some(
      (c) => c.isRevealed && c.number === state.knownHead
    );
    const hasRevealedTail = player.hand?.some(
      (c) => c.isRevealed && c.number === state.knownTail
    );
    // Effective known values (null if the known card is currently revealed)
    const effectiveKnownHead = hasRevealedHead ? null : state.knownHead;
    const effectiveKnownTail = hasRevealedTail ? null : state.knownTail;

    // Count unrevealed cards that match target - these are still pickable
    const unrevealedTargetCount =
      player.hand?.filter((c) => !c.isRevealed && c.number === targetNumber)
        .length || 0;

    // Only use historical memory if player still has unrevealed cards matching target
    // OR if we never actually saw the card values (player's cards are hidden from us)
    const canUseHistoricalHead =
      everSeenTargetAtHead &&
      (unrevealedTargetCount > 0 || player.id !== botId);
    const canUseHistoricalTail =
      everSeenTargetAtTail &&
      (unrevealedTargetCount > 0 || player.id !== botId);

    // Check head position
    if (headCard) {
      const posKey = `head-${player.id}`;
      if (!flippedPositions.has(posKey)) {
        let score = 0;

        if (effectiveKnownHead === targetNumber) {
          // Known head matches target - HIGH PRIORITY
          score = 100;
        } else if (canUseHistoricalHead) {
          // We saw target at head before and player still has unrevealed cards
          // Key insight: after a failed turn, cards are concealed and re-sorted
          // If we saw "1" at head before, the "1" card is likely back at head
          score = 90; // High score for historical match - card is still in player's hand
        } else if (effectiveKnownHead !== null) {
          // Known head doesn't match and never seen target here
          score = 0;
        } else {
          // Unknown head, never seen target here
          if (isLowValue) {
            score = 30;
            // Bonus for unknown (prefer discovering new info)
            score += 10;
          } else {
            score = 10;
          }
        }

        if (score > 0) {
          scoredPositions.push({
            position: {
              type: "player-head",
              playerId: player.id,
              cardId: headCard.id,
            },
            score,
            cardId: headCard.id,
          });
        }
      }
    }

    // Check tail position
    if (tailCard) {
      const posKey = `tail-${player.id}`;
      if (!flippedPositions.has(posKey)) {
        let score = 0;

        if (effectiveKnownTail === targetNumber) {
          // Known tail matches target - HIGH PRIORITY
          score = 100;
        } else if (canUseHistoricalTail) {
          // We saw target at tail before and player still has unrevealed cards
          score = 90; // High score for historical match
        } else if (effectiveKnownTail !== null) {
          // Known tail doesn't match and never seen target here
          score = 0;
        } else {
          // Unknown tail, never seen target here
          if (isHighValue) {
            score = 30;
            // Bonus for unknown
            score += 10;
          } else {
            score = 10;
          }
        }

        if (score > 0) {
          scoredPositions.push({
            position: {
              type: "player-tail",
              playerId: player.id,
              cardId: tailCard.id,
            },
            score,
            cardId: tailCard.id,
          });
        }
      }
    }
  }

  // Check public cards
  publicCards.forEach((card, index) => {
    if (!card.id || card.isRevealed) return;

    const posKey = `public-${index}`;
    if (flippedPositions.has(posKey)) return;

    const knownNumber = memory.lastSeenPublic.get(index);
    let score = 0;

    if (knownNumber === targetNumber) {
      // Known public card matches target
      score = 100;
    } else if (knownNumber !== null && knownNumber !== undefined) {
      // Known public card doesn't match
      score = 0;
    } else {
      // Unknown public card: min(80, remaining[V] * 20)
      score = Math.min(80, remaining * 20);
    }

    if (score > 0) {
      scoredPositions.push({
        position: {
          type: "public",
          publicIndex: index,
          cardId: card.id,
        },
        score,
        cardId: card.id,
      });
    }
  });

  // Sort by score descending, with tie-breakers
  scoredPositions.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    // Tie-breaker: prefer other players when bot already revealed its card
    // This prevents bot from depleting its own hand
    const botHasRevealed = players
      .find((p) => p.id === botId)
      ?.hand?.some((c) => c.isRevealed);

    const aIsSelf = a.position.playerId === botId;
    const bIsSelf = b.position.playerId === botId;

    if (botHasRevealed) {
      // Prefer other players' cards when bot already has a revealed card
      if (!aIsSelf && bIsSelf) return -1;
      if (aIsSelf && !bIsSelf) return 1;
    } else {
      // Prefer self when starting
      if (aIsSelf && !bIsSelf) return -1;
      if (!aIsSelf && bIsSelf) return 1;
    }

    // Prefer player positions over public
    if (a.position.type !== "public" && b.position.type === "public") return -1;
    if (a.position.type === "public" && b.position.type !== "public") return 1;

    return 0;
  });

  // Return the highest scored position
  if (scoredPositions.length > 0) {
    const best = scoredPositions[0];
    if (best.position.type === "public") {
      return {
        action: "reveal-public-card",
        cardId: best.cardId,
      };
    } else {
      return {
        action: "reveal-player-card",
        playerId: best.position.playerId,
        minMax: best.position.type === "player-head" ? "min" : "max",
      };
    }
  }

  // Fallback: flip any available card
  return getFallbackDecision(players, publicCards, botId);
}

/**
 * Start New Chain Mode (起始新链模式): Select a target V to pursue
 * Priority from PRD:
 * 1. 7 (instant win, +50)
 * 2. Complement V: own_sets has W, |V-W|=7 (+40)
 * 3. Extreme V: current min/max (+30)
 * 4. Scarce V: remaining[V]<=2 (+20)
 * 5. High remaining V: remaining[V]=3 (score = remaining[V]*10)
 */
function decideStartMode(
  memory: BotMemory,
  players: Player[],
  publicCards: Card[],
  botId: string,
  ownSets: number[]
): BotDecision {
  const scoredPositions: ScoredPosition[] = [];
  const { minV, maxV } = getCurrentExtremes(memory.remainingCounts);

  // Calculate value scores for each possible target number
  const valueScores = new Map<number, number>();

  for (let v = 1; v <= 12; v++) {
    const remaining = memory.remainingCounts.get(v) || 0;
    if (remaining === 0) continue;

    let score = 0;

    // 1. 7 is highest priority (instant win)
    if (v === 7) {
      score += 50;
    }

    // 2. Complement V for existing sets
    for (const w of ownSets) {
      const complements = getComplementNumbers(w);
      if (complements.includes(v)) {
        score += 40;
        break;
      }
    }

    // 3. Extreme V (current min or max)
    if (v === minV || v === maxV) {
      score += 30;
    }

    // 4. Scarce V
    if (remaining <= 2) {
      score += 20;
    }

    // 5. Base score from remaining count
    score += remaining * 10;

    valueScores.set(v, score);
  }

  // For each valuable target V, find best starting position
  for (const [targetV, valueScore] of Array.from(valueScores.entries())) {
    const remaining = memory.remainingCounts.get(targetV) || 0;
    const isLowV = targetV <= 6;
    const isHighV = targetV >= 7;
    const isExtremeV = targetV === minV || targetV === maxV;

    // Check all players
    for (const player of players) {
      const state = memory.playerStates.get(player.id);
      if (!state || state.handSize === 0) continue;

      const headCard = getPlayerHeadCard(player);
      const tailCard = getPlayerTailCard(player);
      const isSelf = player.id === botId;

      // Get historical memory for this player
      const seenAtHead = memory.seenAtHead.get(player.id);
      const seenAtTail = memory.seenAtTail.get(player.id);
      const everSeenTargetAtHead = seenAtHead?.has(targetV) || false;
      const everSeenTargetAtTail = seenAtTail?.has(targetV) || false;

      // Check head position
      if (headCard) {
        let posScore = 0;

        if (state.knownHead === targetV) {
          // Known head matches target
          posScore = remaining * 10 - 10; // Slightly lower (save for later)
          if (isSelf) posScore += 20;
        } else if (everSeenTargetAtHead) {
          // Historical memory: we saw target at this player's head before
          // The card is still in their hand, so there's a good chance to find it
          posScore = remaining * 10; // Good score for historical match
          if (isSelf) posScore += 20;
        } else if (state.knownHead === null) {
          // Unknown head - good for low values
          if (isLowV) {
            posScore = 40;
            if (isExtremeV) posScore += 30;
          } else {
            posScore = 10;
          }
        }
        // Known head != targetV and never seen: skip (score = 0)

        if (posScore > 0) {
          scoredPositions.push({
            position: {
              type: "player-head",
              playerId: player.id,
              cardId: headCard.id,
            },
            score: valueScore + posScore,
            cardId: headCard.id,
          });
        }
      }

      // Check tail position
      if (tailCard) {
        let posScore = 0;

        if (state.knownTail === targetV) {
          // Known tail matches target
          posScore = remaining * 10 - 10;
          if (isSelf) posScore += 20;
        } else if (everSeenTargetAtTail) {
          // Historical memory: we saw target at this player's tail before
          posScore = remaining * 10;
          if (isSelf) posScore += 20;
        } else if (state.knownTail === null) {
          // Unknown tail - good for high values
          if (isHighV) {
            posScore = 40;
            if (isExtremeV) posScore += 30;
          } else {
            posScore = 10;
          }
        }

        if (posScore > 0) {
          scoredPositions.push({
            position: {
              type: "player-tail",
              playerId: player.id,
              cardId: tailCard.id,
            },
            score: valueScore + posScore,
            cardId: tailCard.id,
          });
        }
      }
    }

    // Check public cards
    publicCards.forEach((card, index) => {
      if (!card.id || card.isRevealed) return;

      const knownNumber = memory.lastSeenPublic.get(index);
      let posScore = 0;

      if (knownNumber === targetV) {
        posScore = remaining * 10 - 10;
      } else if (knownNumber === null || knownNumber === undefined) {
        // Unknown public card
        posScore = 30;
      }

      if (posScore > 0) {
        scoredPositions.push({
          position: {
            type: "public",
            publicIndex: index,
            cardId: card.id,
          },
          score: valueScore + posScore,
          cardId: card.id,
        });
      }
    });
  }

  // Sort by score descending
  scoredPositions.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;

    // Tie-breaker: prefer self > players with fewer cards > public
    const aIsSelf = a.position.playerId === botId;
    const bIsSelf = b.position.playerId === botId;
    if (aIsSelf && !bIsSelf) return -1;
    if (!aIsSelf && bIsSelf) return 1;

    // Prefer smaller hand players (easier to hit extremes)
    if (a.position.playerId && b.position.playerId) {
      const aState = memory.playerStates.get(a.position.playerId);
      const bState = memory.playerStates.get(b.position.playerId);
      if (aState && bState) {
        if (aState.handSize !== bState.handSize) {
          return aState.handSize - bState.handSize;
        }
      }
    }

    return 0;
  });

  // Return the highest scored position
  if (scoredPositions.length > 0) {
    const best = scoredPositions[0];
    if (best.position.type === "public") {
      return {
        action: "reveal-public-card",
        cardId: best.cardId,
      };
    } else {
      return {
        action: "reveal-player-card",
        playerId: best.position.playerId,
        minMax: best.position.type === "player-head" ? "min" : "max",
      };
    }
  }

  // Fallback: flip bot's own head (unknown territory)
  return getFallbackDecision(players, publicCards, botId);
}

/**
 * Get the head (min) card of a player's hand
 */
function getPlayerHeadCard(player: Player): Card | undefined {
  if (!player.hand || player.hand.length === 0) return undefined;
  const sortedHand = [...player.hand].filter((c) => !c.isRevealed);
  sortedHand.sort(sortByIdAsc);
  return sortedHand[0];
}

/**
 * Get the tail (max) card of a player's hand
 */
function getPlayerTailCard(player: Player): Card | undefined {
  if (!player.hand || player.hand.length === 0) return undefined;
  const sortedHand = [...player.hand].filter((c) => !c.isRevealed);
  sortedHand.sort(sortByIdDesc);
  return sortedHand[0];
}

/**
 * Get fallback decision when no good options found
 */
function getFallbackDecision(
  players: Player[],
  publicCards: Card[],
  botId: string
): BotDecision {
  // Try bot's own head card
  const bot = players.find((p) => p.id === botId);
  if (bot && bot.hand && bot.hand.length > 0) {
    const headCard = getPlayerHeadCard(bot);
    if (headCard) {
      return {
        action: "reveal-player-card",
        playerId: botId,
        minMax: "min",
      };
    }
  }

  // Try any available public card
  const availablePublicCard = publicCards.find((c) => c.id && !c.isRevealed);
  if (availablePublicCard) {
    return {
      action: "reveal-public-card",
      cardId: availablePublicCard.id,
    };
  }

  // Try any other player's head
  const otherPlayer = players.find(
    (p) => p.hand && p.hand.length > 0 && p.id !== botId
  );
  if (otherPlayer) {
    return {
      action: "reveal-player-card",
      playerId: otherPlayer.id,
      minMax: "min",
    };
  }

  // Last resort
  return {
    action: "reveal-player-card",
    playerId: botId,
    minMax: "min",
  };
}

/**
 * Calculate card position type when a card is flipped
 */
export function getFlipPositionType(
  playerId: string | undefined,
  minMax: "min" | "max" | undefined,
  publicCardId: string | undefined
): CardPosition {
  if (publicCardId) {
    return {
      type: "public",
      cardId: publicCardId,
    };
  }
  return {
    type: minMax === "min" ? "player-head" : "player-tail",
    playerId: playerId,
  };
}

/**
 * Check win condition based on PRD:
 * - 3 sets: win
 * - Has 7: win
 * - 2 sets with A+B=7 or |A-B|=7: win
 */
export function checkWinCondition(collectedSets: number[]): boolean {
  // 3 sets wins
  if (collectedSets.length >= 3) return true;

  // Has 7 wins
  if (collectedSets.includes(7)) return true;

  // 2 sets with complement condition
  if (collectedSets.length >= 2) {
    for (let i = 0; i < collectedSets.length; i++) {
      for (let j = i + 1; j < collectedSets.length; j++) {
        const a = collectedSets[i];
        const b = collectedSets[j];
        // Check A+B=7 or |A-B|=7
        if (a + b === 7 || Math.abs(a - b) === 7) {
          return true;
        }
      }
    }
  }

  return false;
}

/**
 * Get priority target numbers for the bot (for compatibility)
 * Priority: 7 > complement numbers for existing collections > low cards > high cards > mid cards
 */
export function getPriorityTargetNumbers(collectedNumbers: number[]): number[] {
  const priorities: number[] = [];

  // 1. Always prioritize 7 (instant win)
  priorities.push(7);

  // 2. If bot has collected sets, prioritize complement numbers
  if (collectedNumbers.length > 0) {
    const uniqueCollected = Array.from(new Set(collectedNumbers));
    for (const num of uniqueCollected) {
      const complements = getComplementNumbers(num);
      for (const comp of complements) {
        if (!priorities.includes(comp)) {
          priorities.push(comp);
        }
      }
    }
  }

  // 3. Low cards (1-3) - extreme values
  [1, 2, 3].forEach((n) => {
    if (!priorities.includes(n)) priorities.push(n);
  });

  // 4. High cards (10-12) - extreme values
  [10, 11, 12].forEach((n) => {
    if (!priorities.includes(n)) priorities.push(n);
  });

  // 5. Mid cards (4-6, 8-9)
  [4, 5, 6, 8, 9].forEach((n) => {
    if (!priorities.includes(n)) priorities.push(n);
  });

  return priorities;
}

/**
 * Find all known card positions for a specific number (for compatibility)
 */
export function findKnownPositionsForNumber(
  memory: BotMemory,
  targetNumber: number,
  players: Player[],
  publicCards: Card[],
  botId: string
): CardPosition[] {
  const positions: CardPosition[] = [];

  // Check player positions (prioritize bot's own cards first)
  const sortedPlayers = [...players].sort((a, b) => {
    if (a.id === botId) return -1;
    if (b.id === botId) return 1;
    return (b.hand?.length || 0) - (a.hand?.length || 0);
  });

  for (const player of sortedPlayers) {
    const state = memory.playerStates.get(player.id);
    if (!state) continue;

    if (state.knownHead === targetNumber) {
      const headCard = getPlayerHeadCard(player);
      if (headCard) {
        positions.push({
          type: "player-head",
          playerId: player.id,
          cardId: headCard.id,
        });
      }
    }
    if (state.knownTail === targetNumber) {
      const tailCard = getPlayerTailCard(player);
      if (tailCard) {
        positions.push({
          type: "player-tail",
          playerId: player.id,
          cardId: tailCard.id,
        });
      }
    }
  }

  // Check public cards
  const publicEntries = Array.from(memory.lastSeenPublic.entries());
  for (const [index, cardNumber] of publicEntries) {
    if (cardNumber === targetNumber && publicCards[index]?.id) {
      positions.push({
        type: "public",
        publicIndex: index,
        cardId: publicCards[index].id,
      });
    }
  }

  return positions;
}
