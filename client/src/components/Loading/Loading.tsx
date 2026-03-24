import "./Loading.css";

type LoadingVariant = "spinner" | "page" | "skeleton";

interface LoadingProps {
  variant?: LoadingVariant;
  text?: string;
  count?: number;
}

function SkeletonCard() {
  return (
    <div className="loading-skeleton-card">
      <div className="skeleton-line skeleton-title" />
      <div className="skeleton-line skeleton-subtitle" />
      <div className="skeleton-line skeleton-body" />
      <div className="skeleton-line skeleton-body skeleton-body--short" />
      <div className="skeleton-footer">
        <div className="skeleton-line skeleton-tag" />
        <div className="skeleton-line skeleton-tag" />
        <div className="skeleton-line skeleton-btn" />
      </div>
    </div>
  );
}

function Loading({ variant = "spinner", text, count = 3 }: LoadingProps) {
  if (variant === "skeleton") {
    return (
      <div className="loading-skeleton-grid">
        {Array.from({ length: count }).map((_, i) => (
          <SkeletonCard key={i} />
        ))}
      </div>
    );
  }

  const spinner = (
    <div
      className="loading-spinner"
      role="status"
      aria-label={text ?? "Loading"}
    >
      <div className="loading-spinner__ring" />
    </div>
  );

  if (variant === "page") {
    return (
      <div className="loading-page">
        {spinner}
        {text && <p className="loading-page__text">{text}</p>}
      </div>
    );
  }

  return (
    <div className="loading-inline">
      {spinner}
      {text && <span className="loading-inline__text">{text}</span>}
    </div>
  );
}

export default Loading;
