import { useState } from "react";

import { PlatformPrimitives } from "../platform/foundation";
import { useAsyncWorkflowCommandMachine } from "../platform/workflow";
import { AuthoringShell } from "../platform/shells/AuthoringShell";
import type { ClarificationAnswer, ClarificationRound } from "../types";

type ClarificationPanelProps = {
  rounds: ClarificationRound[];
  onCreateRound: () => Promise<void>;
  onAnswerRound: (roundId: string, answers: ClarificationAnswer[]) => Promise<void>;
};

export function ClarificationPanel({
  rounds,
  onCreateRound,
  onAnswerRound,
}: ClarificationPanelProps) {
  const openRound = rounds.find((round) => round.status === "open") ?? rounds[0] ?? null;
  const [notes, setNotes] = useState<Record<string, string>>({});
  const [selected, setSelected] = useState<Record<string, string>>({});
  const clarificationWorkflow = useAsyncWorkflowCommandMachine();

  const handleSubmit = () => {
    if (!openRound) {
      return;
    }

    const answers = openRound.questions
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

    if (!answers.length) {
      return;
    }

    clarificationWorkflow.runCommand({
      label: "Submit clarification answers",
      execute: async () => {
        await onAnswerRound(openRound.id, answers);
        setNotes({});
        setSelected({});
      },
    });
  };

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
          disabled={clarificationWorkflow.isPending}
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
      {!openRound && <p className="empty-state">No clarification rounds yet.</p>}

      {openRound && (
        <div className="clarification-card">
          <p className="clarification-rationale">{openRound.rationale}</p>
          {openRound.answers.length > 0 && (
            <div className="card">
              <p className="eyebrow">Stored answers</p>
              <ul>
                {openRound.answers.map((answer) => (
                  <li key={answer.questionId}>
                    <strong>{answer.questionId}</strong>: {answer.selectedOptionId}
                    {answer.freeformNote ? ` — ${answer.freeformNote}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}
          {openRound.questions.map((question) => (
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
                <textarea
                  value={notes[question.id] ?? ""}
                  placeholder="Дополнительный комментарий"
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
          <PlatformPrimitives.Button
            type="button"
            className="primary-button"
            data-platform-foundation="base-ui-clarification-actions"
            onClick={handleSubmit}
            disabled={clarificationWorkflow.isPending}
          >
            Submit answers
          </PlatformPrimitives.Button>
        </div>
      )}
    </AuthoringShell>
  );
}
