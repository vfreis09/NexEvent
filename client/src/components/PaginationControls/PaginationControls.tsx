import React from "react";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

const buttonBase =
  "flex h-10 min-w-10 shrink-0 items-center justify-center rounded border border-border bg-card px-2 font-mono text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:pointer-events-none disabled:opacity-50";

const PaginationControls: React.FC<PaginationControlsProps> = ({
  currentPage,
  totalPages,
  onPageChange,
}) => {
  if (totalPages <= 1) {
    return null;
  }

  const pageNumbers = [];
  const maxPagesToShow = 3;

  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

  if (endPage - startPage + 1 < maxPagesToShow) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }

  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  return (
    <div className="mt-8 flex items-center justify-center gap-1 sm:gap-2">
      {/* Previous Button */}
      <button
        className={buttonBase}
        onClick={() => onPageChange(currentPage - 1)}
        disabled={currentPage === 1}
        aria-label="Previous page"
      >
        &laquo;
      </button>

      {/* First Page Link - Hidden on extra small screens */}
      {startPage > 1 && (
        <>
          <button
            className={cn(buttonBase, "hidden sm:flex")}
            onClick={() => onPageChange(1)}
          >
            1
          </button>
          {startPage > 2 && (
            <span className="hidden px-1 text-sm text-muted-foreground sm:inline">
              ...
            </span>
          )}
        </>
      )}

      {/* Page Numbers */}
      {pageNumbers.map((page) => (
        <button
          key={page}
          className={cn(
            buttonBase,
            page === currentPage &&
              "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          )}
          onClick={() => onPageChange(page)}
        >
          {page}
        </button>
      ))}

      {/* Last Page Link - Hidden on extra small screens */}
      {endPage < totalPages && (
        <>
          {endPage < totalPages - 1 && (
            <span className="hidden px-1 text-sm text-muted-foreground sm:inline">
              ...
            </span>
          )}
          <button
            className={cn(buttonBase, "hidden sm:flex")}
            onClick={() => onPageChange(totalPages)}
          >
            {totalPages}
          </button>
        </>
      )}

      {/* Next Button */}
      <button
        className={buttonBase}
        onClick={() => onPageChange(currentPage + 1)}
        disabled={currentPage === totalPages}
        aria-label="Next page"
      >
        &raquo;
      </button>
    </div>
  );
};

export default PaginationControls;