-- AI in Education Policy Explorer -- Database Schema

CREATE TABLE IF NOT EXISTS states (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    code TEXT NOT NULL UNIQUE,       -- e.g. 'CA', 'NY', 'DC'
    fips TEXT NOT NULL UNIQUE,       -- e.g. '06', '36', '11'
    region TEXT NOT NULL,            -- Northeast, Southeast, Midwest, West, Southwest
    has_ai_guidance INTEGER DEFAULT 0  -- 1 if state DoE has published AI guidance
);

CREATE TABLE IF NOT EXISTS policies (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state_id INTEGER,                -- NULL for federal
    title TEXT NOT NULL,
    description TEXT,
    policy_type TEXT NOT NULL,       -- 'bill', 'guidance', 'executive_order'
    level TEXT NOT NULL,             -- 'federal', 'state'
    status TEXT NOT NULL,            -- 'introduced', 'enacted', 'failed', 'active'
    date_introduced TEXT,            -- ISO date YYYY-MM-DD
    date_enacted TEXT,
    bill_number TEXT,                -- e.g. 'HB 1234', 'S. 5678'
    sponsor TEXT,
    summary_text TEXT,
    source_url TEXT,
    FOREIGN KEY (state_id) REFERENCES states(id)
);

CREATE TABLE IF NOT EXISTS topics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    description TEXT
);

CREATE TABLE IF NOT EXISTS policy_topics (
    policy_id INTEGER NOT NULL,
    topic_id INTEGER NOT NULL,
    PRIMARY KEY (policy_id, topic_id),
    FOREIGN KEY (policy_id) REFERENCES policies(id),
    FOREIGN KEY (topic_id) REFERENCES topics(id)
);

CREATE TABLE IF NOT EXISTS documents (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    state_id INTEGER,
    policy_id INTEGER,
    title TEXT NOT NULL,
    doc_type TEXT,                   -- 'pdf', 'report', 'webpage'
    source_url TEXT,
    extracted_text TEXT,
    date_added TEXT,
    FOREIGN KEY (state_id) REFERENCES states(id),
    FOREIGN KEY (policy_id) REFERENCES policies(id)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_policies_state_id ON policies(state_id);
CREATE INDEX IF NOT EXISTS idx_policies_level ON policies(level);
CREATE INDEX IF NOT EXISTS idx_policies_status ON policies(status);
CREATE INDEX IF NOT EXISTS idx_policies_date ON policies(date_introduced);
CREATE INDEX IF NOT EXISTS idx_documents_state_id ON documents(state_id);
CREATE INDEX IF NOT EXISTS idx_documents_policy_id ON documents(policy_id);
