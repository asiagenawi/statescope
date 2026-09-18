import json
import logging
import time
from flask import Blueprint, Response, request
from services.retrieval import retrieve_context, format_context
from services.claude_service import ask_claude, stream_claude

ask_bp = Blueprint('ask', __name__)

logger = logging.getLogger(__name__)

# Upstream errors can carry request ids and key fragments, so they are logged
# server-side and the client gets a generic message.
GENERIC_ERROR = 'Sorry, the answer service is unavailable right now. Please try again.'

# Simple in-memory rate limiting: max 10 requests per minute per IP
_rate_limit = {}
MAX_REQUESTS = 10
WINDOW_SECONDS = 60


def _check_rate_limit(ip):
    now = time.time()
    if ip not in _rate_limit:
        _rate_limit[ip] = []
    # Remove old timestamps
    _rate_limit[ip] = [t for t in _rate_limit[ip] if now - t < WINDOW_SECONDS]
    if len(_rate_limit[ip]) >= MAX_REQUESTS:
        return False
    _rate_limit[ip].append(now)
    return True


def _build_sources(policies):
    sources = []
    for p in policies:
        source = {
            'id': p['id'],
            'title': p['title'],
            'state': p.get('state_name') or 'Federal',
            'status': p['status'],
        }
        if p.get('source_url'):
            source['url'] = p['source_url']
        sources.append(source)
    return sources


def _read_question():
    """Returns (question, error_response). Exactly one is non-None."""
    ip = request.remote_addr
    if not _check_rate_limit(ip):
        return None, ({'error': 'Rate limit exceeded. Please wait a minute.'}, 429)

    data = request.get_json(silent=True) or {}
    question = (data.get('question') or '').strip()
    if not question:
        return None, ({'error': 'Question is required'}, 400)

    return question, None


@ask_bp.route('/api/ask', methods=['POST'])
def ask():
    question, error = _read_question()
    if error:
        return error

    try:
        policies = retrieve_context(question, limit=8)
        result = ask_claude(question, format_context(policies))

        return {
            'question': question,
            'answer': result['answer'],
            'sources': _build_sources(policies),
            'model': result.get('model'),
        }
    except Exception:
        logger.exception('ask failed')
        return {'error': GENERIC_ERROR}, 500


@ask_bp.route('/api/ask/stream', methods=['POST'])
def ask_stream():
    """Server-sent events variant of /api/ask.

    Same retrieval, same prompt -- the answer just arrives incrementally. /api/ask
    stays in place unchanged so any existing client keeps working.
    """
    question, error = _read_question()
    if error:
        return error

    # Retrieval runs here, inside the request context, so the generator below
    # doesn't need the request object once streaming has started.
    try:
        policies = retrieve_context(question, limit=8)
        context_text = format_context(policies)
    except Exception:
        logger.exception('retrieval failed')
        return {'error': GENERIC_ERROR}, 500

    def generate():
        yield f'data: {json.dumps({"sources": _build_sources(policies)})}\n\n'
        try:
            for delta in stream_claude(question, context_text):
                yield f'data: {json.dumps({"text": delta})}\n\n'
        except Exception:
            logger.exception('stream failed')
            yield f'data: {json.dumps({"error": GENERIC_ERROR})}\n\n'
        yield f'data: {json.dumps({"done": True})}\n\n'

    return Response(
        generate(),
        mimetype='text/event-stream',
        headers={
            'Cache-Control': 'no-cache',
            'X-Accel-Buffering': 'no',  # don't let a proxy buffer the stream
        },
    )
