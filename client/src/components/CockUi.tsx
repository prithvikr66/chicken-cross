import CockImg from "../assets/standing_clock.svg";
import CockMovingImg1 from "../assets/cock_walk_1.svg";
import CockMovingImg2 from "../assets/cock_walk_2.svg";
import { useState, useEffect } from "react";

interface CockUiProps {
  maxWidth: number;
  maxHeight: number;
  targetLane: number | null;
  currentLane: number;
  onMoveComplete: () => void;
}

function CockUi({ maxWidth, maxHeight, targetLane, currentLane, onMoveComplete }: CockUiProps) {
  const laneWidth = 200;
  const [position, setPosition] = useState({ left: calculateLanePosition(currentLane) });
  const [isMoving, setIsMoving] = useState(false);
  const [currentImage, setCurrentImage] = useState(CockImg);

  function calculateLanePosition(lane: number): number {
    if (lane === 0) return 100;
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
      }, animationTime);

      return () => clearTimeout(timeout);
    }
  }, [targetLane, currentLane, onMoveComplete]);

  useEffect(() => {
    if (isMoving) {
      const interval = setInterval(() => {
        setCurrentImage(prev => prev === CockMovingImg1 ? CockMovingImg2 : CockMovingImg1);
      }, 200);
      return () => clearInterval(interval);
    } else {
      setCurrentImage(CockImg);
    }
  }, [isMoving]);

  return (
    <div className="absolute inset-0 flex items-center" style={{ height: maxHeight }}>
      <img
        src={currentImage}
        alt="Hen"
        className="absolute"
        style={{
          left: `${position.left}px`,
          top: "50%",
          transform: "translateY(-50%)",
          transition: "left 0.8s cubic-bezier(0.33, 1, 0.68, 1)",
          width: "100px",
          height: "100px",
        }}
      />
    </div>
  );
}

export default CockUi;