const changes = [
  {
    id: "ch-142",
    title: "Replace static prototype with app foundation",
    subtitle: "Backend-served shell is ready for targeted review.",
    state: "review pending",
    gaps: 0,
    blocker: "Close the remaining mandatory review findings.",
    nextAction: "Create a targeted fix run.",
    summary: "The change is implemented and reviewed. The remaining work is narrow: close the final review findings and land the proof.",
    contract: [
      "Backend entrypoint serves the operator UI.",
      "Selected change stays route-addressable.",
      "Run lineage remains visible from the detail surface.",
    ],
    checks: ["Traceability linked", "Runtime lineage visible", "Acceptance proof still partial"],
  },
  {
    id: "ch-150",
    title: "Design tenant memory and clarification loop",
    subtitle: "Planning-only change with unresolved architecture questions.",
    state: "draft",
    gaps: 0,
    blocker: "Clarify runtime deployment and approval policy.",
    nextAction: "Open a clarification round.",
    summary: "This change is still in design. The operator needs a clean summary, one next step, and no extra dashboard noise.",
    contract: [
      "Clarification rounds persist across sessions.",
      "Promoted facts become tenant memory.",
      "Chief history remains visible but secondary.",
    ],
    checks: ["No run selected", "No mandatory gaps yet", "Needs operator input"],
  },
  {
    id: "ch-201",
    title: "Tighten operator workbench focus",
    subtitle: "Reduce chrome, simplify queue, shorten compact detail flow.",
    state: "ready",
    gaps: 0,
    blocker: "Waiting for final visual sign-off.",
    nextAction: "Review the static direction.",
    summary: "This distilled prototype shows the intended minimal direction: a queue on the left and one obvious detail surface on the right.",
    contract: [
      "Queue stays scan-friendly.",
      "Detail stays primary.",
      "Static prototype remains easy to open and review.",
    ],
    checks: ["Static queue working", "Detail selection working", "No backend required"],
  },
];

const state = {
  query: "",
  selectedId: changes[0].id,
};

const searchInput = document.querySelector("#searchInput");
const queueList = document.querySelector("#queueList");
const detailHeading = document.querySelector("#detailHeading");
const detailSubtitle = document.querySelector("#detailSubtitle");
const detailSummary = document.querySelector("#detailSummary");
const detailContract = document.querySelector("#detailContract");
const detailChecks = document.querySelector("#detailChecks");
const detailBadge = document.querySelector("#detailBadge");
const detailNextAction = document.querySelector("#detailNextAction");
const detailBlocker = document.querySelector("#detailBlocker");
const summaryCount = document.querySelector("#summaryCount");
const summaryGaps = document.querySelector("#summaryGaps");
const summaryFocus = document.querySelector("#summaryFocus");
const clearSelectionButton = document.querySelector("#clearSelectionButton");
const newChangeButton = document.querySelector("#newChangeButton");
const runNextButton = document.querySelector("#runNextButton");
const toast = document.querySelector("#toast");

function getVisibleChanges() {
  const query = state.query.trim().toLowerCase();
  if (!query) {
    return changes;
  }

  return changes.filter((change) =>
    [change.id, change.title, change.subtitle, change.blocker, change.nextAction].some((value) =>
      value.toLowerCase().includes(query),
    ),
  );
}

function getSelectedChange(visibleChanges) {
  return visibleChanges.find((change) => change.id === state.selectedId) ?? visibleChanges[0] ?? null;
}

function renderQueue() {
  const visibleChanges = getVisibleChanges();
  const selectedChange = getSelectedChange(visibleChanges);
  state.selectedId = selectedChange?.id ?? null;

  queueList.innerHTML = "";

  visibleChanges.forEach((change) => {
    const row = document.createElement("button");
    row.type = "button";
    row.className = `queue-row${change.id === state.selectedId ? " active" : ""}`;
    row.setAttribute("role", "option");
    row.setAttribute("aria-selected", change.id === state.selectedId ? "true" : "false");
    row.innerHTML = `
      <div class="queue-row-top">
        <span class="queue-id">${change.id}</span>
        <span class="queue-state">${change.state}</span>
      </div>
      <div>
        <strong>${change.title}</strong>
        <p class="muted">${change.subtitle}</p>
      </div>
      <div class="queue-meta">
        <span>${change.gaps} open gaps</span>
        <span>${change.nextAction}</span>
      </div>
    `;
    row.addEventListener("click", () => {
      state.selectedId = change.id;
      render();
    });
    queueList.appendChild(row);
  });

  if (visibleChanges.length === 0) {
    queueList.innerHTML = '<p class="muted">No changes match the current search.</p>';
  }
}

function renderDetail() {
  const visibleChanges = getVisibleChanges();
  const change = getSelectedChange(visibleChanges);

  if (!change) {
    detailHeading.textContent = "No change selected";
    detailSubtitle.textContent = "Adjust the search or clear the query.";
    detailSummary.textContent = "This static surface shows only the minimum useful context.";
    detailBadge.textContent = "No selection";
    detailNextAction.textContent = "Select a change first.";
    detailBlocker.textContent = "None";
    detailContract.innerHTML = "";
    detailChecks.innerHTML = "";
    summaryFocus.textContent = "No selection";
    return;
  }

  detailHeading.textContent = change.title;
  detailSubtitle.textContent = change.subtitle;
  detailSummary.textContent = change.summary;
  detailBadge.textContent = change.state;
  detailNextAction.textContent = change.nextAction;
  detailBlocker.textContent = change.blocker;
  summaryFocus.textContent = change.id;

  detailContract.innerHTML = change.contract.map((item) => `<li>${item}</li>`).join("");
  detailChecks.innerHTML = change.checks.map((item) => `<li>${item}</li>`).join("");
}

function renderSummary() {
  const visibleChanges = getVisibleChanges();
  const openGaps = visibleChanges.reduce((count, change) => count + change.gaps, 0);
  summaryCount.textContent = `${visibleChanges.length} change${visibleChanges.length === 1 ? "" : "s"}`;
  summaryGaps.textContent = `${openGaps} open`;
}

function render() {
  renderQueue();
  renderDetail();
  renderSummary();
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("visible");
  window.clearTimeout(showToast.timeoutId);
  showToast.timeoutId = window.setTimeout(() => {
    toast.classList.remove("visible");
  }, 1800);
}

searchInput.addEventListener("input", (event) => {
  state.query = event.target.value;
  render();
});

clearSelectionButton.addEventListener("click", () => {
  state.selectedId = null;
  render();
});

newChangeButton.addEventListener("click", () => {
  showToast("Static prototype: change creation is not wired.");
});

runNextButton.addEventListener("click", () => {
  const visibleChanges = getVisibleChanges();
  const change = getSelectedChange(visibleChanges);
  showToast(change ? `Static prototype: next step for ${change.id}.` : "Select a change first.");
});

render();
