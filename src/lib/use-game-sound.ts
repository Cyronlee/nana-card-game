"use client";
// @ts-ignore
import useSound from "use-sound";
import { useGameSettingsStore } from "@/store/setting-store";

export const useGameSound = () => {
  let { soundEnabled } = useGameSettingsStore();

  const soundOption = { soundEnabled: soundEnabled };

  const [playWin] = useSound("/sound/win.mp3", soundOption);
  const [playSwing] = useSound("/sound/swing.wav", soundOption);
  const [playSuccess] = useSound("/sound/success.mp3", soundOption);
  const [playWoosh] = useSound("/sound/whoosh.flac", soundOption);
  const [playFlip] = useSound("/sound/flipcard.wav", soundOption);
  const [playDingDong] = useSound("/sound/ding-dong.mp3", soundOption);
  const [playToggle] = useSound("/sound/whoosh.flac");

  return {
    playWin,
    playSwing,
    playSuccess,
    playWoosh,
    playFlip,
    playDingDong,
    playToggle,
  };
};
