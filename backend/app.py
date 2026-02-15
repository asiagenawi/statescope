import os

from flask import Flask
from flask_cors import CORS
from routes.states import states_bp
from routes.policies import policies_bp
from routes.trends import trends_bp
from routes.ask import ask_bp
from models.database import get_db

app = Flask(__name__)

is_dev = os.environ.get('FLASK_ENV') == 'development'
if is_dev:
    CORS(app)
else:
    CORS(app, origins=['https://asiagenawi.github.io'])

app.register_blueprint(states_bp)
app.register_blueprint(policies_bp)
app.register_blueprint(trends_bp)
app.register_blueprint(ask_bp)


@app.route('/api/health')
def health():
    db = get_db()
    count = db.execute('SELECT COUNT(*) FROM policies').fetchone()[0]
    db.close()
    return {'status': 'ok', 'policy_count': count}


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(debug=is_dev, port=port)
