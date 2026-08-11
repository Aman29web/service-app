import React from "react";

const Loader = ({
  size = "md",
  text = "",
  fullScreen = false,
}) => {
  const sizes = {
    sm: "h-4 w-4 border-2",
    md: "h-8 w-8 border-3",
    lg: "h-12 w-12 border-4",
  };

  const loader = (
    <div className="flex flex-col items-center justify-center gap-3">
      <span
        className={`
          inline-block
          animate-spin
          rounded-full
          border-slate-300
          border-t-blue-600
          ${sizes[size] || sizes.md}
        `}
        role="status"
        aria-label="Loading"
      />

      {text && (
        <p className="text-sm text-slate-500">
          {text}
        </p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
        {loader}
      </div>
    );
  }

  return (
    <div className="flex min-h-[200px] w-full items-center justify-center">
      {loader}
    </div>
  );
};

export default Loader;