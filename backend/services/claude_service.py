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

# Current-generation Sonnet. The tier is inherited from the original pin
# (claude-sonnet-4-20250514) rather than chosen here -- switch to
# "claude-opus-5" if you want the more capable model on this endpoint.
MODEL = "claude-sonnet-5"

# Enough for a thorough multi-paragraph answer with citations, without letting a
# single question on a public endpoint run away.
MAX_TOKENS = 4096

# Thinking is off deliberately: this is an interactive chat where the first token
# arriving quickly matters more than depth, and thinking would put a silent pause
# in front of every answer.
REQUEST_KWARGS = {
    'model': MODEL,
    'max_tokens': MAX_TOKENS,
    'system': SYSTEM_PROMPT,
    'thinking': {'type': 'disabled'},
    'output_config': {'effort': 'medium'},
}

NO_KEY_MESSAGE = (
    'Claude API key not configured. Add ANTHROPIC_API_KEY to your .env file.'
)


def _build_user_message(question, context_text):
    return f"""Here are relevant policies for reference:

{context_text}

---

Question: {question}"""


def ask_claude(question, context_text):
    """Send a question + retrieved policy context to Claude and return the answer."""
    if not config.ANTHROPIC_API_KEY:
        return {'answer': NO_KEY_MESSAGE, 'model': None}

    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    response = client.messages.create(
        messages=[{'role': 'user', 'content': _build_user_message(question, context_text)}],
        **REQUEST_KWARGS,
    )

    text = ''.join(b.text for b in response.content if b.type == 'text')
    return {'answer': text, 'model': MODEL}


def stream_claude(question, context_text):
    """Yield answer text deltas as Claude produces them.

    Streaming is what makes the chat feel responsive: the first words land in
    about a second instead of the user watching a typing indicator for the whole
    generation.
    """
    if not config.ANTHROPIC_API_KEY:
        yield NO_KEY_MESSAGE
        return

    client = anthropic.Anthropic(api_key=config.ANTHROPIC_API_KEY)

    with client.messages.stream(
        messages=[{'role': 'user', 'content': _build_user_message(question, context_text)}],
        **REQUEST_KWARGS,
    ) as stream:
        for text in stream.text_stream:
            yield text
