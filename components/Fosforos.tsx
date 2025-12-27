
import React from 'react';

interface FosforosProps {
  points: number;
  colorClass?: string;
}

const Fosforos: React.FC<FosforosProps> = ({ points, colorClass = "bg-emerald-500" }) => {
  const renderBlock = (p: number, index: number) => {
    const currentBlockPoints = Math.min(Math.max(p, 0), 5);
    const lineBase = "absolute transition-all duration-500 rounded-full";
    const activeLine = `${colorClass} shadow-[0_0_12px_rgba(255,255,255,0.2)]`;
    const inactiveLine = "bg-white/[0.04]";
    
    return (
      <div key={index} className="relative w-14 h-14 m-1 flex items-center justify-center">
        {/* Top */}
        <div className={`${lineBase} top-0 left-1 right-1 h-[5px] ${currentBlockPoints >= 1 ? activeLine : inactiveLine}`} />
        {/* Right */}
        <div className={`${lineBase} top-1 right-0 bottom-1 w-[5px] ${currentBlockPoints >= 2 ? activeLine : inactiveLine}`} />
        {/* Bottom */}
        <div className={`${lineBase} bottom-0 left-1 right-1 h-[5px] ${currentBlockPoints >= 3 ? activeLine : inactiveLine}`} />
        {/* Left */}
        <div className={`${lineBase} top-1 left-0 bottom-1 w-[5px] ${currentBlockPoints >= 4 ? activeLine : inactiveLine}`} />
        {/* Diagonal */}
        <div className={`${lineBase} top-1 left-1 w-[5px] h-[130%] origin-top-left -rotate-45 ${currentBlockPoints >= 5 ? activeLine : inactiveLine}`} />
      </div>
    );
  };

  const blocksArray = [];
  let remainingPoints = points;
  for (let i = 0; i < 6; i++) {
    blocksArray.push(renderBlock(remainingPoints, i));
    remainingPoints -= 5;
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {blocksArray}
    </div>
  );
};

export default Fosforos;
