import { useState, useEffect } from "react";
import CockImg from "../assets/standing_clock.svg";
import CockMovingImg1 from "../assets/cock_walk_1.svg";
import CockMovingImg2 from "../assets/cock_walk_2.svg";
import DeadCockImg from "../assets/dead_cock.svg";

interface CockUiProps {
  maxWidth: number;
  maxHeight: number;
  targetLane: number | null;
  currentLane: number;
  onMoveComplete: () => void;
  crashLane: number | null;
  gameOver: boolean;
  cockDead: boolean; // If true => show the DeadCockImg
}

function CockUi({
  targetLane,
  currentLane,
  onMoveComplete,
  cockDead,
}: CockUiProps) {
  const laneWidth = 200;
  const [position, setPosition] = useState({
    left: calculateLanePosition(currentLane),
  });
  const [isMoving, setIsMoving] = useState(false);
  const [currentImage, setCurrentImage] = useState(CockImg);

  function calculateLanePosition(lane: number): number {
    // offset from left background
    const leftBackgroundWidth = 240;
    if (lane === 0) return 140; // initial position
    return leftBackgroundWidth + (lane - 1) * laneWidth + laneWidth / 2 - 50;
  }

  // If cockDead is true, immediately show the dead image
  useEffect(() => {
    if (cockDead) {
      setCurrentImage(DeadCockImg);
      setIsMoving(false);
    }
  }, [cockDead]);

  // If targetLane changes, animate the move
  useEffect(() => {
    if (targetLane !== null && targetLane > currentLane && !cockDead) {
      setIsMoving(true);
      setPosition({ left: calculateLanePosition(targetLane) });

      // The time it takes to move
      const animationTime = Math.min(800, 300 * (targetLane - currentLane));
      const timeout = setTimeout(() => {
        setIsMoving(false);
        onMoveComplete();
      }, animationTime);

      return () => clearTimeout(timeout);
    }
  }, [targetLane, currentLane, cockDead, onMoveComplete]);

  // Toggle between walk frames while isMoving
  useEffect(() => {
    if (isMoving) {
      const interval = setInterval(() => {
        setCurrentImage((prev) =>
          prev === CockMovingImg1 ? CockMovingImg2 : CockMovingImg1
        );
      }, 200);
      return () => clearInterval(interval);
    } else if (!cockDead) {
      setCurrentImage(CockImg);
    }
  }, [isMoving, cockDead]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <img
        src={currentImage}
        alt="Hen"
        className="absolute z-20"
        style={{
          left: `${position.left}px`,
          bottom: "80px",
          width: "100px",
          height: "100px",
          transition: cockDead
            ? "none"
            : "left 0.8s cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      />
    </div>
  );
}

export default CockUi;
