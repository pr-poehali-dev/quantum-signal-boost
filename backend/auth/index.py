"""
Регистрация и авторизация пользователей DonPatchYYeasymoney.
POST body: {"action": "register", "name": ..., "email": ..., "password": ...}
POST body: {"action": "login", "email": ..., "password": ...}
GET + X-Auth-Token — проверить сессию
"""
import json
import os
import hashlib
import secrets
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode()).hexdigest()


def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    method = event.get("httpMethod", "GET")

    if method == "GET":
        token = (event.get("headers") or {}).get("X-Auth-Token", "")
        if not token:
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Нет токена"})}
        conn = get_conn()
        cur = conn.cursor()
        try:
            cur.execute(
                "SELECT u.id, u.name, u.email, u.balance, u.total_earned FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=%s",
                (token,)
            )
            user = cur.fetchone()
            if not user:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Сессия не найдена"})}
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({"user": {"id": user[0], "name": user[1], "email": user[2], "balance": float(user[3]), "total_earned": float(user[4])}}),
            }
        finally:
            cur.close()
            conn.close()

    if method == "POST":
        body = json.loads(event.get("body") or "{}")
        action = body.get("action", "")

        conn = get_conn()
        cur = conn.cursor()
        try:
            if action == "register":
                name = body.get("name", "").strip()
                email = body.get("email", "").strip().lower()
                password = body.get("password", "")

                if not name or not email or not password:
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Заполните все поля"})}

                pw_hash = hash_password(password)
                cur.execute(
                    "INSERT INTO users (name, email, password_hash) VALUES (%s, %s, %s) RETURNING id, name, email, balance",
                    (name, email, pw_hash)
                )
                user = cur.fetchone()
                token = secrets.token_hex(32)
                cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user[0], token))
                conn.commit()
                return {
                    "statusCode": 200,
                    "headers": headers,
                    "body": json.dumps({"token": token, "user": {"id": user[0], "name": user[1], "email": user[2], "balance": float(user[3])}}),
                }

            elif action == "login":
                email = body.get("email", "").strip().lower()
                password = body.get("password", "")
                pw_hash = hash_password(password)

                cur.execute("SELECT id, name, email, balance FROM users WHERE email=%s AND password_hash=%s", (email, pw_hash))
                user = cur.fetchone()
                if not user:
                    return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Неверный email или пароль"})}

                token = secrets.token_hex(32)
                cur.execute("INSERT INTO sessions (user_id, token) VALUES (%s, %s)", (user[0], token))
                conn.commit()
                return {
                    "statusCode": 200,
                    "headers": headers,
                    "body": json.dumps({"token": token, "user": {"id": user[0], "name": user[1], "email": user[2], "balance": float(user[3])}}),
                }

            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Неизвестное действие"})}

        except Exception as e:
            conn.rollback()
            msg = str(e)
            if "unique" in msg.lower():
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Email уже зарегистрирован"})}
            return {"statusCode": 500, "headers": headers, "body": json.dumps({"error": msg})}
        finally:
            cur.close()
            conn.close()

    return {"statusCode": 405, "headers": headers, "body": json.dumps({"error": "Method not allowed"})}
