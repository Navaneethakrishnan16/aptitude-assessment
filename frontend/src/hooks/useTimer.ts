import { useEffect, useRef, useState } from "react";

/** Counts down from `initialSeconds`, calling onExpire exactly once. */
export function useTimer(initialSeconds: number, onExpire: () => void) {
  const [secondsLeft, setSecondsLeft] = useState(initialSeconds);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  useEffect(() => {
    if (secondsLeft <= 0) {
      onExpireRef.current();
      return;
    }
    const id = setInterval(() => setSecondsLeft((s) => s - 1), 1000);
    return () => clearInterval(id);
  }, [secondsLeft]);

  const minutes = Math.floor(secondsLeft / 60);
  const seconds = secondsLeft % 60;
  const label = `${minutes}:${seconds.toString().padStart(2, "0")}`;

  return { secondsLeft, label };
}
