"use client";

import { useEffect, useState } from "react";

const questions = [
  "How does operational transform keep every editor in sync?",
  "What happens when a collaborator joins this meeting late?"
];

export function TeacherTypingText() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [typedQuestion, setTypedQuestion] = useState("");
  const [isErasing, setIsErasing] = useState(false);
  const question = questions[questionIndex];

  useEffect(() => {
    const isQuestionComplete = typedQuestion.length === question.length;
    const isQuestionEmpty = typedQuestion.length === 0;

    const timeoutId = setTimeout(() => {
      if (!isErasing && !isQuestionComplete) {
        setTypedQuestion(question.slice(0, typedQuestion.length + 1));
        return;
      }

      if (!isErasing) {
        setIsErasing(true);
        return;
      }

      if (!isQuestionEmpty) {
        setTypedQuestion((currentQuestion) => currentQuestion.slice(0, -1));
        return;
      }

      setQuestionIndex((index) => (index + 1) % questions.length);
      setIsErasing(false);
    }, isQuestionComplete && !isErasing ? 1400 : isErasing ? 20 : 36);

    return () => clearTimeout(timeoutId);
  }, [isErasing, question, typedQuestion]);

  return (
    <span aria-label="Teacher's animated question">
      {typedQuestion}
      <span
        className="ml-0.5 inline-block h-4 w-0.5 animate-pulse bg-black align-[-2px]"
        aria-hidden="true"
      />
    </span>
  );
}
