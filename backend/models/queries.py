from models.database import get_db


def get_all_states():
    db = get_db()
    rows = db.execute('''
        SELECT s.*,
               COUNT(p.id) as policy_count,
               MAX(CASE WHEN p.status = 'enacted' THEN 1 ELSE 0 END) as has_enacted,
               MAX(CASE WHEN p.status = 'introduced' THEN 1 ELSE 0 END) as has_pending,
               MAX(CASE WHEN p.policy_type = 'guidance' THEN 1 ELSE 0 END) as has_guidance
        FROM states s
        LEFT JOIN policies p ON p.state_id = s.id
        GROUP BY s.id
        ORDER BY s.name
    ''').fetchall()
    db.close()
    results = []
    for r in rows:
        d = dict(r)
        if d['has_enacted']:
            d['policy_status'] = 'enacted'
        elif d['has_pending']:
            d['policy_status'] = 'pending'
        elif d['has_guidance']:
            d['policy_status'] = 'guidance'
        else:
            d['policy_status'] = 'none'
        del d['has_enacted']
        del d['has_pending']
        del d['has_guidance']
        results.append(d)
    return results


def get_state_policies(state_code):
    db = get_db()
    rows = db.execute('''
        SELECT p.* FROM policies p
        JOIN states s ON p.state_id = s.id
        WHERE s.code = ?
        ORDER BY p.date_introduced DESC
    ''', (state_code.upper(),)).fetchall()
    db.close()
    return [dict(r) for r in rows]


def get_all_policies(level=None, status=None, topic_id=None, limit=50, offset=0):
    db = get_db()
    query = 'SELECT p.* FROM policies p'
    params = []
    conditions = []

    if topic_id:
        query += ' JOIN policy_topics pt ON pt.policy_id = p.id'
        conditions.append('pt.topic_id = ?')
        params.append(topic_id)

    if level:
        conditions.append('p.level = ?')
        params.append(level)

    if status:
        conditions.append('p.status = ?')
        params.append(status)

    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)

    query += ' ORDER BY p.date_introduced DESC LIMIT ? OFFSET ?'
    params.extend([limit, offset])

    rows = db.execute(query, params).fetchall()
    db.close()
    return [dict(r) for r in rows]


def get_policy_by_id(policy_id):
    db = get_db()
    row = db.execute('SELECT * FROM policies WHERE id = ?', (policy_id,)).fetchone()
    db.close()
    return dict(row) if row else None


def get_timeline_data(state_code=None, topic_id=None, policy_type=None):
    db = get_db()
    query = '''
        SELECT strftime('%Y', p.date_introduced) as year,
               COUNT(*) as count
        FROM policies p
    '''
    joins = []
    conditions = ['p.date_introduced IS NOT NULL']
    params = []

    if state_code:
        joins.append('JOIN states s ON p.state_id = s.id')
        conditions.append('s.code = ?')
        params.append(state_code.upper())

    if topic_id:
        joins.append('JOIN policy_topics pt ON pt.policy_id = p.id')
        conditions.append('pt.topic_id = ?')
        params.append(topic_id)

    if policy_type:
        conditions.append('p.policy_type = ?')
        params.append(policy_type)

    query = query + ' '.join(joins)
    query += ' WHERE ' + ' AND '.join(conditions)
    query += ' GROUP BY year ORDER BY year'

    rows = db.execute(query, params).fetchall()
    db.close()
    return [dict(r) for r in rows]


def get_topic_counts(state_code=None, policy_type=None):
    db = get_db()
    query = '''
        SELECT t.name, COUNT(pt.policy_id) as count
        FROM topics t
        LEFT JOIN policy_topics pt ON pt.topic_id = t.id
    '''
    joins = []
    conditions = []
    params = []

    if state_code or policy_type:
        joins.append('LEFT JOIN policies p ON pt.policy_id = p.id')

    if state_code:
        joins.append('LEFT JOIN states s ON p.state_id = s.id')
        conditions.append('(s.code = ? OR pt.policy_id IS NULL)')
        params.append(state_code.upper())

    if policy_type:
        conditions.append('(p.policy_type = ? OR pt.policy_id IS NULL)')
        params.append(policy_type)

    query = query + ' '.join(joins)
    if conditions:
        query += ' WHERE ' + ' AND '.join(conditions)
    query += ' GROUP BY t.id ORDER BY count DESC'

    rows = db.execute(query, params).fetchall()
    db.close()
    return [dict(r) for r in rows]


def get_status_breakdown():
    db = get_db()
    rows = db.execute('''
        SELECT status, COUNT(*) as count
        FROM policies
        GROUP BY status
        ORDER BY count DESC
    ''').fetchall()
    db.close()
    return [dict(r) for r in rows]


def get_level_breakdown():
    db = get_db()
    rows = db.execute('''
        SELECT level, COUNT(*) as count
        FROM policies
        GROUP BY level
        ORDER BY count DESC
    ''').fetchall()
    db.close()
    return [dict(r) for r in rows]


def get_all_topics():
    db = get_db()
    rows = db.execute('SELECT * FROM topics ORDER BY name').fetchall()
    db.close()
    return [dict(r) for r in rows]


def search_policies(query_text, limit=10):
    db = get_db()
    pattern = f'%{query_text}%'
    rows = db.execute('''
        SELECT p.*, s.name as state_name, s.code as state_code
        FROM policies p
        LEFT JOIN states s ON p.state_id = s.id
        WHERE p.title LIKE ? OR p.description LIKE ? OR p.summary_text LIKE ?
        ORDER BY p.date_introduced DESC
        LIMIT ?
    ''', (pattern, pattern, pattern, limit)).fetchall()
    db.close()
    return [dict(r) for r in rows]
