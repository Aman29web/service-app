import React from "react";

const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  maxVisiblePages = 5,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const getPages = () => {
    const pages = [];

    if (totalPages <= maxVisiblePages + 2) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }

      return pages;
    }

    pages.push(1);

    let start = Math.max(
      2,
      currentPage - Math.floor(maxVisiblePages / 2)
    );

    let end = Math.min(
      totalPages - 1,
      start + maxVisiblePages - 1
    );

    if (end - start < maxVisiblePages - 1) {
      start = Math.max(2, end - maxVisiblePages + 1);
    }

    if (start > 2) {
      pages.push("left-ellipsis");
    }

    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (end < totalPages - 1) {
      pages.push("right-ellipsis");
    }

    pages.push(totalPages);

    return pages;
  };

  const pages = getPages();

  const handlePageChange = (page) => {
    if (
      page < 1 ||
      page > totalPages ||
      page === currentPage
    ) {
      return;
    }

    onPageChange?.(page);
  };

  return (
    <nav
      className="flex flex-col items-center justify-between gap-3 border-t border-slate-200 pt-4 sm:flex-row"
      aria-label="Pagination"
    >
      <p className="text-sm text-slate-500">
        Page{" "}
        <span className="font-medium text-slate-700">
          {currentPage}
        </span>{" "}
        of{" "}
        <span className="font-medium text-slate-700">
          {totalPages}
        </span>
      </p>

      <div className="flex items-center gap-1">
        <button
          type="button"
          disabled={currentPage === 1}
          onClick={() => handlePageChange(currentPage - 1)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {pages.map((page) => {
          if (typeof page !== "number") {
            return (
              <span
                key={page}
                className="px-2 text-sm text-slate-400"
              >
                ...
              </span>
            );
          }

          const isActive = page === currentPage;

          return (
            <button
              key={page}
              type="button"
              onClick={() => handlePageChange(page)}
              aria-current={isActive ? "page" : undefined}
              className={`
                hidden
                min-w-9
                rounded-md
                border
                px-3
                py-2
                text-sm
                transition
                sm:block
                ${
                  isActive
                    ? "border-blue-600 bg-blue-600 text-white"
                    : "border-slate-300 bg-white text-slate-600 hover:bg-slate-50"
                }
              `}
            >
              {page}
            </button>
          );
        })}

        <button
          type="button"
          disabled={currentPage === totalPages}
          onClick={() => handlePageChange(currentPage + 1)}
          className="rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </nav>
  );
};

export default Pagination;