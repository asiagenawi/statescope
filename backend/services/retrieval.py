"""Retrieve relevant policies from the database to build Claude prompt context."""

from models.database import get_db


def retrieve_context(question, limit=10):
    """Search policies by keyword matching against the question.
    Returns a list of policy dicts with state info attached."""
    db = get_db()

    # Extract meaningful words (skip short/common words)
    stop = {'the', 'a', 'an', 'is', 'are', 'was', 'were', 'do', 'does', 'did',
            'has', 'have', 'had', 'what', 'which', 'who', 'how', 'when', 'where',
            'why', 'can', 'will', 'would', 'should', 'could', 'about', 'with',
            'from', 'for', 'and', 'but', 'or', 'not', 'this', 'that', 'any',
            'all', 'each', 'been', 'being', 'their', 'there', 'they', 'them',
            'than', 'into', 'some', 'such', 'its', 'also', 'most', 'more'}
    words = [w for w in question.lower().split() if len(w) > 2 and w.strip('?.,!') not in stop]

    if not words:
        # Fallback: return most recent policies
        rows = db.execute('''
            SELECT p.*, s.name as state_name, s.code as state_code
            FROM policies p
            LEFT JOIN states s ON p.state_id = s.id
            ORDER BY p.date_introduced DESC
            LIMIT ?
        ''', (limit,)).fetchall()
        db.close()
        return [dict(r) for r in rows]

    # Build OR conditions for each keyword across title, description, summary
    conditions = []
    params = []
    for w in words:
        pattern = f'%{w}%'
        conditions.append('(p.title LIKE ? OR p.description LIKE ? OR p.summary_text LIKE ?)')
        params.extend([pattern, pattern, pattern])

    where = ' OR '.join(conditions)
    params.append(limit)

    rows = db.execute(f'''
        SELECT p.*, s.name as state_name, s.code as state_code,
               ({' + '.join(
                    f"(CASE WHEN p.title LIKE '%{w}%' THEN 2 ELSE 0 END) + "
                    f"(CASE WHEN p.description LIKE '%{w}%' THEN 1 ELSE 0 END) + "
                    f"(CASE WHEN p.summary_text LIKE '%{w}%' THEN 1 ELSE 0 END)"
                    for w in words
                )}) as relevance
        FROM policies p
        LEFT JOIN states s ON p.state_id = s.id
        WHERE {where}
        ORDER BY relevance DESC, p.date_introduced DESC
        LIMIT ?
    ''', params).fetchall()
    db.close()
    return [dict(r) for r in rows]


def format_context(policies):
    """Format retrieved policies into a text block for the Claude prompt."""
    if not policies:
        return "No relevant policies found in the database."

    parts = []
    for i, p in enumerate(policies, 1):
        location = p.get('state_name') or 'Federal'
        lines = [
            f"[{i}] {p['title']}",
            f"    Location: {location}",
            f"    Type: {p['policy_type']} | Status: {p['status']}",
        ]
        if p.get('date_introduced'):
            lines.append(f"    Introduced: {p['date_introduced']}")
        if p.get('bill_number'):
            lines.append(f"    Bill: {p['bill_number']}")
        if p.get('summary_text'):
            lines.append(f"    Summary: {p['summary_text']}")
        parts.append('\n'.join(lines))

    return '\n\n'.join(parts)
