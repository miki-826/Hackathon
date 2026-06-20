"use client";

import { useEffect, useState } from "react";

export default function CountdownScreen({ onDone }: { onDone: () => void }) {
  const [n, setN] = useState(3);

  useEffect(() => {
    if (n <= 0) {
      const t = setTimeout(onDone, 350);
      return () => clearTimeout(t);
    }
    const t = setTimeout(() => setN((v) => v - 1), 800);
    return () => clearTimeout(t);
  }, [n, onDone]);

  return (
    <div className="absolute inset-0 z-20 flex items-center justify-center bg-sumi/55">
      <span
        key={n}
        className="cut-pop font-brush text-[28vmin] leading-none text-kin drop-shadow-[0_6px_20px_rgba(0,0,0,0.9)]"
      >
        {n > 0 ? n : "斬"}
      </span>
    </div>
  );
}
