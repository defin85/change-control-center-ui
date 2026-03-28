const workflowStates = [
  "draft",
  "approved",
  "executing",
  "review_pending",
  "gap_fixing",
  "ready_for_acceptance",
  "done",
  "blocked_by_spec",
  "escalated",
];

const data = {
  views: [
    { id: "inbox", label: "Inbox", hint: "All active changes" },
    { id: "ready", label: "Ready", hint: "Actionable now" },
    { id: "review", label: "Review gaps", hint: "Findings need closure" },
    { id: "looping", label: "Looping", hint: "Recurring findings" },
    { id: "blocked", label: "Blocked", hint: "Spec or runtime blockers" },
    { id: "done", label: "Done", hint: "Recently closed" },
  ],
  changes: [
    {
      id: "ch-142",
      title: "Big-bang cutover на OperationExposure",
      subtitle: "Single-release removal of legacy template projection",
      state: "review_pending",
      createdAt: "2026-03-27T10:00:00Z",
      updatedAt: "2026-03-28T15:49:00Z",
      owner: "codex-chief",
      lastRunAgo: "14m ago",
      blocker: "Recurring gap on default runtime wiring",
      nextAction: "Compact review",
      requirementsLinked: 9,
      requirementsTotal: 12,
      loopCount: 2,
      specStatus: "approved",
      verificationStatus: "partial",
      summary:
        "Change approved and implemented in first pass. Review still reports recurring runtime-path mismatch and missing proof for one mandatory requirement.",
      policy: {
        maxAutoCycles: 3,
        escalationRule: "fingerprint repeated twice",
        acceptanceGate: "Req -> Code -> Test",
      },
      chiefHistory: [
        {
          at: "15:49",
          title: "Chief routed change into compact review",
          note: "Loop detector saw recurring fingerprint on R-14 and reduced scope to default path only.",
        },
        {
          at: "15:12",
          title: "Targeted finish run closed 3 findings",
          note: "Chief kept the loop alive because one mandatory runtime-path gap still lacked default-path evidence.",
        },
      ],
      traceability: [
        {
          req: "R-12",
          code: "views_templates.py · exposure adapter",
          tests: "test_templates_api.py::test_runtime_contract",
          evidence: "run-29, run-30",
          status: "partial",
        },
        {
          req: "R-13",
          code: "rbac/service.py · alias resolution",
          tests: "test_rbac_template_access.py",
          evidence: "run-29",
          status: "done",
        },
        {
          req: "R-14",
          code: "operations/factory.py · template binding",
          tests: "missing",
          evidence: "gap g-91",
          status: "gap open",
        },
      ],
      runs: [
        {
          id: "run-30",
          type: "review",
          agent: "codex",
          worktree: "wt-142-c",
          result: "partial",
          duration: "08:12",
          outcome: "2 recurring gaps",
          prompt: "/openspec-review-impl-vs-plan-compact ch-142",
          checks: ["pytest targeted ✅", "contract smoke ❌"],
          artifactIds: ["a-301", "a-302"],
          producedGapIds: ["g-91", "g-92"],
          decision: "Keep loop active, but escalate if fingerprint repeats once more.",
        },
        {
          id: "run-29",
          type: "finish",
          agent: "codex",
          worktree: "wt-142-b",
          result: "done",
          duration: "31:44",
          outcome: "closed 3 gaps",
          prompt: "/openspec-finish-to-100 ch-142 (targeted g-81 g-83 g-84)",
          checks: ["pytest unit ✅", "lint ✅"],
          artifactIds: ["a-291", "a-292"],
          producedGapIds: [],
          decision: "Chief accepted targeted fix and requested a narrow re-review.",
        },
        {
          id: "run-28",
          type: "review",
          agent: "codex",
          worktree: "wt-142-a",
          result: "partial",
          duration: "05:01",
          outcome: "5 mandatory gaps",
          prompt: "/openspec-review-impl-vs-plan ch-142",
          checks: ["source review only"],
          artifactIds: ["a-281"],
          producedGapIds: ["g-91", "g-81", "g-83", "g-84", "g-92"],
          decision: "Chief created structured ledger entries and opened the fix loop.",
        },
      ],
      gaps: [
        {
          id: "g-91",
          severity: "high",
          mandatory: true,
          reqRef: "R-14",
          status: "open",
          recurrence: 2,
          fingerprint: "fp_8d21",
          summary: "Default runtime path still binds template through legacy route.",
          firstSeen: "run-28",
          lastSeen: "run-30",
          introducedByRun: "run-28",
          evidence:
            "Review confirms helper code exists, but default operational entry point still resolves the legacy projection.",
        },
        {
          id: "g-92",
          severity: "medium",
          mandatory: true,
          reqRef: "R-12",
          status: "in_fix",
          recurrence: 1,
          fingerprint: "fp_b921",
          summary: "Requirement has code and smoke evidence, but no stable automated test on the default path.",
          firstSeen: "run-28",
          lastSeen: "run-30",
          introducedByRun: "run-28",
          evidence: "Compact review marked status partial due to test gap.",
        },
        {
          id: "g-93",
          severity: "low",
          mandatory: false,
          reqRef: "task 4.1",
          status: "deferred",
          recurrence: 0,
          fingerprint: "fp_0ca2",
          summary: "Docs still mention dual-path rollout language.",
          firstSeen: "run-30",
          lastSeen: "run-30",
          introducedByRun: "run-30",
          evidence: "Narrative docs drift only.",
        },
      ],
      evidence: [
        {
          id: "a-301",
          kind: "review report",
          title: "Compact review output",
          body:
            "Overall status: partial.\nTop findings:\n- R-14 remains implemented but not wired by default.\n- R-12 still lacks stable automated evidence on the default runtime path.\n- No new blockers outside existing recurring fingerprints.",
        },
        {
          id: "a-302",
          kind: "verification",
          title: "Checks from run-30",
          body:
            "pytest tests/templates/test_runtime_contract.py -q\nFAILED 1 test\n\nReason:\nlegacy route still reachable through default runtime wiring.",
        },
        {
          id: "a-291",
          kind: "diff summary",
          title: "Targeted finish diff",
          body:
            "- removed direct OperationTemplate read in rbac path\n- updated adapter layer for exposure alias lookup\n- added focused unit tests for alias resolution",
        },
      ],
      git: {
        worktree: "wt-142-c",
        branch: "ch-142/review-loop",
        changedFiles: 4,
        commitStatus: "not committed",
        prStatus: "no PR",
        mergeReadiness: "not ready",
      },
      timeline: [
        { title: "Go! approved", note: "OpenSpec accepted and execution unlocked." },
        { title: "Beads synchronized", note: "Execution graph created from tasks.md." },
        { title: "Apply run-27", note: "Initial implementation landed in worktree." },
        { title: "Review run-28", note: "5 mandatory gaps recorded into ledger." },
        { title: "Finish run-29", note: "3 gaps closed, 2 remain active." },
        { title: "Review run-30", note: "Recurring fingerprint detected." },
      ],
    },
    {
      id: "ch-143",
      title: "Intercompany pool distribution module",
      subtitle: "Graph engine, publication lifecycle, OData retries",
      state: "executing",
      createdAt: "2026-03-28T15:20:00Z",
      updatedAt: "2026-03-28T16:03:00Z",
      owner: "codex-chief",
      lastRunAgo: "running",
      blocker: "No blocker yet",
      nextAction: "Run review",
      requirementsLinked: 0,
      requirementsTotal: 24,
      loopCount: 0,
      specStatus: "approved",
      verificationStatus: "not started",
      summary:
        "Approved change is currently in the first implementation pass. No review findings yet; chief should not interrupt unless runtime stalls.",
      policy: {
        maxAutoCycles: 3,
        escalationRule: "fingerprint repeated twice",
        acceptanceGate: "Req -> Code -> Test",
      },
      chiefHistory: [
        {
          at: "16:03",
          title: "Apply run launched",
          note: "Chief opened worktree and delegated the first implementation pass to codex.",
        },
      ],
      traceability: [
        {
          req: "R-1",
          code: "not implemented yet",
          tests: "not started",
          evidence: "apply run active",
          status: "todo",
        },
      ],
      runs: [
        {
          id: "run-44",
          type: "apply",
          agent: "codex",
          worktree: "wt-143-a",
          result: "running",
          duration: "19:51",
          outcome: "implementing graph layer",
          prompt: "/openspec-apply ch-143",
          checks: ["not yet"],
          artifactIds: ["a-441"],
          producedGapIds: [],
          decision: "Chief is waiting for implementation completion before review.",
        },
      ],
      gaps: [],
      evidence: [
        {
          id: "a-441",
          kind: "terminal",
          title: "Live apply output",
          body:
            "Worker status:\n- reading tasks.md\n- implementing organization graph models\n- preparing focused tests\n- no user action required",
        },
      ],
      git: {
        worktree: "wt-143-a",
        branch: "detached",
        changedFiles: 11,
        commitStatus: "work in progress",
        prStatus: "no PR",
        mergeReadiness: "unknown",
      },
      timeline: [
        { title: "Go! approved", note: "Stage 2/3 enabled." },
        { title: "Beads synchronized", note: "Epic and child tasks created." },
        { title: "Apply run-44", note: "First implementation wave is in progress." },
      ],
    },
    {
      id: "ch-145",
      title: "OData retry policy hardening",
      subtitle: "Retry semantics and idempotent publication evidence",
      state: "blocked_by_spec",
      createdAt: "2026-03-27T08:40:00Z",
      updatedAt: "2026-03-28T13:42:00Z",
      owner: "codex-chief",
      lastRunAgo: "3h ago",
      blocker: "Spec ambiguity on external document identifier",
      nextAction: "Escalate to architecture/spec",
      requirementsLinked: 4,
      requirementsTotal: 11,
      loopCount: 3,
      specStatus: "ambiguous",
      verificationStatus: "blocked",
      summary:
        "Repeated implementation loops are not converging because the spec still leaves the external document identity strategy unresolved.",
      policy: {
        maxAutoCycles: 3,
        escalationRule: "fingerprint repeated twice",
        acceptanceGate: "Req -> Code -> Test",
      },
      chiefHistory: [
        {
          at: "13:42",
          title: "Chief stopped the loop",
          note: "Recurring ambiguity means further implementation is wasteful until architecture/spec is repaired.",
        },
        {
          at: "13:16",
          title: "Review repeated the same ambiguity",
          note: "GUID vs fallback alias path still unresolved on the default path.",
        },
      ],
      traceability: [
        {
          req: "R-4.4",
          code: "competing branches",
          tests: "n/a",
          evidence: "architecture gap",
          status: "blocked by spec",
        },
      ],
      runs: [
        {
          id: "run-18",
          type: "review",
          agent: "codex",
          worktree: "wt-145-b",
          result: "blocked",
          duration: "07:33",
          outcome: "spec ambiguity confirmed",
          prompt: "/openspec-review-impl-vs-plan ch-145",
          checks: ["source review only"],
          artifactIds: ["a-181"],
          producedGapIds: ["g-1451"],
          decision: "Chief marked change blocked_by_spec and requested architecture review.",
        },
      ],
      gaps: [
        {
          id: "g-1451",
          severity: "high",
          mandatory: true,
          reqRef: "R-4.4",
          status: "blocked_by_spec",
          recurrence: 2,
          fingerprint: "fp_guid",
          summary: "External document identifier strategy unresolved between GUID and fallback alias path.",
          firstSeen: "run-17",
          lastSeen: "run-18",
          introducedByRun: "run-18",
          evidence: "Implementation cannot produce stable default behavior without design decision.",
        },
      ],
      evidence: [
        {
          id: "a-181",
          kind: "review report",
          title: "Blocked review",
          body:
            "Not ready for further implementation.\nThe same design ambiguity keeps reappearing in retries. Escalate to architecture/spec review before any more code loops.",
        },
      ],
      git: {
        worktree: "wt-145-b",
        branch: "ch-145/spec-blocked",
        changedFiles: 2,
        commitStatus: "hold",
        prStatus: "no PR",
        mergeReadiness: "blocked",
      },
      timeline: [
        { title: "Apply run", note: "Retry layer implemented partially." },
        { title: "Review", note: "GUID vs fallback ambiguity found." },
        { title: "Finish retry", note: "Could not converge." },
        { title: "Review", note: "Blocked by spec, escalation required." },
      ],
    },
    {
      id: "ch-146",
      title: "Acceptance proof backfill for telemetry scans",
      subtitle: "Add missing req-to-test linkage for recurring maintenance automation",
      state: "approved",
      createdAt: "2026-03-28T16:10:00Z",
      updatedAt: "2026-03-28T16:11:00Z",
      owner: "codex-chief",
      lastRunAgo: "never",
      blocker: "Waiting for Go! execution",
      nextAction: "Launch apply run",
      requirementsLinked: 0,
      requirementsTotal: 6,
      loopCount: 0,
      specStatus: "approved",
      verificationStatus: "not started",
      summary:
        "Lightweight change with clear scope. This is the cleanest case for chief-orchestrator happy path: apply -> review -> acceptance.",
      policy: {
        maxAutoCycles: 2,
        escalationRule: "only if new mandatory gap appears twice",
        acceptanceGate: "Req -> Code -> Test",
      },
      chiefHistory: [
        {
          at: "16:11",
          title: "Change approved and queued",
          note: "Chief is waiting for explicit execution step.",
        },
      ],
      traceability: [],
      runs: [],
      gaps: [],
      evidence: [],
      git: {
        worktree: "not created",
        branch: "none",
        changedFiles: 0,
        commitStatus: "not started",
        prStatus: "no PR",
        mergeReadiness: "not started",
      },
      timeline: [{ title: "Approved", note: "Ready to enter execution flow." }],
    },
  ],
};

const state = {
  activeView: "inbox",
  activeTab: "overview",
  detailMode: "change",
  selectedChangeId: null,
  selectedRunId: null,
  selectedGapId: null,
  selectedEvidenceId: null,
  search: "",
};

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "traceability", label: "Traceability" },
  { id: "runs", label: "Runs" },
  { id: "gaps", label: "Gaps" },
  { id: "evidence", label: "Evidence" },
  { id: "git", label: "Git" },
  { id: "chief", label: "Chief" },
];

const viewPredicates = {
  inbox: (change) => change.state !== "done",
  ready: (change) =>
    ["approved", "ready_for_acceptance"].includes(change.state) ||
    (change.state === "review_pending" && countOpenMandatoryGaps(change) <= 3),
  review: (change) => ["review_pending", "gap_fixing"].includes(change.state),
  looping: (change) => change.loopCount >= 2 && !["done", "blocked_by_spec", "escalated"].includes(change.state),
  blocked: (change) => ["blocked_by_spec", "escalated"].includes(change.state),
  done: (change) => change.state === "done",
};

let runSequence = 200;
let gapSequence = 500;
let artifactSequence = 800;

const queueList = document.getElementById("queueList");
const viewList = document.getElementById("viewList");
const queueTitle = document.getElementById("queueTitle");
const inspectorContent = document.getElementById("inspectorContent");
const detailIdentity = document.getElementById("detailIdentity");
const detailTabs = document.getElementById("detailTabs");
const detailContent = document.getElementById("detailContent");
const searchInput = document.getElementById("searchInput");
const toast = document.getElementById("toast");
const clearSelectionButton = document.getElementById("clearSelectionButton");
const detailRunNextButton = document.getElementById("detailRunNextButton");
const detailBackToChangeButton = document.getElementById("detailBackToChangeButton");
const detailOpenRunStudioButton = document.getElementById("detailOpenRunStudioButton");
const detailEscalateButton = document.getElementById("detailEscalateButton");
const detailBlockBySpecButton = document.getElementById("detailBlockBySpecButton");

data.changes.forEach(updateChangeMetrics);

document.getElementById("runNextGlobalButton").addEventListener("click", handlePrimaryAction);
clearSelectionButton.addEventListener("click", () => {
  clearSelection();
  render();
});
detailRunNextButton.addEventListener("click", handlePrimaryAction);
detailBackToChangeButton.addEventListener("click", () => {
  state.detailMode = "change";
  render();
});
detailOpenRunStudioButton.addEventListener("click", () => {
  const change = requireSelectedChange();
  if (!change) {
    return;
  }
  const run = getSelectedRun(change);
  if (!run) {
    showToast("Нет выбранного run для run studio.");
    return;
  }
  state.detailMode = "run";
  render();
});
detailEscalateButton.addEventListener("click", () => {
  const change = requireSelectedChange();
  if (!change) {
    return;
  }
  escalateChange(change, "Manual escalation from operator console.");
  render();
});
detailBlockBySpecButton.addEventListener("click", () => {
  const change = requireSelectedChange();
  if (!change) {
    return;
  }
  markBlockedBySpec(change, "Operator marked change blocked by spec.");
  render();
});

searchInput.addEventListener("input", (event) => {
  state.search = event.target.value.trim().toLowerCase();
  render();
});

function countOpenMandatoryGaps(change) {
  return change.gaps.filter((gap) => gap.mandatory && gap.status !== "closed" && gap.status !== "deferred").length;
}

function countOpenOptionalGaps(change) {
  return change.gaps.filter((gap) => !gap.mandatory && gap.status !== "closed" && gap.status !== "deferred").length;
}

function hasRecurringCriticalGap(change) {
  return change.gaps.some(
    (gap) =>
      gap.mandatory &&
      gap.severity === "high" &&
      gap.recurrence >= 2 &&
      gap.status !== "closed" &&
      gap.status !== "deferred",
  );
}

function updateChangeMetrics(change) {
  change.mandatoryGaps = countOpenMandatoryGaps(change);
  change.optionalGaps = countOpenOptionalGaps(change);
  change.readiness = `${change.requirementsLinked} / ${change.requirementsTotal} requirements linked`;
}

function formatStateLabel(value) {
  return value.replaceAll("_", " ");
}

function formatDateTime(value) {
  return new Date(value).toLocaleString("ru-RU", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function stateTone(value) {
  switch (value) {
    case "approved":
      return "state-executing";
    case "executing":
      return "state-executing";
    case "review_pending":
      return "state-review";
    case "gap_fixing":
      return "state-review";
    case "ready_for_acceptance":
      return "state-ready_for_acceptance";
    case "done":
      return "state-gap_fixing";
    case "blocked_by_spec":
      return "state-blocked";
    case "escalated":
      return "state-review";
    default:
      return "state-blocked";
  }
}

function runResultTone(value) {
  switch (value) {
    case "done":
    case "clean":
      return "state-gap_fixing";
    case "partial":
      return "state-review";
    case "blocked":
      return "state-blocked";
    default:
      return "state-executing";
  }
}

function nextRunId() {
  runSequence += 1;
  return `run-${runSequence}`;
}

function nextGapId() {
  gapSequence += 1;
  return `g-${gapSequence}`;
}

function nextArtifactId() {
  artifactSequence += 1;
  return `a-${artifactSequence}`;
}

function nowLabel() {
  return new Date().toLocaleTimeString("ru-RU", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function addChiefEvent(change, title, note) {
  change.chiefHistory.unshift({
    at: nowLabel(),
    title,
    note,
  });
}

function touchChange(change) {
  change.updatedAt = new Date().toISOString();
}

function prependTimeline(change, title, note) {
  change.timeline.push({ title, note });
}

function addEvidence(change, kind, title, body) {
  const artifact = {
    id: nextArtifactId(),
    kind,
    title,
    body,
  };
  change.evidence.unshift(artifact);
  state.selectedEvidenceId = artifact.id;
  return artifact;
}

function addRun(change, run) {
  change.runs.unshift(run);
  state.selectedRunId = run.id;
  return run;
}

function addGap(change, gap) {
  change.gaps.unshift(gap);
  state.selectedGapId = gap.id;
  return gap;
}

function getSelectedChange() {
  return data.changes.find((change) => change.id === state.selectedChangeId) ?? null;
}

function getSelectedRun(change = getSelectedChange()) {
  if (!change) {
    return null;
  }
  return change.runs.find((run) => run.id === state.selectedRunId) ?? change.runs[0] ?? null;
}

function getSelectedGap(change = getSelectedChange()) {
  if (!change) {
    return null;
  }
  return change.gaps.find((gap) => gap.id === state.selectedGapId) ?? change.gaps[0] ?? null;
}

function ensureSelection(change) {
  if (!change) {
    state.selectedRunId = null;
    state.selectedGapId = null;
    state.selectedEvidenceId = null;
    return;
  }

  state.selectedRunId = change.runs[0]?.id ?? null;
  state.selectedGapId = change.gaps[0]?.id ?? null;
  state.selectedEvidenceId = change.evidence[0]?.id ?? null;
}

function clearSelection() {
  state.selectedChangeId = null;
  state.detailMode = "change";
  ensureSelection(null);
}

function requireSelectedChange() {
  const change = getSelectedChange();
  if (!change) {
    showToast("Сначала выберите change из очереди.");
    return null;
  }
  return change;
}

function getFilteredChanges() {
  const predicate = viewPredicates[state.activeView] ?? (() => true);

  return data.changes.filter((change) => {
    if (!predicate(change)) {
      return false;
    }

    if (!state.search) {
      return true;
    }

    const haystack = [
      change.id,
      change.title,
      change.subtitle,
      change.blocker,
      change.nextAction,
      ...change.gaps.map((gap) => `${gap.id} ${gap.summary} ${gap.reqRef}`),
      ...change.runs.map((run) => `${run.id} ${run.type} ${run.outcome}`),
    ]
      .join(" ")
      .toLowerCase();

    return haystack.includes(state.search);
  });
}

function syncSelectionWithVisibleChanges() {
  if (!state.selectedChangeId) {
    return;
  }

  const visibleChanges = getFilteredChanges();
  const isSelectedVisible = visibleChanges.some((change) => change.id === state.selectedChangeId);

  if (!isSelectedVisible) {
    clearSelection();
  }
}

function createReviewGapsForChange(change) {
  if (change.id === "ch-143") {
    addGap(change, {
      id: nextGapId(),
      severity: "high",
      mandatory: true,
      reqRef: "R-3.3",
      status: "open",
      recurrence: 0,
      fingerprint: "fp_idempotency",
      summary: "Idempotency key is modeled in docs, but default write path does not persist source_hash yet.",
      firstSeen: state.selectedRunId ?? "review",
      lastSeen: state.selectedRunId ?? "review",
      introducedByRun: state.selectedRunId ?? "review",
      evidence: "Review found contract/data shape mismatch on the default publication path.",
    });
    addGap(change, {
      id: nextGapId(),
      severity: "medium",
      mandatory: true,
      reqRef: "R-4.3",
      status: "open",
      recurrence: 0,
      fingerprint: "fp_retry",
      summary: "Retry ceiling exists in code, but no automated evidence proves five-attempt ceiling on the shipped path.",
      firstSeen: state.selectedRunId ?? "review",
      lastSeen: state.selectedRunId ?? "review",
      introducedByRun: state.selectedRunId ?? "review",
      evidence: "Acceptance review requires repeatable proof, not helper-only tests.",
    });
    addGap(change, {
      id: nextGapId(),
      severity: "low",
      mandatory: false,
      reqRef: "task 6.3",
      status: "open",
      recurrence: 0,
      fingerprint: "fp_doc",
      summary: "Validation command not yet captured in evidence artifacts.",
      firstSeen: state.selectedRunId ?? "review",
      lastSeen: state.selectedRunId ?? "review",
      introducedByRun: state.selectedRunId ?? "review",
      evidence: "Operational proof missing from evidence index.",
    });

    change.traceability = [
      {
        req: "R-3.3",
        code: "distribution/run-model.ts",
        tests: "missing default-path integration",
        evidence: "new review gaps",
        status: "gap open",
      },
      {
        req: "R-4.3",
        code: "odata/retry-policy.ts",
        tests: "retry smoke pending",
        evidence: "new review gaps",
        status: "partial",
      },
    ];
    change.requirementsLinked = 6;
    return;
  }

  if (change.id === "ch-146") {
    addGap(change, {
      id: nextGapId(),
      severity: "medium",
      mandatory: true,
      reqRef: "R-2",
      status: "open",
      recurrence: 0,
      fingerprint: "fp_backfill",
      summary: "Telemetry scan has code evidence, but requirement-to-test trace is still absent in shipped docs and checks.",
      firstSeen: state.selectedRunId ?? "review",
      lastSeen: state.selectedRunId ?? "review",
      introducedByRun: state.selectedRunId ?? "review",
      evidence: "Review requires stable acceptance proof before close.",
    });
    change.traceability = [
      {
        req: "R-1",
        code: "scan-maintenance.ts",
        tests: "test_scan_summary.ts",
        evidence: "apply run",
        status: "done",
      },
      {
        req: "R-2",
        code: "docs/agent/VERIFY.md",
        tests: "missing",
        evidence: "new review gap",
        status: "partial",
      },
    ];
    change.requirementsLinked = 4;
  }
}

function launchApplyRun(change) {
  const artifact = addEvidence(
    change,
    "diff summary",
    `${change.id}: apply pass`,
    `Chief launched initial apply run for ${change.id}.\n\n- worktree created\n- initial implementation skeleton committed in worktree only\n- verification deferred until review`,
  );

  const run = addRun(change, {
    id: nextRunId(),
    type: "apply",
    agent: "codex",
    worktree: `wt-${change.id.slice(3)}-${String(change.runs.length + 1).padStart(1, "0")}`,
    result: "done",
    duration: "12:08",
    outcome: "initial implementation pass complete",
    prompt: `/openspec-apply ${change.id}`,
    checks: ["structural edits only", "verification pending"],
    artifactIds: [artifact.id],
    producedGapIds: [],
    decision: "Chief scheduled review next.",
  });

  change.state = "executing";
  change.lastRunAgo = "just now";
  change.nextAction = "Run review";
  change.blocker = "Waiting for first acceptance review";
  change.summary = "Implementation pass finished. Chief should now run review and collect structured findings.";
  change.verificationStatus = "awaiting review";
  change.git.worktree = run.worktree;
  change.git.branch = "detached";
  change.git.changedFiles = Math.max(change.git.changedFiles, 5);
  change.git.commitStatus = "worktree only";
  touchChange(change);
  prependTimeline(change, `Apply ${run.id}`, "Chief started the first implementation pass.");
  addChiefEvent(change, "Chief launched apply run", `Worktree ${run.worktree} created and queued for codex.`);
  updateChangeMetrics(change);
  ensureSelection(change);
  showToast(`${change.id}: apply run ${run.id} queued`);
}

function launchReviewRun(change, mode = "full") {
  const artifact = addEvidence(
    change,
    "review report",
    `${change.id}: ${mode === "compact" ? "compact" : "full"} review`,
    mode === "compact"
      ? "Compact review focused on open mandatory findings and default-path evidence."
      : "Full review across tasks.md, requirements, runtime wiring and checked-in evidence.",
  );

  const run = addRun(change, {
    id: nextRunId(),
    type: "review",
    agent: "codex",
    worktree: change.git.worktree === "not created" ? "n/a" : change.git.worktree,
    result: "partial",
    duration: mode === "compact" ? "06:14" : "09:42",
    outcome: "review findings collected",
    prompt:
      mode === "compact"
        ? `/openspec-review-impl-vs-plan-compact ${change.id}`
        : `/openspec-review-impl-vs-plan ${change.id}`,
    checks: ["source review", "evidence scan"],
    artifactIds: [artifact.id],
    producedGapIds: [],
    decision: "Chief will decide whether to fix, accept, or escalate based on structured gaps.",
  });

  if (change.gaps.length === 0 || change.gaps.every((gap) => gap.status === "closed" || gap.status === "deferred")) {
    createReviewGapsForChange(change);
    run.producedGapIds = change.gaps.filter((gap) => gap.status !== "closed").map((gap) => gap.id);
  } else if (countOpenMandatoryGaps(change) === 0) {
    run.result = "clean";
    run.outcome = "no mandatory gaps remain";
    run.decision = "Chief can move change to acceptance.";
    change.state = "ready_for_acceptance";
    change.nextAction = "Close after verification";
    change.blocker = "No active blocker";
    change.summary = "Latest review found no open mandatory gaps on the default path.";
    change.verificationStatus = "green";
    touchChange(change);
    prependTimeline(change, `Review ${run.id}`, "Chief received a clean review result.");
    addChiefEvent(change, "Clean review received", "Change moved into ready_for_acceptance.");
    updateChangeMetrics(change);
    ensureSelection(change);
    showToast(`${change.id}: clean review, ready for acceptance`);
    return;
  } else {
    change.gaps
      .filter((gap) => gap.status === "open")
      .forEach((gap) => {
        gap.recurrence += 1;
        gap.lastSeen = run.id;
      });
    run.producedGapIds = change.gaps.filter((gap) => gap.status !== "closed").map((gap) => gap.id);
  }

  change.state = "review_pending";
  change.lastRunAgo = "just now";
  change.nextAction = hasRecurringCriticalGap(change) ? "Escalate to architecture/spec" : "Create targeted fix run";
  change.blocker = hasRecurringCriticalGap(change)
    ? "Recurring high-severity fingerprint hit escalation threshold"
    : "Mandatory findings need targeted closure";
  change.summary =
    "Chief has structured review findings. Next step should operate on the smallest fixable subset, unless recurrence forces escalation.";
  change.verificationStatus = "partial";
  change.loopCount += 1;
  touchChange(change);
  prependTimeline(change, `Review ${run.id}`, "Chief recorded structured review findings.");
  addChiefEvent(change, "Review findings recorded", `Run ${run.id} populated/updated the gap ledger.`);
  updateChangeMetrics(change);
  ensureSelection(change);
  showToast(`${change.id}: review run ${run.id} completed`);
}

function createTargetedFixRun(change, reason = "Chief scheduled targeted fix run.") {
  const targetGaps = change.gaps.filter(
    (gap) => gap.mandatory && (gap.status === "open" || gap.status === "in_fix") && gap.recurrence < 2,
  );

  if (!targetGaps.length) {
    if (hasRecurringCriticalGap(change)) {
      escalateChange(change, "No safe fix target remains because recurring fingerprint already hit threshold.");
      return;
    }
    change.state = "ready_for_acceptance";
    change.nextAction = "Close after verification";
    change.blocker = "No active blocker";
    change.verificationStatus = "green";
    change.summary = "All mandatory gaps appear resolved; chief is ready to close after verification.";
    touchChange(change);
    updateChangeMetrics(change);
    showToast(`${change.id}: no mandatory fix targets remain`);
    return;
  }

  const closedGapIds = [];
  targetGaps.slice(0, 2).forEach((gap) => {
    gap.status = "closed";
    gap.lastSeen = "targeted-fix";
    closedGapIds.push(gap.id);
  });

  const artifact = addEvidence(
    change,
    "diff summary",
    `${change.id}: targeted fix`,
    `Targeted finish pass closed: ${closedGapIds.join(", ")}.\n\nReason:\n${reason}`,
  );

  const run = addRun(change, {
    id: nextRunId(),
    type: "finish",
    agent: "codex",
    worktree: change.git.worktree === "not created" ? "n/a" : change.git.worktree,
    result: "done",
    duration: "18:26",
    outcome: `closed ${closedGapIds.length} targeted gap(s)`,
    prompt: `/openspec-finish-to-100 ${change.id} (targeted ${closedGapIds.join(" ")})`,
    checks: ["focused tests ✅", "trace update pending"],
    artifactIds: [artifact.id],
    producedGapIds: [],
    decision: "Chief will re-run review on the remaining surface.",
  });

  change.state = "gap_fixing";
  change.lastRunAgo = "just now";
  change.nextAction = "Re-review targeted gaps";
  change.blocker = countOpenMandatoryGaps(change) > 0 ? "Remaining mandatory gaps need proof" : "Awaiting re-review";
  change.summary = "Chief ran a targeted fix pass rather than a full change-wide retry.";
  change.verificationStatus = "awaiting re-review";
  change.requirementsLinked = Math.min(change.requirementsTotal, change.requirementsLinked + closedGapIds.length);
  touchChange(change);
  prependTimeline(change, `Finish ${run.id}`, `Targeted fix pass closed ${closedGapIds.join(", ")}.`);
  addChiefEvent(change, "Targeted fix run created", `Run ${run.id} focused on ${closedGapIds.join(", ")}.`);
  updateChangeMetrics(change);
  ensureSelection(change);
  showToast(`${change.id}: targeted fix run ${run.id} queued`);
}

function escalateChange(change, reason) {
  change.state = "escalated";
  change.nextAction = "Architecture/spec review";
  change.blocker = reason;
  change.summary = "Chief stopped autonomous execution because loop convergence is no longer improving.";
  change.verificationStatus = "escalated";
  change.lastRunAgo = "just now";
  touchChange(change);
  prependTimeline(change, "Escalated", reason);
  addChiefEvent(change, "Chief escalated change", reason);
  updateChangeMetrics(change);
  showToast(`${change.id}: escalated`);
}

function markBlockedBySpec(change, reason) {
  change.state = "blocked_by_spec";
  change.nextAction = "Repair proposal/design";
  change.blocker = reason;
  change.summary = "Chief marked the change as blocked by spec and stopped further code loops.";
  change.verificationStatus = "blocked";
  change.lastRunAgo = "just now";
  touchChange(change);
  prependTimeline(change, "Blocked by spec", reason);
  addChiefEvent(change, "Blocked by spec", reason);
  updateChangeMetrics(change);
  showToast(`${change.id}: marked blocked by spec`);
}

function closeAfterVerification(change) {
  if (countOpenMandatoryGaps(change) > 0) {
    showToast(`${change.id}: close rejected, mandatory gaps remain`);
    return;
  }

  change.state = "done";
  change.nextAction = "Archive change";
  change.blocker = "No active blocker";
  change.summary = "Chief accepted the change as fully delivered on the default path.";
  change.verificationStatus = "accepted";
  change.lastRunAgo = "just now";
  change.git.commitStatus = "ready to land";
  change.git.mergeReadiness = "ready";
  touchChange(change);
  prependTimeline(change, "Accepted", "Chief closed the change after verification.");
  addChiefEvent(change, "Change accepted", "No mandatory gaps remain; acceptance gate satisfied.");
  updateChangeMetrics(change);
  showToast(`${change.id}: marked done`);
}

function runNextStep(change) {
  switch (change.state) {
    case "approved":
      launchApplyRun(change);
      return;
    case "executing":
      launchReviewRun(change, "full");
      return;
    case "review_pending":
      if (hasRecurringCriticalGap(change)) {
        escalateChange(change, "Recurring high-severity fingerprint reached the chief escalation threshold.");
        return;
      }
      createTargetedFixRun(change, "Chief followed the standard review -> finish-to-100 loop.");
      return;
    case "gap_fixing":
      launchReviewRun(change, "compact");
      return;
    case "ready_for_acceptance":
      closeAfterVerification(change);
      return;
    case "blocked_by_spec":
      showToast(`${change.id}: blocked by spec, chief will not auto-run further`);
      return;
    case "escalated":
      showToast(`${change.id}: already escalated, waiting for human/spec intervention`);
      return;
    case "done":
      showToast(`${change.id}: already done`);
      return;
    default:
      showToast(`${change.id}: unsupported state transition`);
  }
}

function handlePrimaryAction() {
  const change = requireSelectedChange();
  if (!change) {
    return;
  }

  if (state.detailMode === "run") {
    createTargetedFixRun(change, `Follow-up fix run created from run studio on ${state.selectedRunId}.`);
    state.detailMode = "change";
    state.activeTab = "runs";
    render();
    return;
  }

  runNextStep(change);
  render();
}

function selectChange(changeId) {
  if (state.selectedChangeId === changeId) {
    clearSelection();
    render();
    return;
  }

  state.selectedChangeId = changeId;
  state.detailMode = "change";
  ensureSelection(getSelectedChange());
  render();
}

function renderViews() {
  viewList.innerHTML = "";

  data.views.forEach((view) => {
    const count = data.changes.filter(viewPredicates[view.id] ?? (() => true)).length;
    const button = document.createElement("button");
    button.className = `view-item${state.activeView === view.id ? " active" : ""}`;
    button.innerHTML = `
      <span>
        <strong>${view.label}</strong><br />
        <span class="view-meta">${view.hint}</span>
      </span>
      <span class="view-meta">${count}</span>
    `;
    button.addEventListener("click", () => {
      state.activeView = view.id;
      render();
    });
    viewList.appendChild(button);
  });
}

function renderQueue() {
  const changes = getFilteredChanges();
  queueTitle.textContent = data.views.find((view) => view.id === state.activeView)?.label ?? "Inbox";
  queueList.innerHTML = "";

  if (!changes.length) {
    const empty = document.createElement("div");
    empty.className = "metric-card";
    empty.innerHTML = `
      <p class="metric-label">Empty view</p>
      <strong>No changes match the current view.</strong>
      <p class="muted">Try another saved view or clear the search query.</p>
    `;
    queueList.appendChild(empty);
    return;
  }

  changes.forEach((change) => {
    const row = document.createElement("button");
    row.className = `queue-row${change.id === state.selectedChangeId ? " active" : ""}${change.loopCount >= 2 ? " looping" : ""}`;
    row.innerHTML = `
      <span class="queue-id">${change.id}</span>
      <span class="queue-title">
        <strong>${change.title}</strong>
        <span class="queue-subtitle">${change.subtitle}</span>
      </span>
      <span class="state-pill ${stateTone(change.state)}">${formatStateLabel(change.state)}</span>
      <span><strong>${change.mandatoryGaps}</strong> / ${change.optionalGaps}</span>
      <span class="${change.loopCount >= 2 ? "severity-pill severity-high" : "muted"}">${change.loopCount}</span>
      <span>${change.lastRunAgo}</span>
      <span>${change.blocker}</span>
      <span>${change.nextAction}</span>
    `;

    row.addEventListener("click", () => {
      selectChange(change.id);
    });
    queueList.appendChild(row);
  });
}

function renderInspector() {
  const change = getSelectedChange();
  clearSelectionButton.classList.toggle("hidden", !change);

  if (!change) {
    inspectorContent.innerHTML = `
      <article class="empty-state">
        <p class="block-label">Inspector idle</p>
        <h3>No change selected</h3>
        <p class="muted">Выберите строку в очереди, чтобы открыть traceability, gap ledger, runs и chief controls.</p>
      </article>
    `;
    return;
  }

  inspectorContent.innerHTML = `
    <div class="metric-grid">
      <article class="metric-card">
        <p class="metric-label">Mandatory gaps</p>
        <div class="metric-value">${change.mandatoryGaps}</div>
        <p class="muted">Optional: ${change.optionalGaps}</p>
      </article>
      <article class="metric-card">
        <p class="metric-label">Loop count</p>
        <div class="metric-value">${change.loopCount}</div>
        <p class="muted">${change.verificationStatus}</p>
      </article>
    </div>

    <article class="action-card">
      <p class="block-label">Next best action</p>
      <h3>${change.nextAction}</h3>
      <p>${change.summary}</p>
      <div class="detail-meta">
        <span class="state-pill ${stateTone(change.state)}">${formatStateLabel(change.state)}</span>
        <span class="severity-pill ${change.mandatoryGaps > 0 ? "severity-high" : "state-gap_fixing"}">
          ${change.mandatoryGaps > 0 ? "attention required" : "no active mandatory gaps"}
        </span>
      </div>
    </article>

    <article class="mini-card">
      <p class="block-label">Current blocker</p>
      <div class="mini-card-list">
        <div>
          <strong>${change.blocker}</strong>
          <span class="muted">Spec: ${change.specStatus} · Readiness: ${change.readiness}</span>
        </div>
      </div>
    </article>

    <article class="mini-card">
      <p class="block-label">Chief policy</p>
      <div class="mini-card-list">
        <div><strong>${change.policy.maxAutoCycles} auto cycles</strong><span class="muted">max before escalation</span></div>
        <div><strong>${change.policy.escalationRule}</strong><span class="muted">recurrence threshold</span></div>
        <div><strong>${change.policy.acceptanceGate}</strong><span class="muted">delivery contract</span></div>
      </div>
    </article>
  `;
}

function updateDetailActions(change) {
  if (!change) {
    detailBackToChangeButton.classList.add("hidden");
    detailOpenRunStudioButton.classList.add("hidden");
    detailBlockBySpecButton.classList.add("hidden");
    detailEscalateButton.classList.add("hidden");
    detailRunNextButton.classList.add("hidden");
    return;
  }

  detailRunNextButton.classList.remove("hidden");
  detailEscalateButton.classList.remove("hidden");

  const selectedRun = getSelectedRun(change);

  if (state.detailMode === "run") {
    detailBackToChangeButton.classList.remove("hidden");
    detailOpenRunStudioButton.classList.add("hidden");
    detailRunNextButton.textContent = "Create follow-up fix run";
    detailEscalateButton.textContent = "Escalate";
    detailBlockBySpecButton.classList.remove("hidden");
  } else {
    detailBackToChangeButton.classList.add("hidden");
    detailOpenRunStudioButton.classList.toggle("hidden", !selectedRun);
    detailRunNextButton.textContent = "Run next step";
    detailEscalateButton.textContent = "Escalate";
    detailBlockBySpecButton.classList.remove("hidden");
  }
}

function renderDetailHeader() {
  const change = getSelectedChange();
  if (!change) {
    detailIdentity.innerHTML = `
      <p class="block-label">Change detail</p>
      <h2>No change selected</h2>
      <p>Inspector и detail-pane активируются только после явного выбора из очереди.</p>
    `;
    updateDetailActions(null);
    return;
  }

  const selectedRun = getSelectedRun(change);

  if (state.detailMode === "run" && selectedRun) {
    detailIdentity.innerHTML = `
      <p class="block-label">Run studio</p>
      <h2>${selectedRun.id} · ${selectedRun.type} · ${change.id}</h2>
      <p>${selectedRun.outcome}</p>
      <div class="detail-meta">
        <span class="state-pill ${runResultTone(selectedRun.result)}">${selectedRun.result}</span>
        <span class="ghost-button">${selectedRun.agent}</span>
        <span class="ghost-button">${selectedRun.worktree}</span>
        <span class="ghost-button">${selectedRun.duration}</span>
      </div>
    `;
  } else {
    detailIdentity.innerHTML = `
      <p class="block-label">Change detail</p>
      <h2>${change.id} · ${change.title}</h2>
      <p>${change.subtitle}</p>
      <div class="detail-meta">
        <span class="state-pill ${stateTone(change.state)}">${formatStateLabel(change.state)}</span>
        <span class="ghost-button">${change.mandatoryGaps} mandatory gaps</span>
        <span class="ghost-button">Spec: ${change.specStatus}</span>
        <span class="ghost-button">Verification: ${change.verificationStatus}</span>
      </div>
    `;
  }

  updateDetailActions(change);
}

function renderTabs() {
  detailTabs.innerHTML = "";

  if (!getSelectedChange()) {
    detailTabs.innerHTML = `<div class="muted">Выберите change, чтобы открыть detail views и run studio.</div>`;
    return;
  }

  if (state.detailMode === "run") {
    detailTabs.innerHTML = `<div class="muted">Run Studio focuses on one execution: timeline, outputs, produced gaps and chief signals.</div>`;
    return;
  }

  tabs.forEach((tab) => {
    const button = document.createElement("button");
    button.className = `tab-button${state.activeTab === tab.id ? " active" : ""}`;
    button.textContent = tab.label;
    button.addEventListener("click", () => {
      state.activeTab = tab.id;
      renderDetailContent();
    });
    detailTabs.appendChild(button);
  });
}

function renderOverview(change) {
  return `
    <div class="overview-grid">
      <article class="split-card">
        <p class="block-label">Current state</p>
        <div class="mini-card-list">
          <div><strong>Workflow state</strong><span class="muted">${formatStateLabel(change.state)}</span></div>
          <div><strong>Spec status</strong><span class="muted">${change.specStatus}</span></div>
          <div><strong>Verification status</strong><span class="muted">${change.verificationStatus}</span></div>
          <div><strong>Readiness</strong><span class="muted">${change.readiness}</span></div>
        </div>
      </article>
      <article class="split-card">
        <p class="block-label">Next best action</p>
        <div class="mini-card-list">
          <div><strong>${change.nextAction}</strong><span class="muted">${change.blocker}</span></div>
          <div><strong>Last run</strong><span class="muted">${change.lastRunAgo}</span></div>
          <div><strong>Auto-loop</strong><span class="muted">${change.loopCount} review cycles</span></div>
          <div><strong>Chief owner</strong><span class="muted">${change.owner}</span></div>
        </div>
      </article>
      <article class="split-card">
        <p class="block-label">Metadata</p>
        <div class="mini-card-list">
          <div><strong>Created</strong><span class="muted">${formatDateTime(change.createdAt)}</span></div>
          <div><strong>Updated</strong><span class="muted">${formatDateTime(change.updatedAt)}</span></div>
          <div><strong>Next action</strong><span class="muted">${change.nextAction}</span></div>
          <div><strong>Policy window</strong><span class="muted">${change.policy.maxAutoCycles} cycles before escalation</span></div>
        </div>
      </article>
    </div>
    <div class="split-layout">
      <article class="split-card">
        <p class="block-label">Blocking reasons</p>
        <div class="mini-card-list">
          <div><strong>${change.blocker}</strong><span class="muted">Chief should not mark done until this is disproven or closed.</span></div>
          <div><strong>${change.mandatoryGaps} mandatory gaps remain</strong><span class="muted">Optional gaps: ${change.optionalGaps}</span></div>
          <div><strong>Acceptance gate</strong><span class="muted">${change.policy.acceptanceGate}</span></div>
        </div>
      </article>
      <article class="split-card">
        <p class="block-label">Timeline</p>
        <div class="timeline">
          ${change.timeline
            .map(
              (event) => `
                <div class="timeline-event">
                  <span class="timeline-dot"></span>
                  <div>
                    <strong>${event.title}</strong>
                    <p class="muted">${event.note}</p>
                  </div>
                </div>`,
            )
            .join("")}
        </div>
      </article>
    </div>
  `;
}

function renderTraceability(change) {
  if (!change.traceability.length) {
    return `
      <article class="split-card">
        <p class="block-label">Traceability</p>
        <h3>No traceability data yet</h3>
        <p class="muted">Chief still lacks explicit Requirement -> Code -> Test coverage for this change.</p>
      </article>
    `;
  }

  return `
    <div class="table-shell trace-grid">
      <div class="table-head">
        <span>Requirement</span>
        <span>Code</span>
        <span>Tests</span>
        <span>Evidence</span>
        <span>Status</span>
      </div>
      ${change.traceability
        .map(
          (item) => `
            <div class="table-row">
              <span><strong>${item.req}</strong></span>
              <span>${item.code}</span>
              <span>${item.tests}</span>
              <span>${item.evidence}</span>
              <span class="state-pill ${stateTone(mapTraceToState(item.status))}">${item.status}</span>
            </div>`,
        )
        .join("")}
    </div>
  `;
}

function renderRuns(change) {
  if (!change.runs.length) {
    return `
      <article class="split-card">
        <p class="block-label">Runs</p>
        <h3>No runs executed yet</h3>
        <p class="muted">This change is still waiting for its first apply or review execution.</p>
      </article>
    `;
  }

  const selectedRun = getSelectedRun(change);

  return `
    <div class="split-layout">
      <div class="table-shell runs-grid">
        <div class="table-head">
          <span>Run</span>
          <span>Type</span>
          <span>Agent</span>
          <span>Worktree</span>
          <span>Result</span>
          <span>Duration</span>
          <span>Outcome</span>
        </div>
        ${change.runs
          .map(
            (run) => `
              <div class="table-row row-clickable${selectedRun?.id === run.id ? " active" : ""}" data-run-id="${run.id}">
                <span><strong>${run.id}</strong></span>
                <span>${run.type}</span>
                <span>${run.agent}</span>
                <span>${run.worktree}</span>
                <span class="state-pill ${runResultTone(run.result)}">${run.result}</span>
                <span>${run.duration}</span>
                <span>${run.outcome}</span>
              </div>`,
          )
          .join("")}
      </div>
      <article class="split-card">
        <p class="block-label">Run detail</p>
        ${
          selectedRun
            ? `
              <div class="mini-card-list">
                <div><strong>${selectedRun.prompt}</strong><span class="muted">Prompt template</span></div>
                <div><strong>${selectedRun.outcome}</strong><span class="muted">Result: ${selectedRun.result}</span></div>
                <div><strong>Checks</strong><span class="muted">${selectedRun.checks.join(" · ")}</span></div>
                <div><strong>Produced gaps</strong><span class="muted">${selectedRun.producedGapIds.join(", ") || "none"}</span></div>
                <div><strong>Chief verdict</strong><span class="muted">${selectedRun.decision}</span></div>
              </div>
              <div class="section-actions">
                <button class="ghost-button" data-open-run-studio="${selectedRun.id}">Open run studio</button>
                <button class="ghost-button" data-jump-gaps="${selectedRun.id}">Jump to gaps</button>
              </div>`
            : `<p class="muted">No runs for this change yet.</p>`
        }
      </article>
    </div>
  `;
}

function renderGaps(change) {
  const selectedGap = getSelectedGap(change);

  if (!change.gaps.length) {
    return `
      <article class="split-card">
        <p class="block-label">Gap ledger</p>
        <h3>No open findings yet</h3>
        <p class="muted">This change has not produced structured review findings so far.</p>
      </article>
    `;
  }

  return `
    <div class="split-layout">
      <div class="table-shell gaps-grid">
        <div class="table-head">
          <span>Gap</span>
          <span>Severity</span>
          <span>Mandatory</span>
          <span>Req ref</span>
          <span>Status</span>
          <span>Repeat</span>
          <span>Summary</span>
        </div>
        ${change.gaps
          .map(
            (gap) => `
              <div class="table-row row-clickable${selectedGap?.id === gap.id ? " active" : ""}" data-gap-id="${gap.id}">
                <span><strong>${gap.id}</strong></span>
                <span class="severity-pill ${gap.severity === "high" ? "severity-high" : gap.severity === "medium" ? "state-executing" : "state-gap_fixing"}">${gap.severity}</span>
                <span>${gap.mandatory ? "yes" : "no"}</span>
                <span>${gap.reqRef}</span>
                <span>${gap.status}</span>
                <span>${gap.recurrence}</span>
                <span>${gap.summary}</span>
              </div>`,
          )
          .join("")}
      </div>
      <article class="split-card">
        <p class="block-label">Gap detail</p>
        ${
          selectedGap
            ? `
              <div class="mini-card-list">
                <div><strong>${selectedGap.summary}</strong><span class="muted">Fingerprint: ${selectedGap.fingerprint}</span></div>
                <div><strong>Seen in ${selectedGap.firstSeen} → ${selectedGap.lastSeen}</strong><span class="muted">Recurrence: ${selectedGap.recurrence}</span></div>
                <div><strong>Requirement</strong><span class="muted">${selectedGap.reqRef}</span></div>
                <div><strong>Evidence</strong><span class="muted">${selectedGap.evidence}</span></div>
                <div><strong>Introduced by</strong><span class="muted">${selectedGap.introducedByRun}</span></div>
              </div>
              <div class="section-actions">
                <button class="ghost-button" data-chief-action="fix">Create targeted fix run</button>
                <button class="ghost-button" data-chief-action="block">Mark blocked by spec</button>
              </div>`
            : ""
        }
      </article>
    </div>
  `;
}

function renderEvidence(change) {
  const selectedArtifact = change.evidence.find((item) => item.id === state.selectedEvidenceId) ?? change.evidence[0];

  return `
    <div class="artifact-layout">
      <div class="artifact-list">
        ${change.evidence
          .map(
            (artifact) => `
              <button class="${selectedArtifact?.id === artifact.id ? "active" : ""}" data-artifact-id="${artifact.id}">
                <span class="artifact-kind">${artifact.kind}</span><br />
                <strong>${artifact.title}</strong>
              </button>`,
          )
          .join("")}
      </div>
      <article class="artifact-viewer">
        ${
          selectedArtifact
            ? `
            <p class="block-label">${selectedArtifact.kind}</p>
            <h3>${selectedArtifact.title}</h3>
            <pre>${selectedArtifact.body}</pre>`
            : `<p class="muted">No evidence available.</p>`
        }
      </article>
    </div>
  `;
}

function renderGit(change) {
  return `
    <article class="git-card">
      <p class="block-label">Landing status</p>
      <div class="git-grid">
        <div><strong>Worktree</strong><p class="muted">${change.git.worktree}</p></div>
        <div><strong>Branch</strong><p class="muted">${change.git.branch}</p></div>
        <div><strong>Changed files</strong><p class="muted">${change.git.changedFiles}</p></div>
        <div><strong>Commit status</strong><p class="muted">${change.git.commitStatus}</p></div>
        <div><strong>PR status</strong><p class="muted">${change.git.prStatus}</p></div>
        <div><strong>Merge readiness</strong><p class="muted">${change.git.mergeReadiness}</p></div>
      </div>
    </article>
  `;
}

function renderChief(change) {
  return `
    <div class="chief-layout">
      <article class="split-card">
        <p class="block-label">Workflow state machine</p>
        <div class="state-machine">
          ${workflowStates
            .map((node) => {
              const isCurrent = node === change.state;
              const isAvailable = isTransitionAvailable(change.state, node);
              return `
                <div class="machine-node${isCurrent ? " current" : ""}${isAvailable ? " available" : ""}">
                  <span class="artifact-kind">${isCurrent ? "current" : isAvailable ? "reachable" : "state"}</span>
                  <strong>${formatStateLabel(node)}</strong>
                  <span class="muted">${stateHint(node)}</span>
                </div>`;
            })
            .join("")}
        </div>
        <div class="action-cluster">
          <button class="primary-button" data-chief-action="run-next">Run next step</button>
          <button class="ghost-button" data-chief-action="fix">Create targeted fix run</button>
          <button class="ghost-button" data-chief-action="close">Close after verification</button>
          <button class="ghost-button" data-chief-action="escalate">Escalate</button>
          <button class="ghost-button" data-chief-action="block">Mark blocked by spec</button>
        </div>
      </article>
      <article class="split-card">
        <p class="block-label">Chief event history</p>
        <div class="timeline">
          ${change.chiefHistory
            .map(
              (event) => `
                <div class="timeline-event">
                  <span class="timeline-dot"></span>
                  <div>
                    <strong>${event.title}</strong>
                    <p class="muted">${event.at} · ${event.note}</p>
                  </div>
                </div>`,
            )
            .join("")}
        </div>
      </article>
    </div>
    <article class="split-card">
      <p class="block-label">Transition rules</p>
      <div class="chief-rules">
        <div><strong>Run next step</strong><span class="muted">Chief uses workflow state and gap ledger to choose apply, review, finish, re-review or acceptance.</span></div>
        <div><strong>Escalate on recurrence</strong><span class="muted">${change.policy.escalationRule}. If the same fingerprint keeps returning, the loop must stop.</span></div>
        <div><strong>Acceptance</strong><span class="muted">${change.policy.acceptanceGate}. Close is rejected while mandatory gaps remain open.</span></div>
      </div>
    </article>
  `;
}

function renderRunStudio(change) {
  const run = getSelectedRun(change);

  if (!run) {
    return `
      <article class="split-card">
        <p class="block-label">Run studio</p>
        <h3>No run selected</h3>
      </article>
    `;
  }

  const producedGaps = change.gaps.filter((gap) => run.producedGapIds.includes(gap.id));
  const runArtifacts = change.evidence.filter((artifact) => run.artifactIds.includes(artifact.id));

  return `
    <div class="run-studio">
      <aside class="run-rail">
        <article class="signal-card">
          <p class="block-label">Execution summary</p>
          <strong>${run.outcome}</strong>
          <span class="muted">${run.prompt}</span>
        </article>
        <article class="signal-card">
          <p class="block-label">Chief verdict</p>
          <strong>${run.decision}</strong>
          <span class="muted">Run ${run.id} on ${run.worktree}</span>
        </article>
        <article class="signal-card">
          <p class="block-label">Checks</p>
          <ul class="run-checks">
            ${run.checks.map((item) => `<li>${item}</li>`).join("")}
          </ul>
        </article>
      </aside>

      <div class="run-main">
        <article class="split-card">
          <p class="block-label">Event history</p>
          <div class="timeline">
            ${buildRunEvents(change, run)
              .map(
                (event) => `
                  <div class="timeline-event">
                    <span class="timeline-dot"></span>
                    <div>
                      <strong>${event.title}</strong>
                      <p class="muted">${event.note}</p>
                    </div>
                  </div>`,
              )
              .join("")}
          </div>
        </article>

        <div class="run-pair">
          <article class="split-card">
            <p class="block-label">Produced gaps</p>
            <div class="inline-card-list">
              ${
                producedGaps.length
                  ? producedGaps
                      .map(
                        (gap) => `
                          <button class="run-card" data-open-gap="${gap.id}">
                            <span class="artifact-kind">${gap.severity}</span>
                            <strong>${gap.id}</strong>
                            <span class="muted">${gap.summary}</span>
                          </button>`,
                      )
                      .join("")
                  : `<div class="ledger-card"><strong>No produced gaps</strong><span class="muted">This run did not open new findings.</span></div>`
              }
            </div>
          </article>

          <article class="split-card">
            <p class="block-label">Artifacts</p>
            <div class="inline-card-list">
              ${
                runArtifacts.length
                  ? runArtifacts
                      .map(
                        (artifact) => `
                          <button class="run-card" data-open-artifact="${artifact.id}">
                            <span class="artifact-kind">${artifact.kind}</span>
                            <strong>${artifact.title}</strong>
                            <span class="muted">Open in evidence tab</span>
                          </button>`,
                      )
                      .join("")
                  : `<div class="ledger-card"><strong>No artifacts</strong><span class="muted">No evidence bound to this run yet.</span></div>`
              }
            </div>
          </article>
        </div>
      </div>
    </div>
  `;
}

function buildRunEvents(change, run) {
  const events = [
    {
      title: "Prompt dispatched",
      note: `${run.prompt} -> ${run.agent} on ${run.worktree}`,
    },
    {
      title: "Execution result",
      note: `${run.result} · ${run.outcome}`,
    },
  ];

  if (run.producedGapIds.length) {
    events.push({
      title: "Ledger updated",
      note: `Structured findings recorded: ${run.producedGapIds.join(", ")}`,
    });
  }

  events.push({
    title: "Chief interpretation",
    note: run.decision,
  });

  if (change.state === "ready_for_acceptance" && run.result === "clean") {
    events.push({
      title: "State transition",
      note: "Chief moved change into ready_for_acceptance.",
    });
  }

  return events;
}

function mapTraceToState(status) {
  if (status === "done") return "done";
  if (status === "partial") return "review_pending";
  if (status === "gap open") return "review_pending";
  if (status === "blocked by spec") return "blocked_by_spec";
  return "executing";
}

function stateHint(value) {
  switch (value) {
    case "draft":
      return "Intent not yet approved";
    case "approved":
      return "Ready for Go!";
    case "executing":
      return "Implementation pass";
    case "review_pending":
      return "Waiting for or processing findings";
    case "gap_fixing":
      return "Targeted closure run";
    case "ready_for_acceptance":
      return "No mandatory gaps visible";
    case "done":
      return "Accepted and ready to archive";
    case "blocked_by_spec":
      return "Spec prevents further code loops";
    case "escalated":
      return "Human/architecture decision needed";
    default:
      return "";
  }
}

function isTransitionAvailable(current, target) {
  const transitions = {
    draft: ["approved"],
    approved: ["executing"],
    executing: ["review_pending", "blocked_by_spec"],
    review_pending: ["gap_fixing", "ready_for_acceptance", "escalated"],
    gap_fixing: ["review_pending", "ready_for_acceptance", "blocked_by_spec"],
    ready_for_acceptance: ["done", "review_pending"],
    done: [],
    blocked_by_spec: ["escalated", "approved"],
    escalated: ["approved", "blocked_by_spec"],
  };
  return transitions[current]?.includes(target) ?? false;
}

function renderDetailContent() {
  const change = getSelectedChange();

  if (!change) {
    detailContent.innerHTML = `
      <article class="empty-state">
        <p class="block-label">Detail workspace</p>
        <h3>Nothing opened yet</h3>
        <p class="muted">Здесь появятся Overview, Traceability, Runs, Gaps, Evidence и Chief panel для выбранного change.</p>
      </article>
    `;
    return;
  }

  if (state.detailMode === "run") {
    detailContent.innerHTML = renderRunStudio(change);
    bindDetailEvents();
    return;
  }

  const views = {
    overview: renderOverview(change),
    traceability: renderTraceability(change),
    runs: renderRuns(change),
    gaps: renderGaps(change),
    evidence: renderEvidence(change),
    git: renderGit(change),
    chief: renderChief(change),
  };

  detailContent.innerHTML = views[state.activeTab] ?? views.overview;
  bindDetailEvents();
}

function bindDetailEvents() {
  detailContent.querySelectorAll("[data-run-id]").forEach((element) => {
    element.addEventListener("click", () => {
      state.selectedRunId = element.dataset.runId;
      renderDetailContent();
    });
  });

  detailContent.querySelectorAll("[data-gap-id]").forEach((element) => {
    element.addEventListener("click", () => {
      state.selectedGapId = element.dataset.gapId;
      renderDetailContent();
    });
  });

  detailContent.querySelectorAll("[data-artifact-id]").forEach((element) => {
    element.addEventListener("click", () => {
      state.selectedEvidenceId = element.dataset.artifactId;
      renderDetailContent();
    });
  });

  detailContent.querySelectorAll("[data-open-run-studio]").forEach((element) => {
    element.addEventListener("click", () => {
      state.selectedRunId = element.dataset.openRunStudio;
      state.detailMode = "run";
      render();
    });
  });

  detailContent.querySelectorAll("[data-jump-gaps]").forEach((element) => {
    element.addEventListener("click", () => {
      const change = getSelectedChange();
      if (!change) {
        return;
      }
      const run = change.runs.find((candidate) => candidate.id === element.dataset.jumpGaps);
      if (run?.producedGapIds[0]) {
        state.selectedGapId = run.producedGapIds[0];
        state.activeTab = "gaps";
        render();
      }
    });
  });

  detailContent.querySelectorAll("[data-open-gap]").forEach((element) => {
    element.addEventListener("click", () => {
      state.selectedGapId = element.dataset.openGap;
      state.detailMode = "change";
      state.activeTab = "gaps";
      render();
    });
  });

  detailContent.querySelectorAll("[data-open-artifact]").forEach((element) => {
    element.addEventListener("click", () => {
      state.selectedEvidenceId = element.dataset.openArtifact;
      state.detailMode = "change";
      state.activeTab = "evidence";
      render();
    });
  });

  detailContent.querySelectorAll("[data-chief-action]").forEach((element) => {
    element.addEventListener("click", () => {
      const change = getSelectedChange();
      if (!change) {
        return;
      }
      const action = element.dataset.chiefAction;
      if (action === "run-next") {
        runNextStep(change);
      } else if (action === "fix") {
        createTargetedFixRun(change, "Manual targeted fix run from chief tab or gap detail.");
      } else if (action === "close") {
        closeAfterVerification(change);
      } else if (action === "escalate") {
        escalateChange(change, "Manual escalation from chief tab.");
      } else if (action === "block") {
        markBlockedBySpec(change, "Manual spec block from operator console.");
      }
      render();
    });
  });
}

let toastTimer = null;
function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove("visible"), 2200);
}

function renderHero() {
  const filtered = getFilteredChanges();
  const selected = getSelectedChange();
  const mandatoryGaps = filtered.reduce((sum, change) => sum + change.mandatoryGaps, 0);
  const signalText =
    selected && state.detailMode === "run" && getSelectedRun(selected)
      ? `${selected.id} · run studio ${getSelectedRun(selected).id}`
      : selected
        ? `${selected.id} · ${selected.nextAction}`
        : "No change selected";

  document.getElementById("heroChangeCount").textContent = `${filtered.length} active changes`;
  document.getElementById("heroGapCount").textContent = `${mandatoryGaps} open`;
  document.getElementById("heroSignal").textContent = signalText;
}

function render() {
  syncSelectionWithVisibleChanges();
  renderViews();
  renderQueue();
  renderInspector();
  renderDetailHeader();
  renderTabs();
  renderDetailContent();
  renderHero();
}

render();
