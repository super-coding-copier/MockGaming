#!/usr/bin/env python3
"""MockGaming local backend.

Standard-library only:
- SQLite persistence
- password hashing
- bearer-token sessions
- server-side bet validation
- admin account, user/chip management, settlement and audit logs
"""

import base64
import hashlib
import hmac
import json
import os
import secrets
import sqlite3
import threading
import time
from http import cookies
from http.server import HTTPServer, SimpleHTTPRequestHandler
from datetime import datetime
from zoneinfo import ZoneInfo
from urllib.parse import urlparse

PORT = int(os.environ.get("PORT", "8000"))
ROOT = os.path.dirname(os.path.abspath(__file__))
DB_FILE = os.path.join(ROOT, os.environ.get("MOCKGAMING_DB", "mockgaming.sqlite3"))
SESSION_TTL = 60 * 60 * 24 * 14
TASK_INTERVAL_SECONDS = int(os.environ.get("MOCKGAMING_TASK_INTERVAL", "60"))
KICKOFF_TZ = ZoneInfo(os.environ.get("MOCKGAMING_KICKOFF_TZ", "Asia/Shanghai"))

PALETTE = [
    "#0EA5A0", "#F59E0B", "#7C3AED", "#2563EB", "#DB2777", "#16A34A",
    "#FF6A1A", "#0891B2", "#65A30D", "#9333EA", "#E11D48", "#0D9488",
]

SEED_USERS = [
    {"u": "laoqiang", "name": "老枪K", "pts": 15240, "hit": "12连红", "c": "#0EA5A0"},
    {"u": "qiuwang", "name": "球王32", "pts": 14180, "hit": "本周 9 中 7", "c": "#F59E0B"},
    {"u": "beikantai", "name": "北看台", "pts": 13760, "hit": "8连红", "c": "#7C3AED"},
    {"u": "laozhang", "name": "老张说球", "pts": 12030, "hit": "本周 11 中 6", "c": "#2563EB"},
    {"u": "juesha", "name": "绝杀时刻", "pts": 11470, "hit": "本周 7 中 3", "c": "#DB2777"},
    {"u": "zhongchang", "name": "中场休息", "pts": 9890, "hit": "5连红", "c": "#16A34A"},
    {"u": "demo", "name": "我", "pts": 8620, "hit": "6连红 · 状态火热", "c": "#FF6A1A"},
    {"u": "yuewei", "name": "越位陷阱", "pts": 7350, "hit": "本周 8 中 4", "c": "#0891B2"},
    {"u": "renyiqiu", "name": "任意球", "pts": 6420, "hit": "3连红", "c": "#65A30D"},
    {"u": "menxian", "name": "门线技术", "pts": 5210, "hit": "本周 6 中 3", "c": "#9333EA"},
    {"u": "bushi", "name": "补时狂人", "pts": 4080, "hit": "本周 9 中 2", "c": "#E11D48"},
    {"u": "tibu", "name": "替补奇兵", "pts": 3640, "hit": "2连红", "c": "#0D9488"},
]

MATCHES = [
    ("m01", "A", "6月12日", "03:00", "墨西哥城", "墨西哥", "南非", 1.72, 3.50, 4.60),
    ("m02", "A", "6月12日", "10:00", "瓜达拉哈拉", "韩国", "捷克", 2.62, 3.20, 2.66),
    ("m03", "B", "6月13日", "03:00", "多伦多", "加拿大", "波黑", 2.26, 3.20, 3.15),
    ("m04", "D", "6月13日", "09:00", "英格尔伍德", "美国", "巴拉圭", 2.10, 3.25, 3.50),
    ("m05", "B", "6月14日", "03:00", "圣克拉拉", "卡塔尔", "瑞士", 4.80, 3.70, 1.70),
    ("m06", "C", "6月14日", "06:00", "东卢瑟福", "巴西", "摩洛哥", 1.55, 3.90, 5.80),
    ("m07", "C", "6月14日", "09:00", "福克斯堡", "海地", "苏格兰", 5.20, 3.60, 1.62),
    ("m08", "D", "6月14日", "12:00", "温哥华", "澳大利亚", "土耳其", 3.95, 3.40, 1.88),
    ("m09", "E", "6月15日", "01:00", "休斯顿", "德国", "库拉索", 1.16, 6.80, 14.0),
    ("m10", "F", "6月15日", "04:00", "阿灵顿", "荷兰", "日本", 1.70, 3.70, 4.70),
    ("m11", "E", "6月15日", "07:00", "费城", "科特迪瓦", "厄瓜多尔", 2.78, 3.10, 2.58),
    ("m12", "F", "6月15日", "10:00", "瓜达卢佩", "瑞典", "突尼斯", 2.30, 3.10, 3.20),
    ("m13", "H", "6月16日", "01:00", "亚特兰大", "西班牙", "佛得角", 1.20, 6.20, 12.0),
    ("m14", "G", "6月16日", "06:00", "西雅图", "比利时", "埃及", 1.58, 3.85, 5.60),
    ("m15", "H", "6月16日", "06:00", "迈阿密", "沙特", "乌拉圭", 5.00, 3.55, 1.68),
    ("m16", "G", "6月16日", "12:00", "英格尔伍德", "伊朗", "新西兰", 1.92, 3.25, 4.10),
    ("m17", "I", "6月17日", "03:00", "东卢瑟福", "法国", "塞内加尔", 1.80, 3.55, 4.50),
    ("m18", "I", "6月17日", "06:00", "福克斯堡", "伊拉克", "挪威", 4.70, 3.55, 1.72),
    ("m19", "J", "6月17日", "09:00", "堪萨斯城", "阿根廷", "阿尔及利亚", 1.33, 4.90, 8.80),
    ("m20", "J", "6月17日", "12:00", "圣克拉拉", "奥地利", "约旦", 1.64, 3.60, 5.40),
    ("m21", "K", "6月18日", "01:00", "休斯顿", "葡萄牙", "刚果(金)", 1.50, 4.10, 6.60),
    ("m22", "L", "6月18日", "04:00", "阿灵顿", "英格兰", "克罗地亚", 2.00, 3.40, 3.85),
    ("m23", "L", "6月18日", "07:00", "多伦多", "加纳", "巴拿马", 2.32, 3.10, 3.25),
    ("m24", "K", "6月18日", "10:00", "墨西哥城", "乌兹别克", "哥伦比亚", 4.50, 3.45, 1.80),
]

OUT = {"H": "主胜", "D": "平局", "A": "客胜"}


def kickoff_ms(month, day, hour, minute):
    return int(datetime(2026, month, day, hour, minute, tzinfo=KICKOFF_TZ).timestamp() * 1000)


KICKOFFS = {
    "m01": kickoff_ms(6, 12, 3, 0),
    "m02": kickoff_ms(6, 12, 10, 0),
    "m03": kickoff_ms(6, 13, 3, 0),
    "m04": kickoff_ms(6, 13, 9, 0),
    "m05": kickoff_ms(6, 14, 3, 0),
    "m06": kickoff_ms(6, 14, 6, 0),
    "m07": kickoff_ms(6, 14, 9, 0),
    "m08": kickoff_ms(6, 14, 12, 0),
    "m09": kickoff_ms(6, 15, 1, 0),
    "m10": kickoff_ms(6, 15, 4, 0),
    "m11": kickoff_ms(6, 15, 7, 0),
    "m12": kickoff_ms(6, 15, 10, 0),
    "m13": kickoff_ms(6, 16, 1, 0),
    "m14": kickoff_ms(6, 16, 6, 0),
    "m15": kickoff_ms(6, 16, 6, 0),
    "m16": kickoff_ms(6, 16, 12, 0),
    "m17": kickoff_ms(6, 17, 3, 0),
    "m18": kickoff_ms(6, 17, 6, 0),
    "m19": kickoff_ms(6, 17, 9, 0),
    "m20": kickoff_ms(6, 17, 12, 0),
    "m21": kickoff_ms(6, 18, 1, 0),
    "m22": kickoff_ms(6, 18, 4, 0),
    "m23": kickoff_ms(6, 18, 7, 0),
    "m24": kickoff_ms(6, 18, 10, 0),
}


def now_ms():
    return int(time.time() * 1000)


def db():
    conn = sqlite3.connect(DB_FILE)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA foreign_keys = ON")
    return conn


def hash_password(password, salt=None):
    if salt is None:
        salt = secrets.token_bytes(16)
    digest = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120000)
    return base64.b64encode(salt).decode() + "$" + base64.b64encode(digest).decode()


def verify_password(password, stored):
    try:
        salt_b64, digest_b64 = stored.split("$", 1)
        salt = base64.b64decode(salt_b64)
        expected = base64.b64decode(digest_b64)
        got = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, 120000)
        return hmac.compare_digest(got, expected)
    except Exception:
        return False


def ensure_column(conn, table, column, ddl):
    cols = {r["name"] for r in conn.execute(f"PRAGMA table_info({table})")}
    if column not in cols:
        conn.execute(f"ALTER TABLE {table} ADD COLUMN {ddl}")


def init_db():
    with db() as conn:
        conn.executescript(
            """
            CREATE TABLE IF NOT EXISTS users (
              u TEXT PRIMARY KEY,
              name TEXT NOT NULL,
              pwd_hash TEXT NOT NULL,
              role TEXT NOT NULL DEFAULT 'user',
              pts INTEGER NOT NULL DEFAULT 0,
              hit TEXT NOT NULL DEFAULT '',
              color TEXT NOT NULL,
              disabled INTEGER NOT NULL DEFAULT 0,
              must_change_pwd INTEGER NOT NULL DEFAULT 0,
              created_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS sessions (
              token TEXT PRIMARY KEY,
              u TEXT NOT NULL REFERENCES users(u) ON DELETE CASCADE,
              expires_at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS matches (
              id TEXT PRIMARY KEY,
              grp TEXT NOT NULL,
              date TEXT NOT NULL,
              time TEXT NOT NULL,
              venue TEXT NOT NULL,
              home TEXT NOT NULL,
              away TEXT NOT NULL,
              odds_h REAL NOT NULL,
              odds_d REAL NOT NULL,
              odds_a REAL NOT NULL,
              kickoff_ts INTEGER,
              score_home INTEGER,
              score_away INTEGER,
              result TEXT,
              locked INTEGER NOT NULL DEFAULT 0,
              settled_at INTEGER
            );
            CREATE TABLE IF NOT EXISTS bets (
              id TEXT PRIMARY KEY,
              u TEXT NOT NULL REFERENCES users(u) ON DELETE CASCADE,
              stake INTEGER NOT NULL,
              combined REAL NOT NULL,
              payout INTEGER NOT NULL,
              actual_payout INTEGER NOT NULL DEFAULT 0,
              status TEXT NOT NULL,
              at INTEGER NOT NULL,
              settled_at INTEGER
            );
            CREATE TABLE IF NOT EXISTS bet_legs (
              bet_id TEXT NOT NULL REFERENCES bets(id) ON DELETE CASCADE,
              match_id TEXT NOT NULL REFERENCES matches(id),
              outcome TEXT NOT NULL,
              odds REAL NOT NULL,
              PRIMARY KEY (bet_id, match_id)
            );
            CREATE TABLE IF NOT EXISTS ledger (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              u TEXT NOT NULL REFERENCES users(u) ON DELETE CASCADE,
              kind TEXT NOT NULL,
              amount INTEGER NOT NULL,
              balance_after INTEGER NOT NULL,
              ref TEXT,
              note TEXT,
              actor TEXT,
              at INTEGER NOT NULL
            );
            CREATE TABLE IF NOT EXISTS audit_logs (
              id INTEGER PRIMARY KEY AUTOINCREMENT,
              actor TEXT NOT NULL,
              action TEXT NOT NULL,
              target TEXT,
              detail TEXT,
              at INTEGER NOT NULL
            );
            """
        )
        ensure_column(conn, "matches", "kickoff_ts", "kickoff_ts INTEGER")
        ensure_column(conn, "matches", "score_home", "score_home INTEGER")
        ensure_column(conn, "matches", "score_away", "score_away INTEGER")
        for i, s in enumerate(SEED_USERS):
            conn.execute(
                """
                INSERT OR IGNORE INTO users
                (u, name, pwd_hash, role, pts, hit, color, disabled, must_change_pwd, created_at)
                VALUES (?, ?, ?, 'user', ?, ?, ?, 0, 0, ?)
                """,
                (s["u"], s["name"], hash_password("123456"), s["pts"], s["hit"], s["c"], now_ms()),
            )
        conn.execute(
            """
            INSERT OR IGNORE INTO users
            (u, name, pwd_hash, role, pts, hit, color, disabled, must_change_pwd, created_at)
            VALUES ('admin', '管理员', ?, 'admin', 999999, '超级账号', '#111827', 0, 1, ?)
            """,
            (hash_password(os.environ.get("MOCKGAMING_ADMIN_PASSWORD", "admin123456")), now_ms()),
        )
        for m in MATCHES:
            conn.execute(
                """
                INSERT OR IGNORE INTO matches
                (id, grp, date, time, venue, home, away, odds_h, odds_d, odds_a, kickoff_ts)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                """,
                (*m, KICKOFFS.get(m[0])),
            )
            conn.execute("UPDATE matches SET kickoff_ts = COALESCE(kickoff_ts, ?) WHERE id = ?", (KICKOFFS.get(m[0]), m[0]))


def row_user(r, include_flags=False):
    item = {
        "u": r["u"],
        "name": r["name"],
        "role": r["role"],
        "pts": r["pts"],
        "hit": r["hit"],
        "c": r["color"],
        "disabled": bool(r["disabled"]),
    }
    if include_flags:
        item["mustChangePwd"] = bool(r["must_change_pwd"])
    return item


def get_user(conn, u):
    return conn.execute("SELECT * FROM users WHERE u = ?", (u,)).fetchone()


def add_ledger(conn, u, kind, amount, ref=None, note=None, actor=None):
    user = get_user(conn, u)
    conn.execute(
        """
        INSERT INTO ledger (u, kind, amount, balance_after, ref, note, actor, at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (u, kind, amount, user["pts"], ref, note, actor, now_ms()),
    )


def audit(conn, actor, action, target=None, detail=None):
    conn.execute(
        "INSERT INTO audit_logs (actor, action, target, detail, at) VALUES (?, ?, ?, ?, ?)",
        (actor, action, target, detail, now_ms()),
    )


def create_session(conn, u):
    token = secrets.token_urlsafe(32)
    conn.execute("DELETE FROM sessions WHERE expires_at < ?", (int(time.time()),))
    conn.execute("INSERT INTO sessions (token, u, expires_at) VALUES (?, ?, ?)", (token, u, int(time.time()) + SESSION_TTL))
    return token


def get_token(headers):
    auth = headers.get("Authorization", "")
    if auth.startswith("Bearer "):
        return auth[7:].strip()
    raw_cookie = headers.get("Cookie", "")
    if raw_cookie:
        jar = cookies.SimpleCookie(raw_cookie)
        if "mg_session" in jar:
            return jar["mg_session"].value
    return ""


def auth_user(headers):
    token = get_token(headers)
    if not token:
        return None
    with db() as conn:
        r = conn.execute(
            """
            SELECT users.* FROM sessions
            JOIN users ON users.u = sessions.u
            WHERE sessions.token = ? AND sessions.expires_at >= ?
            """,
            (token, int(time.time())),
        ).fetchone()
        return dict(r) if r else None


def require_user(headers):
    user = auth_user(headers)
    if not user:
        raise PermissionError("请先登录")
    if user["disabled"]:
        raise PermissionError("账号已停用")
    return user


def require_admin(headers):
    user = require_user(headers)
    if user["role"] != "admin":
        raise PermissionError("需要管理员权限")
    return user


def public_state(current=None):
    with db() as conn:
        users = []
        for r in conn.execute("SELECT * FROM users ORDER BY pts DESC"):
            item = row_user(r, include_flags=current and current["u"] == r["u"])
            if current and current["u"] == r["u"]:
                item["bets"] = user_bets(conn, r["u"])
                item["ledger"] = user_ledger(conn, r["u"])
            else:
                item["bets"] = []
            users.append(item)
        matches = [dict(r) for r in conn.execute("SELECT * FROM matches ORDER BY id")]
    return {"me": row_user(current, True) if current else None, "users": {u["u"]: u for u in users}, "matches": matches}


def user_bets(conn, u, limit=100):
    out = []
    for b in conn.execute("SELECT * FROM bets WHERE u = ? ORDER BY at DESC LIMIT ?", (u, limit)):
        legs = []
        for l in conn.execute(
            """
            SELECT bet_legs.*, matches.grp, matches.home, matches.away, matches.result
            FROM bet_legs JOIN matches ON matches.id = bet_legs.match_id
            WHERE bet_id = ? ORDER BY match_id
            """,
            (b["id"],),
        ):
            legs.append({
                "matchId": l["match_id"],
                "grp": l["grp"],
                "home": l["home"],
                "away": l["away"],
                "pick": OUT[l["outcome"]],
                "outcome": l["outcome"],
                "odds": l["odds"],
                "result": l["result"],
            })
        item = dict(b)
        item["legs"] = legs
        out.append(item)
    return out


def user_ledger(conn, u, limit=80):
    return [dict(r) for r in conn.execute("SELECT * FROM ledger WHERE u = ? ORDER BY at DESC LIMIT ?", (u, limit))]


def admin_state():
    with db() as conn:
        users = [row_user(r, True) for r in conn.execute("SELECT * FROM users ORDER BY role DESC, pts DESC")]
        bets = []
        for b in conn.execute(
            """
            SELECT bets.*, users.name FROM bets
            JOIN users ON users.u = bets.u
            ORDER BY bets.at DESC LIMIT 200
            """
        ):
            item = dict(b)
            item["userName"] = item.pop("name")
            item["legs"] = []
            for l in conn.execute(
                """
                SELECT bet_legs.*, matches.grp, matches.home, matches.away, matches.result
                FROM bet_legs JOIN matches ON matches.id = bet_legs.match_id
                WHERE bet_id = ? ORDER BY match_id
                """,
                (b["id"],),
            ):
                item["legs"].append({
                    "matchId": l["match_id"], "grp": l["grp"], "home": l["home"], "away": l["away"],
                    "pick": OUT[l["outcome"]], "outcome": l["outcome"], "odds": l["odds"], "result": l["result"],
                })
            bets.append(item)
        return {
            "users": users,
            "matches": [dict(r) for r in conn.execute("SELECT * FROM matches ORDER BY id")],
            "bets": bets,
            "ledger": [dict(r) for r in conn.execute("SELECT * FROM ledger ORDER BY at DESC LIMIT 200")],
            "logs": [dict(r) for r in conn.execute("SELECT * FROM audit_logs ORDER BY at DESC LIMIT 200")],
        }


def odds_for(match, outcome):
    return {"H": match["odds_h"], "D": match["odds_d"], "A": match["odds_a"]}.get(outcome)


def result_from_score(home_score, away_score):
    if home_score > away_score:
        return "H"
    if home_score < away_score:
        return "A"
    return "D"


def lock_due_matches(conn, actor="system"):
    rows = conn.execute(
        """
        SELECT id, home, away FROM matches
        WHERE result IS NULL AND locked = 0 AND kickoff_ts IS NOT NULL AND kickoff_ts <= ?
        """,
        (now_ms(),),
    ).fetchall()
    for r in rows:
        conn.execute("UPDATE matches SET locked = 1 WHERE id = ?", (r["id"],))
        audit(conn, actor, "auto_lock_match", r["id"], f"{r['home']} vs {r['away']}")
    return len(rows)


def task_loop():
    while True:
        try:
            with db() as conn:
                lock_due_matches(conn, "system")
        except Exception as e:
            print(f"scheduled task error: {e}")
        time.sleep(TASK_INTERVAL_SECONDS)


def start_task_runner():
    t = threading.Thread(target=task_loop, name="mockgaming-task-runner", daemon=True)
    t.start()


def recalc_bets_for_match(conn, match_id, actor):
    bet_ids = [r["bet_id"] for r in conn.execute("SELECT DISTINCT bet_id FROM bet_legs WHERE match_id = ?", (match_id,))]
    for bet_id in bet_ids:
        b = conn.execute("SELECT * FROM bets WHERE id = ?", (bet_id,)).fetchone()
        if not b or b["status"] != "open":
            continue
        legs = conn.execute(
            """
            SELECT bet_legs.outcome, matches.result
            FROM bet_legs JOIN matches ON matches.id = bet_legs.match_id
            WHERE bet_id = ?
            """,
            (bet_id,),
        ).fetchall()
        if any(l["result"] is None for l in legs):
            continue
        won = all(l["result"] == l["outcome"] for l in legs)
        status = "won" if won else "lost"
        payout = b["payout"] if won else 0
        if won:
            conn.execute("UPDATE users SET pts = pts + ? WHERE u = ?", (payout, b["u"]))
            add_ledger(conn, b["u"], "payout", payout, bet_id, "中奖返奖", actor)
        conn.execute(
            "UPDATE bets SET status = ?, actual_payout = ?, settled_at = ? WHERE id = ?",
            (status, payout, now_ms(), bet_id),
        )


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _send_json(self, data, status=200):
        body = json.dumps(data, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.end_headers()
        self.wfile.write(body)

    def _read_body(self):
        length = int(self.headers.get("Content-Length", 0))
        if not length:
            return {}
        return json.loads(self.rfile.read(length).decode("utf-8"))

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type, Authorization")
        self.end_headers()

    def do_GET(self):
        path = urlparse(self.path).path
        try:
            if path == "/api/state":
                return self._send_json(public_state(auth_user(self.headers)))
            if path == "/api/admin/state":
                require_admin(self.headers)
                return self._send_json(admin_state())
        except PermissionError as e:
            return self._send_json({"ok": False, "err": str(e)}, 403)
        return super().do_GET()

    def do_POST(self):
        path = urlparse(self.path).path
        try:
            if path == "/api/login":
                return self._handle_login()
            if path == "/api/logout":
                return self._handle_logout()
            if path == "/api/register":
                return self._send_json({"ok": False, "err": "当前为邀请制，请联系管理员分配账号"}, 403)
            if path == "/api/change-password":
                return self._handle_change_password()
            if path == "/api/bet":
                return self._handle_bet()
            if path == "/api/admin/create-user":
                return self._handle_create_user()
            if path == "/api/admin/adjust-points":
                return self._handle_adjust_points()
            if path == "/api/admin/reset-password":
                return self._handle_reset_password()
            if path == "/api/admin/toggle-user":
                return self._handle_toggle_user()
            if path == "/api/admin/settle-match":
                return self._handle_settle_match()
            if path == "/api/admin/lock-match":
                return self._handle_lock_match()
            if path == "/api/admin/update-odds":
                return self._handle_update_odds()
            if path == "/api/admin/settle-score":
                return self._handle_settle_score()
        except PermissionError as e:
            return self._send_json({"ok": False, "err": str(e)}, 403)
        except ValueError as e:
            return self._send_json({"ok": False, "err": str(e)}, 400)
        except sqlite3.IntegrityError as e:
            return self._send_json({"ok": False, "err": "数据冲突：" + str(e)}, 400)
        return self._send_json({"ok": False, "err": "未知接口"}, 404)

    def _handle_login(self):
        body = self._read_body()
        u = (body.get("u") or "").strip().lower()
        pwd = body.get("pwd") or ""
        with db() as conn:
            acc = get_user(conn, u)
            if not acc or not verify_password(pwd, acc["pwd_hash"]):
                return self._send_json({"ok": False, "err": "账号或密码错误"}, 401)
            if acc["disabled"]:
                return self._send_json({"ok": False, "err": "账号已停用"}, 403)
            token = create_session(conn, u)
            audit(conn, u, "login", u, None)
            return self._send_json({"ok": True, "token": token, "user": row_user(acc, True)})

    def _handle_logout(self):
        token = get_token(self.headers)
        if token:
            with db() as conn:
                conn.execute("DELETE FROM sessions WHERE token = ?", (token,))
        return self._send_json({"ok": True})

    def _handle_change_password(self):
        user = require_user(self.headers)
        body = self._read_body()
        old = body.get("oldPwd") or ""
        new = body.get("newPwd") or ""
        if len(new) < 6:
            raise ValueError("新密码至少 6 位")
        with db() as conn:
            acc = get_user(conn, user["u"])
            if not verify_password(old, acc["pwd_hash"]):
                raise ValueError("原密码错误")
            conn.execute("UPDATE users SET pwd_hash = ?, must_change_pwd = 0 WHERE u = ?", (hash_password(new), user["u"]))
            audit(conn, user["u"], "change_password", user["u"], None)
        return self._send_json({"ok": True})

    def _handle_bet(self):
        user = require_user(self.headers)
        if user["role"] == "admin":
            raise ValueError("管理员账号不参与竞猜")
        body = self._read_body()
        stake = int(body.get("stake") or 0)
        legs_in = body.get("legs") or []
        if stake <= 0:
            raise ValueError("投注积分必须大于 0")
        if stake > 1000000:
            raise ValueError("单笔投注过大")
        if not isinstance(legs_in, list) or not legs_in:
            raise ValueError("请选择比赛")
        if len(legs_in) > 12:
            raise ValueError("串关场次过多")
        with db() as conn:
            lock_due_matches(conn, "system")
            acc = get_user(conn, user["u"])
            if acc["pts"] < stake:
                raise ValueError("积分不足")
            seen = set()
            legs = []
            combined = 1.0
            for leg in legs_in:
                mid = str(leg.get("matchId") or "")
                outcome = str(leg.get("outcome") or "")
                if mid in seen:
                    raise ValueError("同一场比赛不能重复选择")
                if outcome not in OUT:
                    raise ValueError("投注选项无效")
                match = conn.execute("SELECT * FROM matches WHERE id = ?", (mid,)).fetchone()
                if not match:
                    raise ValueError("比赛不存在")
                if match["locked"] or match["result"] is not None:
                    raise ValueError(f"{match['home']} vs {match['away']} 已关闭投注")
                odd = odds_for(match, outcome)
                legs.append((mid, outcome, odd))
                combined *= odd
                seen.add(mid)
            payout = int(round(stake * combined))
            bet_id = "b" + str(now_ms()) + secrets.token_hex(2)
            conn.execute("UPDATE users SET pts = pts - ? WHERE u = ?", (stake, user["u"]))
            conn.execute(
                "INSERT INTO bets (id, u, stake, combined, payout, status, at) VALUES (?, ?, ?, ?, ?, 'open', ?)",
                (bet_id, user["u"], stake, combined, payout, now_ms()),
            )
            for mid, outcome, odd in legs:
                conn.execute("INSERT INTO bet_legs (bet_id, match_id, outcome, odds) VALUES (?, ?, ?, ?)", (bet_id, mid, outcome, odd))
            add_ledger(conn, user["u"], "stake", -stake, bet_id, "投注扣分", user["u"])
        return self._send_json({"ok": True, "betId": bet_id})

    def _handle_create_user(self):
        admin = require_admin(self.headers)
        body = self._read_body()
        u = (body.get("u") or "").strip().lower()
        name = (body.get("name") or "").strip()
        pwd = body.get("pwd") or "123456"
        pts = int(body.get("pts") or 5000)
        role = "admin" if body.get("role") == "admin" else "user"
        if not u or not name:
            raise ValueError("账号和昵称不能为空")
        with db() as conn:
            color = PALETTE[conn.execute("SELECT COUNT(*) AS n FROM users").fetchone()["n"] % len(PALETTE)]
            conn.execute(
                """
                INSERT INTO users (u, name, pwd_hash, role, pts, hit, color, disabled, must_change_pwd, created_at)
                VALUES (?, ?, ?, ?, ?, '管理员分配账号', ?, 0, 1, ?)
                """,
                (u, name, hash_password(pwd), role, pts, color, now_ms()),
            )
            audit(conn, admin["u"], "create_user", u, json.dumps({"pts": pts, "role": role}, ensure_ascii=False))
        return self._send_json({"ok": True})

    def _handle_adjust_points(self):
        admin = require_admin(self.headers)
        body = self._read_body()
        u = (body.get("u") or "").strip().lower()
        amount = int(body.get("amount") or 0)
        note = (body.get("note") or "").strip()[:200]
        if not u or amount == 0:
            raise ValueError("请选择用户并填写非 0 积分")
        with db() as conn:
            if not get_user(conn, u):
                raise ValueError("用户不存在")
            conn.execute("UPDATE users SET pts = MAX(0, pts + ?) WHERE u = ?", (amount, u))
            add_ledger(conn, u, "admin_adjust", amount, None, note or "管理员调整", admin["u"])
            audit(conn, admin["u"], "adjust_points", u, json.dumps({"amount": amount, "note": note}, ensure_ascii=False))
        return self._send_json({"ok": True})

    def _handle_reset_password(self):
        admin = require_admin(self.headers)
        body = self._read_body()
        u = (body.get("u") or "").strip().lower()
        pwd = body.get("pwd") or "123456"
        if len(pwd) < 6:
            raise ValueError("密码至少 6 位")
        with db() as conn:
            conn.execute("UPDATE users SET pwd_hash = ?, must_change_pwd = 1 WHERE u = ?", (hash_password(pwd), u))
            audit(conn, admin["u"], "reset_password", u, None)
        return self._send_json({"ok": True})

    def _handle_toggle_user(self):
        admin = require_admin(self.headers)
        body = self._read_body()
        u = (body.get("u") or "").strip().lower()
        disabled = 1 if body.get("disabled") else 0
        if u == admin["u"] and disabled:
            raise ValueError("不能停用当前管理员")
        with db() as conn:
            conn.execute("UPDATE users SET disabled = ? WHERE u = ?", (disabled, u))
            audit(conn, admin["u"], "toggle_user", u, json.dumps({"disabled": bool(disabled)}, ensure_ascii=False))
        return self._send_json({"ok": True})

    def _handle_settle_match(self):
        admin = require_admin(self.headers)
        body = self._read_body()
        mid = str(body.get("matchId") or "")
        result = str(body.get("result") or "")
        if result not in OUT:
            raise ValueError("赛果无效")
        with db() as conn:
            match = conn.execute("SELECT * FROM matches WHERE id = ?", (mid,)).fetchone()
            if not match:
                raise ValueError("比赛不存在")
            if match["result"] is not None:
                raise ValueError("比赛已经结算，避免重复返奖")
            conn.execute("UPDATE matches SET result = ?, locked = 1, settled_at = ? WHERE id = ?", (result, now_ms(), mid))
            recalc_bets_for_match(conn, mid, admin["u"])
            audit(conn, admin["u"], "settle_match", mid, result)
        return self._send_json({"ok": True})

    def _handle_settle_score(self):
        admin = require_admin(self.headers)
        body = self._read_body()
        mid = str(body.get("matchId") or "")
        try:
            score_home = int(body.get("scoreHome"))
            score_away = int(body.get("scoreAway"))
        except (TypeError, ValueError):
            raise ValueError("请输入有效比分")
        if score_home < 0 or score_away < 0:
            raise ValueError("比分不能为负数")
        result = result_from_score(score_home, score_away)
        with db() as conn:
            match = conn.execute("SELECT * FROM matches WHERE id = ?", (mid,)).fetchone()
            if not match:
                raise ValueError("比赛不存在")
            if match["result"] is not None:
                raise ValueError("比赛已经结算，避免重复返奖")
            conn.execute(
                """
                UPDATE matches
                SET score_home = ?, score_away = ?, result = ?, locked = 1, settled_at = ?
                WHERE id = ?
                """,
                (score_home, score_away, result, now_ms(), mid),
            )
            recalc_bets_for_match(conn, mid, admin["u"])
            audit(conn, admin["u"], "settle_score", mid, json.dumps({
                "scoreHome": score_home, "scoreAway": score_away, "result": result,
            }, ensure_ascii=False))
        return self._send_json({"ok": True, "result": result})

    def _handle_update_odds(self):
        admin = require_admin(self.headers)
        body = self._read_body()
        mid = str(body.get("matchId") or "")
        try:
            odds_h = float(body.get("oddsH"))
            odds_d = float(body.get("oddsD"))
            odds_a = float(body.get("oddsA"))
        except (TypeError, ValueError):
            raise ValueError("请输入有效赔率")
        if min(odds_h, odds_d, odds_a) <= 1:
            raise ValueError("赔率必须大于 1")
        if max(odds_h, odds_d, odds_a) > 100:
            raise ValueError("赔率过大")
        with db() as conn:
            match = conn.execute("SELECT * FROM matches WHERE id = ?", (mid,)).fetchone()
            if not match:
                raise ValueError("比赛不存在")
            if match["result"] is not None:
                raise ValueError("已结算比赛不能修改赔率")
            conn.execute(
                "UPDATE matches SET odds_h = ?, odds_d = ?, odds_a = ? WHERE id = ?",
                (round(odds_h, 3), round(odds_d, 3), round(odds_a, 3), mid),
            )
            audit(conn, admin["u"], "update_odds", mid, json.dumps({
                "H": odds_h, "D": odds_d, "A": odds_a,
            }, ensure_ascii=False))
        return self._send_json({"ok": True})

    def _handle_lock_match(self):
        admin = require_admin(self.headers)
        body = self._read_body()
        mid = str(body.get("matchId") or "")
        locked = 1 if body.get("locked") else 0
        with db() as conn:
            conn.execute("UPDATE matches SET locked = ? WHERE id = ? AND result IS NULL", (locked, mid))
            audit(conn, admin["u"], "lock_match", mid, json.dumps({"locked": bool(locked)}))
        return self._send_json({"ok": True})


if __name__ == "__main__":
    init_db()
    start_task_runner()
    print(f"MockGaming 服务启动: http://localhost:{PORT}")
    print(f"SQLite 数据库: {DB_FILE}")
    print("默认管理员: admin / admin123456（首次登录后请改密码）")
    HTTPServer(("0.0.0.0", PORT), Handler).serve_forever()
