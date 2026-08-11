import React from "react";
import Button from "./Button";

const EmptyState = ({
  title = "No data found",
  description = "There is nothing to display here yet.",
  actionLabel = "",
  onAction,
  icon = null,
}) => {
  return (
    <div className="flex min-h-[280px] flex-col items-center justify-center rounded-xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center">
      {icon ? (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-500">
          {icon}
        </div>
      ) : (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-xl font-semibold text-slate-400">
          —
        </div>
      )}

      <h3 className="text-base font-semibold text-slate-900">
        {title}
      </h3>

      <p className="mt-1.5 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>

      {actionLabel && onAction && (
        <Button
          className="mt-5"
          onClick={onAction}
        >
          {actionLabel}
        </Button>
      )}
    </div>
  );
};

export default EmptyState;