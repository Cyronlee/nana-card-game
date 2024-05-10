"use client";
import React from "react";
// @ts-ignore
import useSound from "use-sound";

export const useGameSound = () => {
  const [playWin] = useSound("/sound/win.mp3");
  const [playSwing] = useSound("/sound/swing.wav");
  const [playSuccess] = useSound("/sound/success.mp3");
  const [playWoosh] = useSound("/sound/whoosh.flac");
  const [playFlip] = useSound("/sound/flipcard.wav");
  const [playDingDong] = useSound("/sound/ding-dong.mp3");

  return { playWin, playSwing, playSuccess, playWoosh, playFlip, playDingDong };
};
