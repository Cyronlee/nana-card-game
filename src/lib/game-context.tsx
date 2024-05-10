import React, {
  createContext,
  Dispatch,
  SetStateAction,
  useContext,
  useState,
} from "react";

type GameState = {
  soundEnabled: boolean;
};

type GameContextProps = {
  gameState: GameState;
  setGameState: Dispatch<SetStateAction<GameState>>;
};

const GameContext = createContext<GameContextProps | undefined>(undefined);

type GameContextProviderProps = {
  children: React.ReactNode;
};

export function GameContextProvider({ children }: GameContextProviderProps) {
  const [gameState, setGameState] = useState({ soundEnabled: false });
  return (
    <GameContext.Provider
      value={{
        gameState,
        setGameState,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGameContext() {
  const context = useContext(GameContext);

  if (!context)
    throw new Error(
      "useGameContext must be used inside a `GameContextProvider`",
    );

  return context;
}
