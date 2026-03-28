const STATE_LABELS: Record<string, string> = {
  approved: "Approved",
  executing: "Executing",
  review_pending: "Review pending",
  gap_fixing: "Gap fixing",
  ready_for_acceptance: "Ready for acceptance",
  blocked_by_spec: "Blocked by spec",
  escalated: "Escalated",
  done: "Done",
};

export function formatStateLabel(state: string) {
  return STATE_LABELS[state] ?? state.replaceAll("_", " ");
}
