import { useState, useEffect } from "react";
import CockImg from "../assets/standing_clock.svg";
import CockMovingImg1 from "../assets/cock_walk_1.svg";
import CockMovingImg2 from "../assets/cock_walk_2.svg";

interface CockUiProps {
  maxWidth: number;
  maxHeight: number;
  targetLane: number | null;
  currentLane: number;
  onMoveComplete: () => void;
  onHenLaneChange: (laneIndex: number) => void;
  crashLane: number | null;
  gameOver: boolean;
}

function CockUi({
  targetLane,
  currentLane,
  onMoveComplete,
  onHenLaneChange,
  crashLane,
  gameOver,
}: CockUiProps) {
  const laneWidth = 200;
  const [position, setPosition] = useState({ left: calculateLanePosition(currentLane) });
  const [isMoving, setIsMoving] = useState(false);
  const [currentImage, setCurrentImage] = useState(CockImg);

  function calculateLanePosition(lane: number): number {
    if (lane === 0) return 140; // Adjusted to better align with left side
    const leftBackgroundWidth = 240;
    return leftBackgroundWidth + (lane - 1) * laneWidth + laneWidth / 2 - 50;
  }

  useEffect(() => {
    if (targetLane !== null && targetLane > currentLane) {
      setIsMoving(true);
      setPosition({ left: calculateLanePosition(targetLane) });

      const animationTime = Math.min(800, 300 * (targetLane - currentLane));
      const timeout = setTimeout(() => {
        setIsMoving(false);
        onMoveComplete();
        onHenLaneChange(targetLane); // Update hen's current lane
      }, animationTime);

      return () => clearTimeout(timeout);
    }
  }, [targetLane, currentLane, onMoveComplete, onHenLaneChange]);

  // Handle crash lane reached or game over
  useEffect(() => {
    if (
      gameOver || 
      (crashLane !== null && currentLane >= crashLane)
    ) {
      // Add a short delay before handling game end to allow animations to complete
      const timeout = setTimeout(() => {
        // Animation completed and we're at or past crash lane
        // The game end logic will be handled by the parent component
      }, 1000);
      
      return () => clearTimeout(timeout);
    }
  }, [currentLane, crashLane, gameOver]);

  useEffect(() => {
    if (isMoving) {
      const interval = setInterval(() => {
        setCurrentImage((prev) => (prev === CockMovingImg1 ? CockMovingImg2 : CockMovingImg1));
      }, 200);
      return () => clearInterval(interval);
    } else {
      setCurrentImage(CockImg);
    }
  }, [isMoving]);

  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <img
        src={currentImage}
        alt="Hen"
        className="absolute z-20"
        style={{
          left: `${position.left}px`,
          bottom: "80px", // Fixed position from bottom
          width: "100px",
          height: "100px",
          transition: "left 0.8s cubic-bezier(0.33, 1, 0.68, 1)",
        }}
      />
    </div>
  );
}

export default CockUi;