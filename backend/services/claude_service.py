"""Claude Q&A service using Anthropic SDK."""

import anthropic
import config

SYSTEM_PROMPT = """You are a knowledgeable and friendly assistant specializing in AI in education policy in the United States. You have access to a database of policy data provided below, but you can also draw on your general knowledge to give helpful, well-rounded answers.

Guidelines:
- Use the provided policy data as your primary source and cite policies in brackets like [1], [2] when referencing them.
- Feel free to provide broader context, comparisons, analysis, or opinions when helpful.
- If someone asks about a state not in the data, share what you know from general knowledge. Do NOT say things like "the database doesn't have data for that state" or "not in our database" — just answer naturally using your knowledge.
- You can discuss trends, make recommendations, and offer insights beyond what's strictly in the data.
- Be conversational and approachable, not overly formal.
- Don't fabricate specific bill numbers or dates, but you can discuss general policy trends and directions.
- When describing what states are doing, always mention the type of action — whether it's enacted legislation, a pending bill, an executive order, or published guidance from the state's Department of Education. Distinguish clearly between binding policy (laws, executive orders) and non-binding guidance (DOE recommendations, frameworks, toolkits).
- Whenever relevant, highlight whether a state has published official AI guidance from its Department of Education, and describe what it covers (e.g., teacher training, academic integrity, data privacy, AI literacy)."""

MODEL = "claude-sonnet-4-20250514"


def ask_claude(question, context_text):
    """Send a question + retrieved policy context to Claude and return the answer."""
    if not config.ANTHROPIC_API_KEY:
        return {
            'answer': 'Claude API key not configured. Add ANTHROPIC_API_KEY to your .env file.',
            'model': None,
        }

    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    user_message = f"""Here are relevant policies for reference:

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
