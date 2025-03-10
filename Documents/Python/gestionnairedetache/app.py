from flask import Flask, render_template, request, redirect, url_for
from datetime import datetime
app = Flask(__name__)

# Liste pour stocker les tâches
tachesListe = []
tachesImportants = []
@app.route('/')
def index():
    return render_template("index.html", tachesListe=tachesListe, tachesImportants = tachesImportants)

@app.route('/add', methods=["POST"])
def add():
    task_content = request.form.get('task')
    time_task = request.form.get('time')
    if task_content:
        tachesListe.append({'content': task_content, 'completed': False, 'important': False, 'date_of_creation' : datetime.now(), 'task_duration' : time_task})
    return redirect(url_for('index'))

@app.route('/complete/<int:task_id>')
def complete(task_id):
    if 0 <= task_id < len(tachesListe):
        tachesListe[task_id]['completed'] = True
    return redirect(url_for('index'))

@app.route('/incomplete/<int:task_id>')
def incomplete (task_id):
    if 0<= task_id< len(tachesListe):
        tachesListe[task_id]['completed'] = False
    return redirect(url_for('index'))

@app.route('/delete/<int:task_id>')
def delete(task_id):
    if 0 <= task_id < len(tachesListe):
        task = tachesListe[task_id]
        if task in tachesImportants:
            tachesImportants.remove(task)
        del tachesListe[task_id]
    return redirect(url_for('index'))

@app.route('/addImportant/<int:task_id>')
def addImportant_task(task_id):
    if 0 <= task_id < len(tachesListe):
        tachesListe[task_id]['important'] = True
        tachesImportants.append(tachesListe[task_id])
    return redirect(url_for('index'))

@app.route('/removeImportant/<int:task_id>')
def removeImportant(task_id):
    if 0 <= task_id < len(tachesListe):
        task = tachesImportants[task_id]
        tachesListe[task_id]['important'] = False
        del task
    return redirect(url_for('index'))

@app.route('/deleteImportant/<int:task_id>')
def deleteImportant(task_id):
    if 0 <= task_id < len(tachesImportants):
        del tachesImportants[task_id]
    return redirect(url_for('index'))


if __name__ == "__main__":
    app.run(debug=True)
