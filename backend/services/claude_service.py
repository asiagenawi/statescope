"""Claude Q&A service using Anthropic SDK."""

import anthropic
import config

SYSTEM_PROMPT = """You are an expert assistant on AI in education policy in the United States.
You answer questions using ONLY the policy data provided below. If the data doesn't contain
enough information to answer, say so honestly.

Rules:
- Cite specific policies by their title and number in brackets like [1], [2], etc.
- Be concise but thorough.
- If asked about a state with no data, say the database doesn't have policies for that state yet.
- Never fabricate policy names, bill numbers, or dates."""

MODEL = "claude-sonnet-4-20250514"


def ask_claude(question, context_text):
    """Send a question + retrieved policy context to Claude and return the answer."""
    if not config.ANTHROPIC_API_KEY:
        return {
            'answer': 'Claude API key not configured. Add ANTHROPIC_API_KEY to your .env file.',
            'model': None,
        }

    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    user_message = f"""Here are relevant policies from the database:

{context_text}

---

Question: {question}"""

    response = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        system=SYSTEM_PROMPT,
        messages=[{"role": "user", "content": user_message}],
    )

    return {
        'answer': response.content[0].text,
        'model': MODEL,
    }
