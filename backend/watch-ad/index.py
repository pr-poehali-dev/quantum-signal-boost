"""
Фиксирует просмотр рекламы и начисляет 50% прибыли пользователю.
POST / — засчитать просмотр рекламы (требует X-Auth-Token)
GET / — получить список доступных реклам
"""
import json
import os
import psycopg2


ADS = [
    {"id": 1, "title": "Новый смартфон XPhone Pro", "brand": "XPhone", "duration": 15, "reward": 25.00, "video_url": "https://www.w3schools.com/html/mov_bbb.mp4", "color": "#e74c3c"},
    {"id": 2, "title": "Доставка еды FastFood", "brand": "FastFood", "duration": 15, "reward": 18.00, "video_url": "https://www.w3schools.com/html/mov_bbb.mp4", "color": "#e67e22"},
    {"id": 3, "title": "Онлайн-курсы SkillUp", "brand": "SkillUp", "duration": 20, "reward": 30.00, "video_url": "https://www.w3schools.com/html/mov_bbb.mp4", "color": "#27ae60"},
    {"id": 4, "title": "Банк ДовериеБанк", "brand": "ДовериеБанк", "duration": 15, "reward": 40.00, "video_url": "https://www.w3schools.com/html/mov_bbb.mp4", "color": "#2980b9"},
]


def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])


def get_user_by_token(cur, token):
    cur.execute(
        "SELECT u.id FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=%s",
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

    method = event.get("httpMethod", "GET")

    if method == "GET":
        return {"statusCode": 200, "headers": headers, "body": json.dumps({"ads": ADS})}

    if method == "POST":
        token = event.get("headers", {}).get("X-Auth-Token", "")
        if not token:
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Нет токена"})}

        body = json.loads(event.get("body") or "{}")
        ad_id = body.get("ad_id")
        ad = next((a for a in ADS if a["id"] == ad_id), None)
        if not ad:
            return {"statusCode": 400, "headers": headers, "body": json.dumps({"error": "Реклама не найдена"})}

        conn = get_conn()
        cur = conn.cursor()
        try:
            user = get_user_by_token(cur, token)
            if not user:
                return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Нет сессии"})}

            user_id = user[0]
            user_earn = round(ad["reward"] * 0.5, 2)
            owner_earn = round(ad["reward"] * 0.5, 2)

            cur.execute(
                "INSERT INTO ad_views (user_id, earned, owner_earned, ad_title) VALUES (%s, %s, %s, %s)",
                (user_id, user_earn, owner_earn, ad["title"])
            )
            cur.execute(
                "UPDATE users SET balance = balance + %s, total_earned = total_earned + %s WHERE id = %s",
                (user_earn, user_earn, user_id)
            )
            cur.execute("SELECT balance FROM users WHERE id=%s", (user_id,))
            new_balance = float(cur.fetchone()[0])
            conn.commit()

            return {
                "statusCode": 200,
                "headers": headers,
                "body": json.dumps({"earned": user_earn, "new_balance": new_balance}),
            }
        finally:
            cur.close()
            conn.close()

    return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}
