type ToastProps = {
  message: string | null;
  actionLabel?: string;
  onAction?: () => void;
};

export default function Toast({ message, actionLabel, onAction }: ToastProps) {
  if (!message) return null;
  return (
    <div className="toast">
      <span>{message}</span>
      {actionLabel && onAction && (
        <button type="button" className="toast-action" onClick={onAction}>
          {actionLabel}
        </button>
      )}
    </div>
  );
}