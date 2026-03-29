"""
Обработка заявок на вывод средств.
POST / — создать заявку на вывод (требует X-Auth-Token)
GET / — история выводов пользователя
"""
import json
import os
import psycopg2


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_by_token(cur, token):
    cur.execute(
        "SELECT u.id, u.balance FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=%s",
        (token,)
    )
    return cur.fetchone()


def handler(event: dict, context) -> dict:
    headers = {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, X-Auth-Token",
        "Content-Type": "application/json",
    }

    if event.get("httpMethod") == "OPTIONS":
        return {"statusCode": 200, "headers": headers, "body": ""}

    token = event.get("headers", {}).get("X-Auth-Token", "")
    if not token:
        return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Нет токена"})}

    method = event.get("httpMethod", "GET")
    conn = get_conn()
    cur = conn.cursor()

    try:
        user = get_user_by_token(cur, token)
        if not user:
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Нет сессии"})}

        user_id, balance = user[0], float(user[1])

        if method == "GET":
            cur.execute(
                "SELECT amount, card_number, card_holder, status, created_at FROM withdrawals WHERE user_id=%s ORDER BY created_at DESC LIMIT 20",
                (user_id,)
            )
            rows = cur.fetchall()
            result = [{"amount": float(r[0]), "card_number": r[1], "card_holder": r[2], "status": r[3], "created_at": str(r[4])} for r in rows]
            return {"statusCode": 200, "headers": headers, "body": json.dumps({"withdrawals": result, "balance": balance})}

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            amount = float(body.get("amount", 0))
            card_number = body.get("card_number", "").strip()
            card_holder = body.get("card_holder", "").strip()

            if amount <= 0:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Сумма должна быть больше 0"})}
            if amount < 50:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Минимальная сумма вывода — 50 ₽"})}
            if amount > balance:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Недостаточно средств"})}
            if not card_number or not card_holder:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Заполните данные карты"})}

            cur.execute(
                "INSERT INTO withdrawals (user_id, amount, card_number, card_holder) VALUES (%s, %s, %s, %s)",
                (user_id, amount, card_number, card_holder)
            )
            cur.execute("UPDATE users SET balance = balance - %s WHERE id=%s", (amount, user_id))
            cur.execute("SELECT balance FROM users WHERE id=%s", (user_id,))
            new_balance = float(cur.fetchone()[0])
            conn.commit()

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({"success": True, "new_balance": new_balance, "message": "Заявка на вывод принята! Средства поступят в течение 24 часов."}),
            }

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()