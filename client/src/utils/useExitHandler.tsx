import { useEffect } from "react";

const useExitHandler = (
  seedPairId: string,
  betAmount: number,
  crashLane: any | null
) => {
  useEffect(() => {
    const handleExit = async () => {
      if (!seedPairId || betAmount === undefined) return;

      const payload = {
        seedPairId,
        betAmount,
        crashLane,
      };

      try {
        const token = localStorage.getItem("authToken");
        if (!token) return;
        await fetch(`${import.meta.env.VITE_BACKEND_URI}/api/seeds/crash`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(payload),
          keepalive: true,
        });
      } catch (error) {
        console.error("Failed to send exit request:", error);
      }
    };

    window.addEventListener("beforeunload", handleExit);
    window.addEventListener("unload", handleExit);

    return () => {
      window.removeEventListener("beforeunload", handleExit);
      window.removeEventListener("unload", handleExit);
    };
  }, [seedPairId, betAmount, crashLane]);
};

export default useExitHandler;
