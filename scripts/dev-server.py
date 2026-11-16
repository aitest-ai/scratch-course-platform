#!/usr/bin/env python3
"""本機測試用靜態伺服器，套用與 vercel.json 相同的網址改寫。"""
import http.server, os, re, sys
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'public')
PREFIXES = ('/chunks/', '/static/', '/libraries/', '/extension-worker.js')
class H(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *a, **k): super().__init__(*a, directory=ROOT, **k)
    def translate_path(self, path):
        p = path.split('?')[0]
        if p.startswith(PREFIXES) or re.fullmatch(r'/[0-9a-f]{32}\.hex', p):
            path = '/editor' + p
        return super().translate_path(path)
if __name__ == '__main__':
    http.server.ThreadingHTTPServer(('127.0.0.1', int(sys.argv[1]) if len(sys.argv) > 1 else 8603), H).serve_forever()
