
import React from 'react';

interface FosforosProps {
  points: number;
  pendingPoints?: number;
  colorClass?: string;
}

const Fosforos: React.FC<FosforosProps> = ({ points, pendingPoints = 0, colorClass = "bg-emerald-500" }) => {
  const renderBlock = (confirmedInBlock: number, pendingInBlock: number, index: number) => {
    const lineBase = "absolute transition-all duration-500 rounded-full";
    const activeLine = `${colorClass} shadow-[0_0_12px_rgba(255,255,255,0.2)]`;
    const pendingLine = "bg-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)] animate-pulse";
    const inactiveLine = "bg-white/[0.04]";

    const getLineStyle = (lineIndex: number) => {
      if (confirmedInBlock >= lineIndex) return activeLine;
      if (confirmedInBlock + pendingInBlock >= lineIndex) return pendingLine;
      return inactiveLine;
    };

    return (
      <div key={index} className="relative w-14 h-14 m-1 flex items-center justify-center">
        {/* Top */}
        <div className={`${lineBase} top-0 left-1 right-1 h-[5px] ${getLineStyle(1)}`} />
        {/* Right */}
        <div className={`${lineBase} top-1 right-0 bottom-1 w-[5px] ${getLineStyle(2)}`} />
        {/* Bottom */}
        <div className={`${lineBase} bottom-0 left-1 right-1 h-[5px] ${getLineStyle(3)}`} />
        {/* Left */}
        <div className={`${lineBase} top-1 left-0 bottom-1 w-[5px] ${getLineStyle(4)}`} />
        {/* Diagonal */}
        <div className={`${lineBase} top-1 left-1 w-[5px] h-[130%] origin-top-left -rotate-45 ${getLineStyle(5)}`} />
      </div>
    );
  };

  const blocksArray = [];
  let remainingConfirmed = points - pendingPoints;
  let remainingPending = pendingPoints;

  for (let i = 0; i < 6; i++) {
    const confirmedInBlock = Math.min(Math.max(remainingConfirmed, 0), 5);
    remainingConfirmed -= 5;

    const spaceInBlock = 5 - confirmedInBlock;
    const pendingInBlock = Math.min(Math.max(remainingPending, 0), spaceInBlock);
    remainingPending -= pendingInBlock;

    blocksArray.push(renderBlock(confirmedInBlock, pendingInBlock, i));
  }

  return (
    <div className="grid grid-cols-2 gap-x-4 gap-y-3">
      {blocksArray}
    </div>
  );
};

export default Fosforos;
