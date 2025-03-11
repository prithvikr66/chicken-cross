import React, { useState, useEffect, useRef } from "react";
import Car1Img from "../assets/car_1.svg";
import Car2Img from "../assets/car_2.svg";

interface CarUiProps {
  difficulty: "easy" | "medium" | "hard" | "daredevil";
  henLane: number;
  roadWidth: number;
  forceCrashCar?: boolean;
  crashLane?: number;
  onCrashPass?: () => void;      // when the crash car passes over the cock
  onCrashComplete?: () => void;  // when the crash car exits fully
}

interface CarType {
  id: number;
  lane: number;
  image: string;
  top: number;         // from -50% to 120%
  isCrashCar?: boolean;
  travelTime: number;  // each car's unique speed
}

// Lane count
function getLaneCount(diff: "easy" | "medium" | "hard" | "daredevil") {
  return diff === "daredevil" ? 5 : 6;
}

// Normal speeds for random cars
const speedMap: Record<"easy" | "medium" | "hard" | "daredevil", number> = {
  easy: 5000,
  medium: 2000,
  hard: 800,
  daredevil: 500,
};

// We define a fixed, fast speed for the forced crash car.
const FORCED_CRASH_CAR_SPEED = 700;

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

  // The difficulty used for **new random spawns** (not the forced crash car)
  const [spawnDifficulty, setSpawnDifficulty] = useState(difficulty);
  useEffect(() => {
    // If difficulty changes, new random cars use the new difficulty’s speed
    setSpawnDifficulty(difficulty);
  }, [difficulty]);

  // Track which lanes have been crossed => skip random spawns in them
  const crossedLanesRef = useRef<number[]>([]);
  useEffect(() => {
    const arr: number[] = [];
    for (let i = 1; i <= henLane; i++) {
      arr.push(i);
    }
    crossedLanesRef.current = arr;
  }, [henLane]);

  // -------------------------------------------------------------------------
  // SPAWN RANDOM CARS on an interval
  // -------------------------------------------------------------------------
  useEffect(() => {
    const interval = setInterval(() => {
      setCars((prevCars) => {
        const laneCount = getLaneCount(spawnDifficulty);
        const speed = speedMap[spawnDifficulty]; // normal speed for random cars

        // pick a lane
        const availableLanes = Array.from({ length: laneCount }, (_, i) => i + 1).filter(
          (lane) =>
            // skip lanes the hen has already crossed
            !crossedLanesRef.current.includes(lane) &&
            // skip lanes that already have a random car traveling
            !prevCars.some((c) => c.lane === lane && !c.isCrashCar)
        );
        if (availableLanes.length === 0) return prevCars;

        const lane = availableLanes[Math.floor(Math.random() * availableLanes.length)];
        const images = [Car1Img, Car2Img];
        const image = images[Math.floor(Math.random() * images.length)];

        const id = nextId.current++;
        const newCar: CarType = {
          id,
          lane,
          image,
          top: -50,
          travelTime: speed,   // normal difficulty-based speed
        };

        // Animate it downward
        setTimeout(() => {
          setCars((current) =>
            current.map((c) => (c.id === id ? { ...c, top: 120 } : c))
          );
        }, 50);

        // Remove after it travels off the screen
        setTimeout(() => {
          setCars((current) => current.filter((c) => c.id !== id));
        }, speed + 100);

        return [...prevCars, newCar];
      });
    }, 2000);

    return () => clearInterval(interval);
  }, [spawnDifficulty]);

  // -------------------------------------------------------------------------
  // FORCE-SPAWN CRASH CAR (FAST)
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (forceCrashCar && crashLane) {
      const id = nextId.current++;
      setCrashCarId(id);

      // Force crash car always uses the FAST travel time
      const newCar: CarType = {
        id,
        lane: crashLane,
        image: Car1Img, 
        top: -50,
        isCrashCar: true,
        travelTime: FORCED_CRASH_CAR_SPEED,  // <-- override normal difficulty speed
      };

      setCars((prev) => [...prev, newCar]);

      // Animate it downward quickly
      setTimeout(() => {
        setCars((cur) =>
          cur.map((car) => (car.id === id ? { ...car, top: 120 } : car))
        );
      }, 50);

      // Remove after it exits
      setTimeout(() => {
        setCars((cur) => cur.filter((c) => c.id !== id));
      }, FORCED_CRASH_CAR_SPEED + 100);
    }
  }, [forceCrashCar, crashLane]);

  // -------------------------------------------------------------------------
  // Watch the crash car => trigger onCrashPass, onCrashComplete
  // -------------------------------------------------------------------------
  useEffect(() => {
    if (crashCarId === null) return;

    const crashCar = cars.find((c) => c.id === crashCarId);
    // If the crash car is gone => it fully exited
    if (!crashCar) {
      onCrashComplete?.();
      return;
    }
    // If it’s near ~50% top => call onCrashPass
    if (!hasPassedRef.current && crashCar.top >= 50) {
      hasPassedRef.current = true;
      onCrashPass?.();
    }
  }, [cars, crashCarId, onCrashPass, onCrashComplete]);

  // -------------------------------------------------------------------------
  // RENDER
  // -------------------------------------------------------------------------
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
            transitionDuration: `${car.travelTime}ms`, // each car's unique speed
          }}
        >
          <img src={car.image} alt="Car" className="w-[400px] h-[150px]" />
        </div>
      ))}
    </div>
  );
};

export default CarUi;
