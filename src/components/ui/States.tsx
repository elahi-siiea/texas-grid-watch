export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div role="alert" className="flex flex-col items-start gap-3 rounded border border-line p-4">
      <p className="font-medium">This data could not be loaded.</p>
      <p className="text-sm text-soft">{message}</p>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="rounded border border-ink px-3 py-2 text-sm font-medium hover:bg-accent-soft"
        >
          Try again
        </button>
      )}
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded border border-dashed border-line p-6 text-center text-sm text-soft">{message}</div>
  );
}
