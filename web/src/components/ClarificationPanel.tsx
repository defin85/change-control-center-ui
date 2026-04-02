import { useMemo, useState } from "react";

import { PlatformPrimitives, PlatformTextArea } from "../platform/foundation";
import { useAsyncWorkflowCommandMachine } from "../platform/workflow";
import { AuthoringShell } from "../platform/shells/AuthoringShell";
import type { ClarificationAnswer, ClarificationRound } from "../types";

type ClarificationPanelProps = {
  changeId: string;
  rounds: ClarificationRound[];
  onCreateRound: () => Promise<void>;
  onAnswerRound: (roundId: string, answers: ClarificationAnswer[]) => Promise<void>;
};

export function ClarificationPanel({
  changeId,
  rounds,
  onCreateRound,
  onAnswerRound,
}: ClarificationPanelProps) {
  const openRound = rounds.find((round) => round.status === "open") ?? null;
  const historicalRounds = useMemo(() => rounds.filter((round) => round.id !== openRound?.id), [openRound?.id, rounds]);
  const clarificationWorkflow = useAsyncWorkflowCommandMachine();
  const draftScopeKey = `${changeId}:${openRound?.id ?? "history-only"}`;
  const canCreateRound = !openRound && !clarificationWorkflow.isPending;

  return (
    <AuthoringShell
      eyebrow="Clarifications"
      title="Design Ambiguities"
      actions={
        <PlatformPrimitives.Button
          type="button"
          className="ghost-button"
          data-platform-foundation="base-ui-clarification-actions"
          onClick={() =>
            clarificationWorkflow.runCommand({
              label: "Generate clarification round",
              execute: onCreateRound,
            })
          }
          disabled={!canCreateRound}
        >
          Generate round
        </PlatformPrimitives.Button>
      }
    >
      {clarificationWorkflow.error ? (
        <div className="empty-state">
          <strong>Clarification workflow failed.</strong> {clarificationWorkflow.error}
        </div>
      ) : null}
      {clarificationWorkflow.isPending ? (
        <div className="empty-state">{clarificationWorkflow.activeLabel ?? "Clarification workflow in progress."}</div>
      ) : null}
      {openRound ? (
        <p className="governance-note" data-platform-governance="clarification-round-open">
          Finish the active clarification round before generating the next one.
        </p>
      ) : null}
      {!openRound && historicalRounds.length === 0 ? <p className="empty-state">No clarification rounds yet.</p> : null}

      {historicalRounds.length > 0 ? (
        <div className="stack">
          {historicalRounds.map((round) => (
            <div key={round.id} className="card">
              <p className="eyebrow">Historical round</p>
              <strong>{round.rationale}</strong>
              <p>Status: {round.status}</p>
              {round.answers.length > 0 ? (
                <ul>
                  {round.answers.map((answer) => (
                    <li key={`${round.id}-${answer.questionId}`}>
                      <strong>{answer.questionId}</strong>: {answer.selectedOptionId}
                      {answer.freeformNote ? ` - ${answer.freeformNote}` : ""}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="muted">No submitted answers.</p>
              )}
            </div>
          ))}
        </div>
      ) : null}

      {openRound && (
        <ActiveClarificationRound
          key={draftScopeKey}
          round={openRound}
          isWorkflowPending={clarificationWorkflow.isPending}
          onAnswerRound={onAnswerRound}
        />
      )}
      {!openRound && historicalRounds.length > 0 ? (
        <p className="empty-state">Historical clarification rounds are read-only. Generate a new round to continue planning.</p>
      ) : null}
    </AuthoringShell>
  );
}

type ActiveClarificationRoundProps = {
  round: ClarificationRound;
  isWorkflowPending: boolean;
  onAnswerRound: (roundId: string, answers: ClarificationAnswer[]) => Promise<void>;
};

function ActiveClarificationRound({
  round,
  isWorkflowPending,
  onAnswerRound,
}: ActiveClarificationRoundProps) {
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const clarificationWorkflow = useAsyncWorkflowCommandMachine();
  const pendingAnswers = round.questions
    .map((question) => {
      const selectedOptionId = selected[question.id];
      if (!selectedOptionId) {
        return null;
      }
      return {
        questionId: question.id,
        selectedOptionId,
        freeformNote: notes[question.id] || undefined,
      };
    })
    .filter(Boolean) as ClarificationAnswer[];
  const hasSelectedAnswers = pendingAnswers.length > 0;

  return (
    <div className="clarification-card">
      <p className="clarification-rationale">{round.rationale}</p>
      {round.answers.length > 0 && (
        <div className="card">
          <p className="eyebrow">Stored answers</p>
          <ul>
            {round.answers.map((answer) => (
              <li key={answer.questionId}>
                <strong>{answer.questionId}</strong>: {answer.selectedOptionId}
                {answer.freeformNote ? ` - ${answer.freeformNote}` : ""}
              </li>
            ))}
          </ul>
        </div>
      )}
      {round.questions.map((question) => (
        <PlatformPrimitives.Fieldset.Root key={question.id} className="clarification-question">
          <PlatformPrimitives.Fieldset.Legend>
            <strong>{question.label}</strong>
          </PlatformPrimitives.Fieldset.Legend>
          <PlatformPrimitives.RadioGroup
            className="option-list"
            data-platform-foundation="base-ui-radio-group"
            name={question.id}
            value={selected[question.id]}
            onValueChange={(value) => {
              if (typeof value === "string") {
                setSelected((current) => ({
                  ...current,
                  [question.id]: value,
                }));
              }
            }}
          >
            {question.options.map((option) => (
              <label key={option.id} className="option-card">
                <PlatformPrimitives.Radio.Root
                  className={({ checked }) => (checked ? "option-radio option-radio-selected" : "option-radio")}
                  value={option.id}
                >
                  <PlatformPrimitives.Radio.Indicator className="option-radio-indicator" />
                </PlatformPrimitives.Radio.Root>
                <span>
                  <strong>{option.label}</strong>
                  <small>{option.description}</small>
                </span>
              </label>
            ))}
          </PlatformPrimitives.RadioGroup>
          {question.allowOther && (
            <PlatformTextArea
              value={notes[question.id] ?? ""}
              data-platform-foundation="platform-clarification-textarea"
              aria-label={`Additional clarification note: ${question.label}`}
              name={`clarification-note-${question.id}`}
              placeholder="Add supporting note"
              onChange={(event) =>
                setNotes((current) => ({
                  ...current,
                  [question.id]: event.target.value,
                }))
              }
            />
          )}
        </PlatformPrimitives.Fieldset.Root>
      ))}
      {!hasSelectedAnswers ? (
        <p className="governance-note" data-platform-governance="clarification-selection-required">
          Select at least one answer before submitting clarification state to the backend-owned shell.
        </p>
      ) : null}
      {clarificationWorkflow.error ? (
        <div className="empty-state">
          <strong>Clarification workflow failed.</strong> {clarificationWorkflow.error}
        </div>
      ) : null}
      {clarificationWorkflow.isPending ? (
        <div className="empty-state">{clarificationWorkflow.activeLabel ?? "Clarification workflow in progress."}</div>
      ) : null}
      <PlatformPrimitives.Button
        type="button"
        className="primary-button"
        data-platform-foundation="base-ui-clarification-actions"
        onClick={() =>
          clarificationWorkflow.runCommand({
            label: "Submit clarification answers",
            execute: async () => {
              await onAnswerRound(round.id, pendingAnswers);
              setNotes({});
              setSelected({});
            },
          })
        }
        disabled={isWorkflowPending || clarificationWorkflow.isPending || !hasSelectedAnswers}
      >
        Submit answers
      </PlatformPrimitives.Button>
    </div>
  );
}
