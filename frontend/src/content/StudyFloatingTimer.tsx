import { FloatingTimer } from "@/components/FloatingTimer";
import { useStudy } from "./StudyContext";

/** Mini-timer das telas de leitura: aparece só com um desafio em foco. */
export function StudyFloatingTimer() {
  const { countdown, phase, challenge } = useStudy();
  if (phase !== "work" || !challenge) return null;
  return (
    <FloatingTimer
      timeLeft={countdown.secondsLeft}
      totalTime={countdown.totalSeconds}
      color={challenge.subjectColor}
      isRunning={countdown.isRunning}
      onToggle={() => (countdown.isRunning ? countdown.pause() : countdown.resume())}
      theme={challenge.theme}
      subjectColor={challenge.subjectColor}
    />
  );
}
