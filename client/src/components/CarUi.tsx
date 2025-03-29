import React, { useState, useEffect, useRef } from "react";
import Car1Img from "../assets/car_1.svg";
import Car2Img from "../assets/car_2.svg";
import Car3Img from "../assets/car_3.svg";
import Car4Img from "../assets/car_4.svg";
import Car5Img from "../assets/car_5.svg";

// Type definitions
interface CarUiProps {
  difficulty: "easy" | "medium" | "hard" | "daredevil";
  henLane: number;
  roadWidth: number;
  forceCrashCar?: boolean;
  crashLane?: number;
  onCrashPass?: () => void;
  multipliers: number[];
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

// How fast each car travels from top to bottom (in ms).
const speedMap: Record<"easy" | "medium" | "hard" | "daredevil", number> = {
  easy: 2000,
  medium: 1500,
  hard: 1000,
  daredevil: 600,
};

// How many cars spawn each interval for each difficulty
const spawnCountMap: Record<"easy" | "medium" | "hard" | "daredevil", number> = {
  easy: 2,
  medium: 4,
  hard: 6,
  daredevil: 8,
};

// If crash car is forced, we can override its speed if needed
const FORCED_CRASH_SPEED = 700;

const CarUi: React.FC<CarUiProps> = ({
  difficulty,
  henLane,
  roadWidth,
  forceCrashCar,
  multipliers,
  crashLane,
  onCrashPass,
  onCrashComplete,
}) => {
  const [cars, setCars] = useState<CarType[]>([]);
  const nextId = useRef(0);

  // For forced crash logic
  const [crashCarId, setCrashCarId] = useState<number | null>(null);
  const hasPassedRef = useRef(false);

  // Keep current difficulty in state so it can be changed mid-game if needed
  const [spawnDifficulty, setSpawnDifficulty] = useState(difficulty);
  useEffect(() => {
    setSpawnDifficulty(difficulty);
  }, [difficulty]);

  // Keep track of lanes the hen has crossed => we won't spawn cars immediately after
  const crossedLanesRef = useRef<number[]>([]);
  useEffect(() => {
    if (henLane > 0) {
      const arr: number[] = [];
      // for example: skip spawning for lanes that are too close to the hen
      for (let i = 1; i <= henLane + 2; i++) {
        arr.push(i);
      }
      crossedLanesRef.current = arr;
    }
  }, [henLane]);

  // Spawn random cars on an interval
  useEffect(() => {
    const speed = speedMap[spawnDifficulty];
    // shorter intervals if difficulty is higher
    const intervalDelay = speed / 2;

    const interval = setInterval(() => {
      setCars((prev) => {
        const laneCount = multipliers.length;
        const availableLanes = Array.from({ length: laneCount }, (_, i) => i + 1).filter(
          (lane) =>
            lane !== 1 &&
            !crossedLanesRef.current.includes(lane) &&
            // Only exclude lanes that currently have a "non-crash" car in them
            !prev.some((car) => car.lane === lane && !car.isCrashCar)
        );

        // If no lanes are available, skip
        if (availableLanes.length === 0) return prev;

        // Number of cars to spawn at once
        const spawnCount = spawnCountMap[spawnDifficulty];
        const newCars: CarType[] = [];
        const images = [Car1Img, Car2Img, Car3Img, Car4Img, Car5Img];

        for (let i = 0; i < spawnCount; i++) {
          // If no more free lanes remain, break
          if (availableLanes.length === 0) break;

          // Pick a random lane from available
          const randomIndex = Math.floor(Math.random() * availableLanes.length);
          const lane = availableLanes[randomIndex];
          // Remove it from availability so we don't spawn multiple cars in same lane simultaneously
          availableLanes.splice(randomIndex, 1);

          // Pick a random car image
          const image = images[Math.floor(Math.random() * images.length)];

          const id = nextId.current++;
          newCars.push({
            id,
            lane,
            image,
            top: -50,
            travelTime: speed,
          });
        }

        // Animate each newly added car downward
        setTimeout(() => {
          setCars((cur) =>
            cur.map((c) =>
              newCars.find((nc) => nc.id === c.id) ? { ...c, top: 120 } : c
            )
          );
        }, 50);

        // Remove cars after they traveled
        setTimeout(() => {
          setCars((cur) =>
            cur.filter((c) => !newCars.some((nc) => nc.id === c.id))
          );
        }, speed + 100);

        return [...prev, ...newCars];
      });
    }, intervalDelay);

    return () => clearInterval(interval);
  }, [spawnDifficulty, multipliers]);

  // If forced crash car is triggered
  useEffect(() => {
    if (forceCrashCar && crashLane) {
      const id = nextId.current++;
      setCrashCarId(id);

      const newCar: CarType = {
        id,
        lane: crashLane,
        image: Car1Img, // choose whichever image you like
        top: -50,
        isCrashCar: true,
        travelTime: FORCED_CRASH_SPEED,
      };

      // Add forced crash car
      setCars((prev) => [...prev, newCar]);

      // Animate downward
      setTimeout(() => {
        setCars((cur) =>
          cur.map((c) => (c.id === id ? { ...c, top: 120 } : c))
        );
      }, 50);

      // Remove after traveling
      setTimeout(() => {
        setCars((cur) => cur.filter((c) => c.id !== id));
      }, FORCED_CRASH_SPEED + 100);
    }
  }, [forceCrashCar, crashLane]);

  // Monitor crash car => trigger onCrashPass and onCrashComplete
  useEffect(() => {
    if (crashCarId === null) return;
    const crashCar = cars.find((c) => c.id === crashCarId);
    if (!crashCar) {
      // Crash car fully exited
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
