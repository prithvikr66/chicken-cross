import React, { useState, useEffect, useRef } from "react";
import Car1Img from "../assets/car_1.svg";
import Car2Img from "../assets/car_2.svg";
import Car3Img from "../assets/car_3.svg";
import Car4Img from "../assets/car_4.svg";
import Car5Img from "../assets/car_5.svg";

interface CarUiProps {
  difficulty: "easy" | "medium" | "hard" | "daredevil";
  henLane: number;
  roadWidth: number;
  forceCrashCar?: boolean;
  crashLane?: number;
  onCrashPass?: () => void;
  onCrashComplete?: () => void;
}

interface CarType {
  id: number;
  lane: number;
  image: string;
  top: number; // -50% to 120%
  isCrashCar?: boolean;
  travelTime: number;
}

function getLaneCount(diff: "easy" | "medium" | "hard" | "daredevil") {
  return diff === "daredevil" ? 5 : 6;
}

const speedMap: Record<"easy" | "medium" | "hard" | "daredevil", number> = {
  easy: 2000,
  medium: 1000,
  hard: 600,
  daredevil: 500,
};

// crash car could be forced to go faster, if you want
const FORCED_CRASH_SPEED = 700;

const CarUi: React.FC<CarUiProps> = ({
  difficulty,
  henLane,
  roadWidth,
  forceCrashCar,
  crashLane,
  onCrashPass,
  onCrashComplete,
}) => {
  const [cars, setCars] = useState<CarType[]>([]);
  const nextId = useRef(0);

  const [crashCarId, setCrashCarId] = useState<number | null>(null);
  const hasPassedRef = useRef(false);

  // We'll store the difficulty for new random spawns
  const [spawnDifficulty, setSpawnDifficulty] = useState(difficulty);
  useEffect(() => {
    setSpawnDifficulty(difficulty);
  }, [difficulty]);

  // Track lanes the hen has crossed => skip random spawns
  const crossedLanesRef = useRef<number[]>([]);
  useEffect(() => {
    if (henLane > 0) {
      const arr: number[] = [];
      for (let i = 1; i <= henLane+1; i++) {
        arr.push(i);
      }
      crossedLanesRef.current = arr;
    }
  }, [henLane]);

  // Spawn random cars
  useEffect(() => {
    const interval = setInterval(() => {
      setCars((prev) => {
        const laneCount = getLaneCount(spawnDifficulty);
        const speed = speedMap[spawnDifficulty];

        const available = Array.from({ length: laneCount }, (_, i) => i + 1).filter(
          (lane) =>
            !crossedLanesRef.current.includes(lane) &&
            !prev.some((car) => car.lane === lane && !car.isCrashCar)
        );
        if (available.length === 0) return prev;

        const lane = available[Math.floor(Math.random() * available.length)];
        const images = [Car1Img, Car2Img,Car3Img,Car4Img,Car5Img];
        const image = images[Math.floor(Math.random() * images.length)];

        const id = nextId.current++;
        const newCar: CarType = {
          id,
          lane,
          image,
          top: -50,
          travelTime: speed,
        };

        // animate down
        setTimeout(() => {
          setCars((cur) => cur.map((c) => (c.id === id ? { ...c, top: 120 } : c)));
        }, 50);

        // remove after traveling
        setTimeout(() => {
          setCars((cur) => cur.filter((c) => c.id !== id));
        }, speed + 100);

        return [...prev, newCar];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [spawnDifficulty]);

  // Force crash car if hen hits crash lane
  useEffect(() => {
    if (forceCrashCar && crashLane) {
      const id = nextId.current++;
      setCrashCarId(id);
      const newCar: CarType = {
        id,
        lane: crashLane,
        image: Car1Img,
        top: -50,
        isCrashCar: true,
        travelTime: FORCED_CRASH_SPEED,
      };

      setCars((prev) => [...prev, newCar]);

      // animate down
      setTimeout(() => {
        setCars((cur) => cur.map((c) => (c.id === id ? { ...c, top: 120 } : c)));
      }, 50);

      setTimeout(() => {
        setCars((cur) => cur.filter((c) => c.id !== id));
      }, FORCED_CRASH_SPEED + 100);
    }
  }, [forceCrashCar, crashLane]);

  // monitor crash car => onCrashPass / onCrashComplete
  useEffect(() => {
    if (crashCarId === null) return;
    const crashCar = cars.find((c) => c.id === crashCarId);
    if (!crashCar) {
      // fully exited
      onCrashComplete?.();
      return;
    }
    if (!hasPassedRef.current && crashCar.top >= 50) {
      hasPassedRef.current = true;
      onCrashPass?.();
    }
  }, [cars, crashCarId, onCrashPass, onCrashComplete]);

  return (
    <div className="relative w-full h-full overflow-hidden z-30">
      {cars.map((car) => (
        <div
          key={car.id}
          className="absolute transition-all ease-linear z-30"
          style={{
            top: `${car.top}%`,
            left: `${(car.lane - 1) * roadWidth}px`,
            width: `${roadWidth}px`,
            height: "100px",
            display: "flex",
            justifyContent: "center",
            transitionDuration: `${car.travelTime}ms`,
          }}
        >
          <img src={car.image} alt="Car" className="w-[400px] h-[150px]" />
        </div>
      ))}
    </div>
  );
};

export default CarUi;
