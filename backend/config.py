import os
from dotenv import load_dotenv

load_dotenv()

DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'data', 'education_policy.db')
ANTHROPIC_API_KEY = os.getenv('ANTHROPIC_API_KEY', '')
CONGRESS_API_KEY = os.getenv('CONGRESS_API_KEY', '')
