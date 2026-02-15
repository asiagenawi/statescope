import time
from flask import Blueprint, request
from services.retrieval import retrieve_context, format_context
from services.claude_service import ask_claude

ask_bp = Blueprint('ask', __name__)

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


@ask_bp.route('/api/ask', methods=['POST'])
def ask():
    ip = request.remote_addr
    if not _check_rate_limit(ip):
        return {'error': 'Rate limit exceeded. Please wait a minute.'}, 429

    data = request.get_json()
    question = (data.get('question') or '').strip()
    if not question:
        return {'error': 'Question is required'}, 400

    # Retrieve relevant policies
    policies = retrieve_context(question, limit=8)
    context_text = format_context(policies)

    # Ask Claude
    result = ask_claude(question, context_text)

    # Build source list from retrieved policies
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

    return {
        'question': question,
        'answer': result['answer'],
        'sources': sources,
        'model': result.get('model'),
    }
