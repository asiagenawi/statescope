const SUGGESTIONS = [
  "Which states have enacted AI literacy requirements?",
  "What federal bills address AI in education?",
  "How are states protecting student data from AI systems?",
  "Which states have created AI task forces for education?",
  "What is California doing about AI in schools?",
]

function SuggestedQuestions({ onSelect, disabled }) {
  return (
    <div className="suggested-questions">
      <p className="suggested-label">Try asking:</p>
      <div className="suggested-list">
        {SUGGESTIONS.map((q, i) => (
          <button
            key={i}
            className="suggested-btn"
            onClick={() => onSelect(q)}
            disabled={disabled}
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  )
}

export default SuggestedQuestions
