#!/usr/bin/env python3
"""MockGaming – 世界杯竞猜 本地后端
纯标准库实现，无需 pip 安装任何依赖。
启动: python3 server.py
"""

import json
import os
import time
import threading
from http.server import HTTPServer, SimpleHTTPRequestHandler
from urllib.parse import urlparse

PORT = 8000
DATA_FILE = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'data.json')
DB_LOCK = threading.Lock()

# ---- 种子数据（与 wc-data.js SEED_USERS 一致） ----
PWD = '123456'
PALETTE = ['#0EA5A0', '#F59E0B', '#7C3AED', '#2563EB', '#DB2777', '#16A34A',
           '#FF6A1A', '#0891B2', '#65A30D', '#9333EA']

SEED_USERS = [
    {'u': 'laoqiang',   'name': '老枪K',     'pts': 15240, 'hit': '12连红',            'c': '#0EA5A0'},
    {'u': 'qiuwang',    'name': '球王32',    'pts': 14180, 'hit': '本周 9 中 7',       'c': '#F59E0B'},
    {'u': 'beikantai',  'name': '北看台',    'pts': 13760, 'hit': '8连红',             'c': '#7C3AED'},
    {'u': 'laozhang',   'name': '老张说球',  'pts': 12030, 'hit': '本周 11 中 6',      'c': '#2563EB'},
    {'u': 'juesha',     'name': '绝杀时刻',  'pts': 11470, 'hit': '本周 7 中 3',       'c': '#DB2777'},
    {'u': 'zhongchang', 'name': '中场休息',  'pts': 9890,  'hit': '5连红',             'c': '#16A34A'},
    {'u': 'demo',       'name': '我',        'pts': 8620,  'hit': '6连红 · 状态火热',  'c': '#FF6A1A'},
    {'u': 'yuewei',     'name': '越位陷阱',  'pts': 7350,  'hit': '本周 8 中 4',       'c': '#0891B2'},
    {'u': 'renyiqiu',   'name': '任意球',    'pts': 6420,  'hit': '3连红',             'c': '#65A30D'},
    {'u': 'menxian',    'name': '门线技术',  'pts': 5210,  'hit': '本周 6 中 3',       'c': '#9333EA'},
    {'u': 'bushi',      'name': '补时狂人',  'pts': 4080,  'hit': '本周 9 中 2',       'c': '#E11D48'},
    {'u': 'tibu',       'name': '替补奇兵',  'pts': 3640,  'hit': '2连红',             'c': '#0D9488'},
]


def load_db():
    """读取 data.json，不存在则用种子数据初始化。
    返回: { 'profiles': {u: {...}}, 'bets': {u: [...]} }
    """
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r', encoding='utf-8') as f:
            data = json.load(f)
            # 兼容旧格式（扁平 {u: {...bets...}} → 新格式）
            if 'profiles' not in data:
                profiles = {}
                bets = {}
                for u, acc in data.items():
                    bets[u] = acc.pop('bets', [])
                    profiles[u] = acc
                data = {'profiles': profiles, 'bets': bets}
                save_db(data)
            return data

    # 首次运行：种子数据
    profiles = {}
    bets = {}
    for s in SEED_USERS:
        profiles[s['u']] = {**s, 'pwd': PWD}
        bets[s['u']] = []
    data = {'profiles': profiles, 'bets': bets}
    save_db(data)
    return data


def save_db(db):
    """写入 data.json（调用方需持有 DB_LOCK）。"""
    with open(DATA_FILE, 'w', encoding='utf-8') as f:
        json.dump(db, f, ensure_ascii=False, indent=2)


class Handler(SimpleHTTPRequestHandler):
    """自定义请求处理器：静态文件 + REST API。"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=os.path.dirname(os.path.abspath(__file__)), **kwargs)

    # ---- helpers ----
    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode('utf-8')
        self.send_response(status)
        self.send_header('Content-Type', 'application/json; charset=utf-8')
        self.send_header('Content-Length', len(body))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get('Content-Length', 0))
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode('utf-8'))

    # ---- CORS preflight ----
    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    # ---- API routing ----
    def do_GET(self):
        path = urlparse(self.path).path
        if path == '/api/state':
            return self._handle_state()
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        if path == '/api/login':
            return self._handle_login()
        elif path == '/api/register':
            return self._handle_register()
        elif path == '/api/bet':
            return self._handle_bet()
        self._send_json({'ok': False, 'err': '未知接口'}, 404)

    # ---- handlers ----
    def _handle_state(self):
        with DB_LOCK:
            db = load_db()
        # 返回时将 bets 合并到 profiles 中，前端使用统一格式
        profiles = {}
        for u, p in db['profiles'].items():
            # 不返回密码
            profiles[u] = {k: v for k, v in p.items() if k != 'pwd'}
            profiles[u]['bets'] = db['bets'].get(u, [])
        self._send_json({'users': profiles})

    def _handle_login(self):
        body = self._read_body()
        u = (body.get('u') or '').strip().lower()
        pwd = body.get('pwd', '')
        if not u:
            return self._send_json({'ok': False, 'err': '请输入账号'})
        with DB_LOCK:
            db = load_db()
            acc = db['profiles'].get(u)
            if not acc:
                return self._send_json({'ok': False, 'err': '账号不存在'})
            if acc['pwd'] != pwd:
                return self._send_json({'ok': False, 'err': '密码错误'})
        return self._send_json({'ok': True})

    def _handle_register(self):
        body = self._read_body()
        name = (body.get('name') or '').strip()
        u = (body.get('u') or '').strip().lower()
        pwd = body.get('pwd', '')
        if not u or not name:
            return self._send_json({'ok': False, 'err': '请填写昵称和账号'})
        with DB_LOCK:
            db = load_db()
            if u in db['profiles']:
                return self._send_json({'ok': False, 'err': '账号已存在'})
            color = PALETTE[len(db['profiles']) % len(PALETTE)]
            db['profiles'][u] = {
                'u': u, 'name': name, 'pts': 5000,
                'hit': '新人 · 首单送 5000 积分', 'c': color,
                'pwd': pwd,
            }
            db['bets'][u] = []
            save_db(db)
        return self._send_json({'ok': True})

    def _handle_bet(self):
        body = self._read_body()
        u = (body.get('u') or '').strip().lower()
        bet = body.get('bet', {})
        if not u:
            return self._send_json({'ok': False, 'err': '未登录'})
        with DB_LOCK:
            db = load_db()
            acc = db['profiles'].get(u)
            if not acc:
                return self._send_json({'ok': False, 'err': '账号不存在'})
            stake = bet.get('stake', 0)
            if acc['pts'] < stake:
                return self._send_json({'ok': False, 'err': '积分不足'})
            rec = {
                **bet,
                'id': 'b' + str(int(time.time() * 1000)),
                'at': int(time.time() * 1000),
                'status': 'open',
            }
            acc['pts'] -= stake
            db['bets'][u].insert(0, rec)
            save_db(db)
        return self._send_json({'ok': True})


if __name__ == '__main__':
    print(f'⚽ MockGaming 服务启动 → http://localhost:{PORT}')
    print(f'📁 数据文件: {DATA_FILE}')
    HTTPServer(('0.0.0.0', PORT), Handler).serve_forever()
