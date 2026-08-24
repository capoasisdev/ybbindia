import React from "react";

interface SealProps {
  size?: number;
  text?: string;
  className?: string;
  isDark?: boolean;
}

export const Seal: React.FC<SealProps> = ({
  size = 74,
  text = "ABB",
  className = "",
  isDark = false,
}) => {
  const borderColor = isDark ? "border-[#E7CE9C]" : "border-[#8C6425]";
  const textColor = isDark ? "text-[#E7CE9C]" : "text-[#8C6425]";

  return (
    <div
      style={{ width: size, height: size }}
      className={`seal ${borderColor} ${className}`}
    >
      <span className={`${textColor}`} style={{ fontSize: size * 0.22 }}>
        {text}
      </span>
    </div>
  );
};
