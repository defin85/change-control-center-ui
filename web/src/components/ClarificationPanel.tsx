import { useState } from "react";

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

  const handleSubmit = async () => {
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

    await onAnswerRound(openRound.id, answers);
    setNotes({});
    setSelected({});
  };

  return (
    <AuthoringShell
      eyebrow="Clarifications"
      title="Design Ambiguities"
      actions={
        <button type="button" className="ghost-button" onClick={() => void onCreateRound()}>
          Generate round
        </button>
      }
    >

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
            <div key={question.id} className="clarification-question">
              <strong>{question.label}</strong>
              <div className="option-list">
                {question.options.map((option) => (
                  <label key={option.id} className="option-card">
                    <input
                      type="radio"
                      name={question.id}
                      checked={selected[question.id] === option.id}
                      onChange={() =>
                        setSelected((current) => ({
                          ...current,
                          [question.id]: option.id,
                        }))
                      }
                    />
                    <span>
                      <strong>{option.label}</strong>
                      <small>{option.description}</small>
                    </span>
                  </label>
                ))}
              </div>
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
            </div>
          ))}
          <button type="button" className="primary-button" onClick={() => void handleSubmit()}>
            Submit answers
          </button>
        </div>
      )}
    </AuthoringShell>
  );
}
