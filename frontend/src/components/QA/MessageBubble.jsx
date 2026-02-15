function MessageBubble({ message }) {
  const isUser = message.role === 'user'

  return (
    <div className={`message ${isUser ? 'message-user' : 'message-assistant'}`}>
      <div className="message-bubble">
        <p className="message-content">{message.content}</p>
        {!isUser && message.sources && message.sources.length > 0 && (
          <div className="message-sources">
            <p className="sources-label">Sources:</p>
            <ul className="sources-list">
              {message.sources.map((s, i) => (
                <li key={i}>
                  {s.url ? (
                    <a href={s.url} target="_blank" rel="noopener noreferrer">
                      {s.title}
                    </a>
                  ) : (
                    <span>{s.title}</span>
                  )}
                  <span className="source-meta"> — {s.state} ({s.status})</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  )
}

export default MessageBubble
