#dummy server to simply serve up my page for development/testing
import os
from bottle import route,run,request,response,install,uninstall,static_file
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

STATIC_ROOT = BASE_DIR + '/static'

@route('/')
def index():
    return static_file('index.html',root=STATIC_ROOT)

@route('/static/<filepath:path>')
def static(filepath):
    return static_file(filepath,root=STATIC_ROOT)

run(host='localhost', port=8080)
