import { create } from "zustand";
import { immer } from "zustand/middleware/immer";
import { enableMapSet } from "immer";
import { Card, Player } from "@/types";
import { GAME_RULES } from "@/lib/rules";
import { shuffle } from "@/lib/random";
import i18n from "@/i18n/index";
import {
  BotMemory,
  initBotMemory,
  updateMemoryOnReveal,
  updateMemoryOnCollect,
  makeBotDecision,
  getNumberRangeForPlayerCount,
} from "@/lib/bot-logic";

// Enable Map/Set support in Immer
enableMapSet();

import {
  allRevealedCards,
  challengeFailed,
  challengeSuccess,
  concealAllCards,
  findUnrevealedCardId,
  getCurrentAndNextPlayer,
  isPlayerWin,
  removeTargetCards,
  sortByIdAsc,
  sortByIdDesc,
} from "@/lib/game-helper";

export type LocalGameStage = "config" | "dealing" | "in-game" | "game-over";

export type TurnPhase =
  | "waiting"
  | "flip-1"
  | "flip-2"
  | "flip-3"
  | "success"
  | "failed"
  | "turn-end";

export interface LocalGameState {
  gameStage: LocalGameStage;
  turnPhase: TurnPhase;
  botCount: number;
  players: Player[];
  cardDeck: Card[];
  publicCards: Card[];
  currentPlayerIndex: number;
  winner: Player | null;
  turnMessage: string | null;
  // Bot 记忆存储：每个 bot 维护自己的视角
  botMemories: Map<string, BotMemory>;
}

export interface LocalGameActions {
  // Setup
  setBotCount: (count: number) => void;
  startGame: () => void;
  resetGame: () => void;

  // Game actions
  revealPlayerCard: (playerId: string, minMax: "min" | "max") => void;
  revealPublicCard: (cardId: string) => void;

  // Internal
  processTurnResult: () => void;
  nextTurn: () => void;
  executeBotTurn: () => Promise<void>;

  // Getters
  getCurrentPlayer: () => Player | undefined;
  getRevealedCards: () => Card[];
  isCurrentPlayerBot: () => boolean;
  getMyPlayer: () => Player | undefined;
}

// Bot names for display
const BOT_NAMES = [
  "Bot Alpha",
  "Bot Beta",
  "Bot Gamma",
  "Bot Delta",
  "Bot Epsilon",
];

export const useLocalGameStore = create<LocalGameState & LocalGameActions>()(
  immer((set, get) => ({
    // Initial state
    gameStage: "config",
    turnPhase: "waiting",
    botCount: 1,
    players: [],
    cardDeck: [],
    publicCards: [],
    currentPlayerIndex: 0,
    winner: null,
    turnMessage: null,
    botMemories: new Map(),

    // Setup actions
    setBotCount: (count: number) => {
      set((state) => {
        state.botCount = Math.max(1, Math.min(5, count));
      });
    },

    startGame: () => {
      const { botCount } = get();
      const totalPlayers = botCount + 1;
      const rules = GAME_RULES[totalPlayers];

      if (!rules) {
        console.error("Invalid player count");
        return;
      }

      // Create deck
      const deck = rules.cards.map((c) => ({
        ...c,
        number: parseInt(c.id.split("-")[0]),
        isRevealed: false,
      }));
      shuffle(deck);

      // Create players
      const players: Player[] = [];

      // Add human player
      players.push({
        id: "me",
        name: i18n.t("ME"),
        seat: 1,
        isHost: true,
        isPlaying: true,
        hand: [],
        collection: [],
      });

      // Add bots
      for (let i = 0; i < botCount; i++) {
        players.push({
          id: `bot-${i + 1}`,
          name: BOT_NAMES[i],
          seat: i + 2,
          isHost: false,
          isPlaying: false,
          hand: [],
          collection: [],
        });
      }

      // Deal cards
      const { handNumber, publicNumber } = rules;

      // Deal to each player
      for (let i = 0; i < handNumber; i++) {
        for (const player of players) {
          const card = deck.pop();
          if (card) {
            player.hand.push(card);
          }
        }
      }

      // Sort hands
      for (const player of players) {
        player.hand.sort(sortByIdAsc);
      }

      // Deal public cards
      const publicCards: Card[] = [];
      for (let i = 0; i < publicNumber; i++) {
        const card = deck.pop();
        if (card) {
          publicCards.push(card);
        }
      }

      // Create bot memories
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
        state.gameStage = "in-game";
        state.turnPhase = "flip-1";
        state.players = players;
        state.cardDeck = deck;
        state.publicCards = publicCards;
        state.currentPlayerIndex = 0;
        state.winner = null;
        state.turnMessage = i18n.t("MY_TURN");
        state.botMemories = botMemories;
      });
    },

    resetGame: () => {
      set((state) => {
        state.gameStage = "config";
        state.turnPhase = "waiting";
        state.players = [];
        state.cardDeck = [];
        state.publicCards = [];
        state.currentPlayerIndex = 0;
        state.winner = null;
        state.turnMessage = null;
        state.botMemories = new Map();
      });
    },

    // Game actions
    revealPlayerCard: (playerId: string, minMax: "min" | "max") => {
      const state = get();
      if (state.gameStage !== "in-game") return;
      if (state.turnPhase === "success" || state.turnPhase === "failed") return;

      const player = state.players.find((p) => p.id === playerId);
      if (!player || !player.hand || player.hand.length === 0) return;

      const cardId = findUnrevealedCardId(player.hand, minMax);
      if (!cardId) return;

      const card = player.hand.find((c) => c.id === cardId);
      if (!card) return;

      set((draft) => {
        const targetPlayer = draft.players.find((p) => p.id === playerId);
        const targetCard = targetPlayer?.hand.find((c) => c.id === cardId);
        if (targetCard) {
          targetCard.isRevealed = true;

          // Update all bot memories
          for (const [botId, memory] of Array.from(draft.botMemories)) {
            draft.botMemories.set(
              botId,
              updateMemoryOnReveal(memory, cardId, card.number, {
                type: "player",
                playerId,
              })
            );
          }

          // Update turn phase
          const revealedCount = get().getRevealedCards().length + 1;
          if (revealedCount === 1) {
            draft.turnPhase = "flip-2";
          } else if (revealedCount === 2) {
            draft.turnPhase = "flip-3";
          }
        }
      });

      // Process result after state update
      setTimeout(() => get().processTurnResult(), 100);
    },

    revealPublicCard: (cardId: string) => {
      const state = get();
      if (state.gameStage !== "in-game") return;
      if (state.turnPhase === "success" || state.turnPhase === "failed") return;

      const cardIndex = state.publicCards.findIndex((c) => c.id === cardId);
      if (cardIndex === -1) return;

      const card = state.publicCards[cardIndex];
      if (card.isRevealed) return;

      set((draft) => {
        const targetCard = draft.publicCards.find((c) => c.id === cardId);
        if (targetCard) {
          targetCard.isRevealed = true;

          // Update all bot memories
          for (const [botId, memory] of Array.from(draft.botMemories)) {
            draft.botMemories.set(
              botId,
              updateMemoryOnReveal(memory, cardId, card.number, {
                type: "public",
              })
            );
          }

          // Update turn phase
          const revealedCount = get().getRevealedCards().length + 1;
          if (revealedCount === 1) {
            draft.turnPhase = "flip-2";
          } else if (revealedCount === 2) {
            draft.turnPhase = "flip-3";
          }
        }
      });

      // Process result after state update
      setTimeout(() => get().processTurnResult(), 100);
    },

    processTurnResult: () => {
      const state = get();
      const revealedCards = state.getRevealedCards();

      // Check if challenge failed (two different numbers)
      if (challengeFailed(revealedCards)) {
        set((draft) => {
          draft.turnPhase = "failed";
          draft.turnMessage = i18n.t("CHALLENGE_FAILED");
        });

        // Wait and then reset cards
        setTimeout(() => {
          set((draft) => {
            // Conceal all cards
            draft.players.forEach((p) =>
              p.hand?.forEach((c) => {
                c.isRevealed = false;
              })
            );
            draft.publicCards?.forEach((c) => {
              c.isRevealed = false;
            });
          });

          // Next turn
          setTimeout(() => get().nextTurn(), 500);
        }, 1500);

        return;
      }

      // Check if challenge succeeded (three matching numbers)
      if (challengeSuccess(revealedCards)) {
        set((draft) => {
          draft.turnPhase = "success";
          draft.turnMessage = i18n.t("CHALLENGE_SUCCESS");
        });

        const collectedNumber = revealedCards[0].number;
        const currentPlayerId = state.players[state.currentPlayerIndex].id;

        // Wait and then collect cards
        setTimeout(() => {
          set((draft) => {
            const currentPlayer = draft.players.find(
              (p) => p.id === currentPlayerId
            );
            if (currentPlayer) {
              // Add cards to collection
              currentPlayer.collection.push(...revealedCards);

              // Remove cards from hands and public
              removeTargetCards(
                {
                  players: draft.players,
                  publicCards: draft.publicCards,
                } as any,
                collectedNumber
              );

              // Update all bot memories
              for (const [botId, memory] of Array.from(draft.botMemories)) {
                draft.botMemories.set(
                  botId,
                  updateMemoryOnCollect(
                    memory,
                    currentPlayerId,
                    collectedNumber
                  )
                );
              }

              // Check win condition
              if (isPlayerWin(currentPlayer)) {
                draft.winner = currentPlayer;
                draft.gameStage = "game-over";
                draft.turnMessage = `${currentPlayer.name} ${i18n.t("WINS")}`;
                currentPlayer.isWinner = true;
                return;
              }
            }

            // Conceal remaining cards
            draft.players.forEach((p) =>
              p.hand?.forEach((c) => {
                c.isRevealed = false;
              })
            );
            draft.publicCards?.forEach((c) => {
              c.isRevealed = false;
            });

            // Player continues their turn
            draft.turnPhase = "flip-1";
          });

          // If game not over and current player is bot, continue bot turn
          const newState = get();
          if (
            newState.gameStage === "in-game" &&
            newState.isCurrentPlayerBot()
          ) {
            setTimeout(() => get().executeBotTurn(), 1000);
          }
        }, 1500);

        return;
      }

      // If we're still in progress (1 or 2 matching cards), bot should continue
      if (state.isCurrentPlayerBot() && revealedCards.length < 3) {
        setTimeout(() => get().executeBotTurn(), 800);
      }
    },

    nextTurn: () => {
      set((draft) => {
        // Move to next player
        draft.players[draft.currentPlayerIndex].isPlaying = false;
        draft.currentPlayerIndex =
          (draft.currentPlayerIndex + 1) % draft.players.length;
        draft.players[draft.currentPlayerIndex].isPlaying = true;
        draft.turnPhase = "flip-1";

        const currentPlayer = draft.players[draft.currentPlayerIndex];
        if (currentPlayer.id === "me") {
          draft.turnMessage = i18n.t("MY_TURN");
        } else {
          draft.turnMessage = `${currentPlayer.name}${i18n.t("BOT_TURN")}`;
        }
      });

      // If next player is bot, execute bot turn
      const state = get();
      if (state.isCurrentPlayerBot()) {
        setTimeout(() => get().executeBotTurn(), 1000);
      }
    },

    executeBotTurn: async () => {
      const state = get();
      if (state.gameStage !== "in-game") return;
      if (!state.isCurrentPlayerBot()) return;

      const currentPlayer = state.getCurrentPlayer();
      if (!currentPlayer) return;

      const memory = state.botMemories.get(currentPlayer.id);
      if (!memory) return;

      const revealedCards = state.getRevealedCards();

      // Make decision using bot logic
      const decision = makeBotDecision(
        memory,
        revealedCards,
        state.players,
        state.publicCards
      );

      // Debug log in development mode
      if (process.env.NODE_ENV === "development") {
        console.log(`[Bot ${currentPlayer.id}] Decision:`, decision.reasoning);
      }

      // Execute decision with delay for animation
      await new Promise((resolve) => setTimeout(resolve, 800));

      // Execute the decision
      if (decision.action === "reveal-player-card" && decision.playerId) {
        get().revealPlayerCard(decision.playerId, decision.minMax || "min");
      } else if (decision.action === "reveal-public-card" && decision.cardId) {
        get().revealPublicCard(decision.cardId);
      }
    },

    // Getters
    getCurrentPlayer: () => {
      const state = get();
      return state.players[state.currentPlayerIndex];
    },

    getRevealedCards: () => {
      const state = get();
      const revealedCards: Card[] = [];
      state.players.forEach((p) =>
        p.hand?.forEach((c) => c.isRevealed && revealedCards.push(c))
      );
      state.publicCards?.forEach((c) => c.isRevealed && revealedCards.push(c));
      return revealedCards;
    },

    isCurrentPlayerBot: () => {
      const state = get();
      const currentPlayer = state.players[state.currentPlayerIndex];
      return currentPlayer?.id?.startsWith("bot-") || false;
    },

    getMyPlayer: () => {
      const state = get();
      return state.players.find((p) => p.id === "me");
    },
  }))
);
