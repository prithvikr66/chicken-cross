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
  cockDead: boolean;
}

function CockUi({
  targetLane,
  currentLane,
  onMoveComplete,
  cockDead,
}: CockUiProps) {
  const laneWidth = 150;
  const [position, setPosition] = useState({
    left: calculateLanePosition(currentLane),
  });
  const [isMoving, setIsMoving] = useState(false);
  const [currentImage, setCurrentImage] = useState(CockImg);

  function calculateLanePosition(lane: number): number {
    const leftBackgroundWidth = 160;
    if (lane === 0) return 75;
    return leftBackgroundWidth + (lane - 1) * laneWidth + laneWidth / 2 - 50;
  }

  useEffect(() => {
    if (cockDead) {
      setCurrentImage(DeadCockImg);
      setIsMoving(false);
    }
  }, [cockDead]);

  // Animate whenever targetLane changes
  useEffect(() => {
    if (targetLane !== null && targetLane > currentLane && !cockDead) {
      setIsMoving(true);
      setPosition({ left: calculateLanePosition(targetLane) });

      const distance = targetLane - currentLane;
      const animationTime = Math.min(800, 300 * distance);

      const timer = setTimeout(() => {
        setIsMoving(false);
        onMoveComplete();
      }, animationTime);

      return () => clearTimeout(timer);
    }
  }, [targetLane, currentLane, cockDead, onMoveComplete]);

  // Toggle walk frames if isMoving
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
          bottom: "100px",
          width: "85px",
          height: "85px",
          transition: cockDead ? "none" : "left 0.8s cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      />
    </div>
  );
}

export default CockUi;
