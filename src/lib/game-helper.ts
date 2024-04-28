import { Card, Player, ServerState } from "@/types";
import { sum7Pairs } from "@/lib/rules";

export const allRevealedCards = (serverState: ServerState) => {
  const revealedCards: Card[] = [];
  serverState.players.forEach((p) =>
    p.hand?.forEach((c) => c.isRevealed && revealedCards.push(c)),
  );
  serverState.publicCards?.forEach(
    (c) => c.isRevealed && revealedCards.push(c),
  );
  return revealedCards;
};

export const isTurnOver = (serverState: ServerState): boolean => {
  let revealedCards = allRevealedCards(serverState);
  if (revealedCards.length === 2) {
    return revealedCards[0].number !== revealedCards[1].number;
  }
  return revealedCards.length >= 3;
};

export const findWinner = (serverState: ServerState): Player | undefined => {
  return serverState.players.find((p) => isPlayerWin(p));
};

export const isPlayerWin = (player: Player) => {
  if (!player.collection || player.collection.length === 0) {
    return false;
  }
  if (player.collection.length === 9) {
    return true;
  }
  if (player.collection.some((c) => c.number === 7)) {
    return true;
  }
  if (player.collection.length === 6) {
    const collectNumbers = player.collection.map((c) => c.number);
    return sum7Pairs.some((pair) =>
      pair.every((n) => collectNumbers.includes(n)),
    );
  }
};

export function challengeFailed(cards: Card[]): boolean {
  if (cards.length <= 1) return false;
  if (cards.length === 2) return cards[0].number !== cards[1].number;
  if (cards.length === 3)
    return (
      cards[0].number !== cards[1].number || cards[1].number !== cards[2].number
    );
  return true;
}

export function challengeSuccess(cards: Card[]): boolean {
  if (cards.length < 3) return false;
  return (
    cards[0].number === cards[1].number && cards[1].number === cards[2].number
  );
}

export function findUnrevealedCardId(
  cards: Card[] | undefined,
  minMax: string | "max" | "min",
): string | undefined {
  if (!cards) return undefined;
  const sortedCards = [...cards].filter((c) => !c.isRevealed);
  if (minMax === "min") {
    sortedCards.sort(sortByIdAsc);
  } else {
    sortedCards.sort(sortByIdDesc);
  }
  return sortedCards.find((c) => !c.isRevealed)?.id;
}

export function getCurrentAndNextPlayer(players: Player[]): Player[] {
  const cpIndex = players.findIndex((player) => player.isPlaying);

  if (cpIndex === -1) {
    return [players[0], players[0]];
  }

  if (cpIndex === players.length - 1) {
    return [players[cpIndex], players[0]];
  }

  return [players[cpIndex], players[cpIndex + 1]];
}

export const concealAllCards = (serverState: ServerState) => {
  serverState.players.forEach((p) =>
    p.hand?.forEach((c) => {
      c.isRevealed = false;
    }),
  );
  serverState.publicCards?.forEach((c) => {
    c.isRevealed = false;
  });
};

export const removeTargetCards = (
  serverState: ServerState,
  targetCardNumber: number,
) => {
  serverState.players.forEach(
    (p) => (p.hand = p.hand?.filter((c) => c.number !== targetCardNumber)),
  );
  // serverState.publicCards = serverState.publicCards?.filter(
  //   (c) => c.number !== targetCardNumber,
  // );
  serverState.publicCards = serverState.publicCards?.map((c) =>
    c.number === targetCardNumber ? { id: undefined } : c,
  );
};

export const calculateDisplayPlayerIndices = (
  myPlayerId: string | undefined,
  players: Player[],
) => {
  const myIndex = players?.findIndex((p) => p.id === myPlayerId);
  if (myIndex < 0) {
    return [];
  }

  let originIndex = [];

  for (let i = 0; i < players.length; i++) {
    originIndex.push(i);
  }
  for (let i = 0; i < players.length; i++) {
    originIndex.push(i);
  }

  return originIndex.splice(myIndex, players.length);
};

export const sortByIdAsc = (a: Card, b: Card) =>
  a.id.localeCompare(b.id, undefined, {
    numeric: true,
  });

export const sortByIdDesc = (a: Card, b: Card) =>
  b.id.localeCompare(a.id, undefined, {
    numeric: true,
  });
