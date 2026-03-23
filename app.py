import sqlite3

from flask import Flask, render_template, request, jsonify

app = Flask(__name__)

def init_db():
    conn = sqlite3.connect('tasks_list.db')
    cursor = conn.cursor()

    cursor.execute('''
        CREATE TABLE IF NOT EXISTS tasks(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            description TEXT,
            status TEXT,
            position INTEGER
        )
    ''')
    conn.close()

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/tasks', methods=['GET'])
def get_tasks():
    conn = sqlite3.connect('tasks_list.db')
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM tasks')
    tasks = cursor.fetchall()
    conn.close()
    
    task_list = []
    for task in tasks:
        task_list.append({
            'id': task[0],
            'title': task[1],
            'description': task[2] if task[2] else '',
            'status': task[3],
            'position': task[4]
        })

    return jsonify(task_list)

@app.route('/api/tasks/create', methods=['POST'])
def create_task():
    data = request.get_json()
    title = data['title']
    description = data.get('description', '')
    
    conn = sqlite3.connect('tasks_list.db')
    cursor = conn.cursor()
    cursor.execute('''
        INSERT INTO tasks (title, description, status, position)
        VALUES (?, ?, 'new', (SELECT COALESCE(MAX(position), 0) + 1 FROM tasks WHERE status = 'new'))
    ''', (title, description))
    
    conn.commit()
    conn.close()
    
    return jsonify({"success": True})

@app.route('/api/tasks/update', methods=['POST'])
def update_task():
    if request.method == 'POST':
        data = request.get_json()
        task_id = data['id']
        status = data['status']

        conn = sqlite3.connect('tasks_list.db')
        cursor = conn.cursor()
        cursor.execute('''
            UPDATE tasks SET status = ? WHERE id = ?
        ''',
        (status, task_id)
        )
        conn.commit()
        conn.close()

        return jsonify({"success": True})

if __name__ == '__main__':
    init_db()
    app.run(debug=True)