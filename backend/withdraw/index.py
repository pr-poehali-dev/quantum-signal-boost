"""
Обработка заявок на вывод средств с поддержкой платёжных систем.
POST / — создать заявку на вывод (ЮKassa, Тинькофф, СберБанк, карта)
GET / — история выводов пользователя
"""
import json
import os
import psycopg2

PAYMENT_METHODS = {
    "card": {"name": "Банковская карта", "min_amount": 50, "commission": 0, "fields": ["card_number", "card_holder"]},
    "yookassa": {"name": "ЮKassa", "min_amount": 50, "commission": 0, "fields": ["yookassa_wallet"]},
    "tinkoff": {"name": "Тинькофф", "min_amount": 50, "commission": 0, "fields": ["card_number", "card_holder"]},
    "sberbank": {"name": "СберБанк", "min_amount": 50, "commission": 0, "fields": ["card_number", "card_holder"]},
    "sbp": {"name": "СБП (по номеру телефона)", "min_amount": 50, "commission": 0, "fields": ["phone_number", "bank_name"]},
}

SBP_BANKS = [
    "Сбербанк", "Тинькофф", "Альфа-Банк", "ВТБ", "Газпромбанк",
    "Райффайзен", "Совкомбанк", "Россельхозбанк", "Почта Банк", "МТС Банк",
    "Озон Банк", "Яндекс Банк",
]

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_by_token(cur, token):
    cur.execute(
        "SELECT u.id, u.balance FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=%s",
        (token,)
    )
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Вывод средств через ЮKassa, Тинькофф, СберБанк, СБП или карту."""
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
                "SELECT amount, card_number, card_holder, status, created_at, payment_method, bank_name, phone_number FROM withdrawals WHERE user_id=%s ORDER BY created_at DESC LIMIT 20",
                (user_id,)
            )
            rows = cur.fetchall()
            result = []
            for r in rows:
                item = {
                    "amount": float(r[0]),
                    "card_number": r[1],
                    "card_holder": r[2],
                    "status": r[3],
                    "created_at": str(r[4]),
                    "payment_method": r[5] or "card",
                    "bank_name": r[6] or "",
                    "phone_number": r[7] or "",
                }
                pm = PAYMENT_METHODS.get(item["payment_method"], PAYMENT_METHODS["card"])
                item["payment_method_name"] = pm["name"]
                result.append(item)

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "withdrawals": result,
                    "balance": balance,
                    "payment_methods": PAYMENT_METHODS,
                    "sbp_banks": SBP_BANKS,
                }),
            }

        if method == "POST":
            body = json.loads(event.get("body") or "{}")
            amount = float(body.get("amount", 0))
            payment_method = body.get("payment_method", "card")
            card_number = body.get("card_number", "").strip()
            card_holder = body.get("card_holder", "").strip()
            phone_number = body.get("phone_number", "").strip()
            bank_name = body.get("bank_name", "").strip()
            yookassa_wallet = body.get("yookassa_wallet", "").strip()

            if payment_method not in PAYMENT_METHODS:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Неизвестная платёжная система"})}

            pm = PAYMENT_METHODS[payment_method]

            if amount <= 0:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Сумма должна быть больше 0"})}
            if amount < pm["min_amount"]:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": f"Минимальная сумма вывода — {pm['min_amount']} ₽"})}
            if amount > balance:
                return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Недостаточно средств"})}

            if payment_method in ("card", "tinkoff", "sberbank"):
                if not card_number or not card_holder:
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Заполните данные карты"})}
            elif payment_method == "yookassa":
                if not yookassa_wallet:
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажите номер кошелька ЮKassa"})}
                card_number = yookassa_wallet
                card_holder = "ЮKassa"
            elif payment_method == "sbp":
                if not phone_number or not bank_name:
                    return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Укажите номер телефона и банк для СБП"})}
                card_number = phone_number
                card_holder = bank_name

            commission = round(amount * pm["commission"], 2)
            payout = round(amount - commission, 2)

            cur.execute(
                "INSERT INTO withdrawals (user_id, amount, card_number, card_holder, payment_method, bank_name, phone_number) VALUES (%s, %s, %s, %s, %s, %s, %s)",
                (user_id, payout, card_number, card_holder, payment_method, bank_name, phone_number)
            )
            cur.execute("UPDATE users SET balance = balance - %s WHERE id=%s", (amount, user_id))
            cur.execute("SELECT balance FROM users WHERE id=%s", (user_id,))
            new_balance = float(cur.fetchone()[0])
            conn.commit()

            method_name = pm["name"]
            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({
                    "success": True,
                    "new_balance": new_balance,
                    "payout": payout,
                    "commission": commission,
                    "payment_method": payment_method,
                    "message": f"Заявка на вывод {payout:.2f} ₽ через {method_name} принята! Средства поступят в течение 24 часов.",
                }),
            }

        return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}

    finally:
        cur.close()
        conn.close()
