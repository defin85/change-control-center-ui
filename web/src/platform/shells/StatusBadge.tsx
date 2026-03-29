type StatusBadgeProps = {
  status: string;
  label?: string;
  className?: string;
};

export function StatusBadge({ status, label, className }: StatusBadgeProps) {
  const classes = ["state-pill", status, className].filter(Boolean).join(" ");

  return (
    <span className={classes} data-platform-shell="status-badge">
      {label ?? status}
    </span>
  );
}
