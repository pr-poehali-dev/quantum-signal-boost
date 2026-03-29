"""
Фиксирует просмотр рекламы и начисляет 50% прибыли пользователю.
POST / — засчитать просмотр рекламы (требует X-Auth-Token)
GET / — получить список доступных реклам (рандомная ротация из большого пула)
"""
import json
import os
import random
import psycopg2

ALL_ADS = [
    {"id": 1, "title": "Samsung Galaxy S25 Ultra", "brand": "Samsung", "duration": 15, "reward": 32.00, "category": "tech", "color": "#1428A0", "description": "Новый флагман с AI-камерой"},
    {"id": 2, "title": "Яндекс Плюс подписка", "brand": "Яндекс", "duration": 15, "reward": 22.00, "category": "services", "color": "#FC3F1D", "description": "Музыка, кино и кэшбэк"},
    {"id": 3, "title": "Ozon Fresh доставка", "brand": "Ozon", "duration": 12, "reward": 18.00, "category": "delivery", "color": "#005BFF", "description": "Продукты за 15 минут"},
    {"id": 4, "title": "Тинькофф Инвестиции", "brand": "Тинькофф", "duration": 20, "reward": 45.00, "category": "finance", "color": "#FFDD2D", "description": "Начни инвестировать с 1 ₽"},
    {"id": 5, "title": "Wildberries скидки до 90%", "brand": "Wildberries", "duration": 15, "reward": 20.00, "category": "shopping", "color": "#CB11AB", "description": "Миллионы товаров по лучшим ценам"},
    {"id": 6, "title": "Сбер Мегамаркет", "brand": "Сбер", "duration": 15, "reward": 24.00, "category": "shopping", "color": "#21A038", "description": "Бонусы Спасибо за покупки"},
    {"id": 7, "title": "VK Видео — смотри бесплатно", "brand": "VK", "duration": 12, "reward": 16.00, "category": "entertainment", "color": "#0077FF", "description": "Фильмы и сериалы бесплатно"},
    {"id": 8, "title": "МТС Premium", "brand": "МТС", "duration": 15, "reward": 28.00, "category": "telecom", "color": "#E30611", "description": "Связь, кино и музыка в одном"},
    {"id": 9, "title": "Газпромбанк кредит 5.9%", "brand": "Газпромбанк", "duration": 20, "reward": 50.00, "category": "finance", "color": "#0033A0", "description": "Лучшие условия кредитования"},
    {"id": 10, "title": "Авито — продай ненужное", "brand": "Авито", "duration": 12, "reward": 15.00, "category": "marketplace", "color": "#00AAFF", "description": "Миллионы объявлений рядом"},
    {"id": 11, "title": "Coca-Cola освежающий вкус", "brand": "Coca-Cola", "duration": 15, "reward": 20.00, "category": "fmcg", "color": "#F40009", "description": "Попробуй вкус лета"},
    {"id": 12, "title": "Nike Air Max 2025", "brand": "Nike", "duration": 15, "reward": 26.00, "category": "sport", "color": "#111111", "description": "Just Do It — новая коллекция"},
    {"id": 13, "title": "Skillbox онлайн-курсы", "brand": "Skillbox", "duration": 20, "reward": 35.00, "category": "education", "color": "#6B4FBB", "description": "Освой новую профессию за 6 месяцев"},
    {"id": 14, "title": "Delivery Club -30% на первый", "brand": "Delivery Club", "duration": 12, "reward": 17.00, "category": "delivery", "color": "#32B44A", "description": "Еда из любимых ресторанов"},
    {"id": 15, "title": "AliExpress распродажа", "brand": "AliExpress", "duration": 15, "reward": 19.00, "category": "shopping", "color": "#FF4747", "description": "Товары со всего мира"},
    {"id": 16, "title": "Альфа-Банк кэшбэк 10%", "brand": "Альфа-Банк", "duration": 18, "reward": 42.00, "category": "finance", "color": "#EF3124", "description": "Карта с максимальным кэшбэком"},
    {"id": 17, "title": "Яндекс Маркет быстро", "brand": "Яндекс Маркет", "duration": 15, "reward": 21.00, "category": "shopping", "color": "#FFCC00", "description": "Доставка за 1-2 часа"},
    {"id": 18, "title": "Burger King Воппер", "brand": "Burger King", "duration": 12, "reward": 14.00, "category": "food", "color": "#D62300", "description": "Два Воппера по цене одного"},
    {"id": 19, "title": "Мегафон тариф без границ", "brand": "Мегафон", "duration": 15, "reward": 25.00, "category": "telecom", "color": "#00B956", "description": "Безлимит на всё"},
    {"id": 20, "title": "Ростелеком домашний интернет", "brand": "Ростелеком", "duration": 18, "reward": 30.00, "category": "telecom", "color": "#7B2D8E", "description": "Скорость до 1 Гбит/с"},
    {"id": 21, "title": "Lamoda новая коллекция", "brand": "Lamoda", "duration": 15, "reward": 22.00, "category": "fashion", "color": "#000000", "description": "Бренды со скидкой до 70%"},
    {"id": 22, "title": "Лента — всё для дома", "brand": "Лента", "duration": 12, "reward": 16.00, "category": "grocery", "color": "#003DA5", "description": "Низкие цены каждый день"},
    {"id": 23, "title": "Билайн гиги за шаги", "brand": "Билайн", "duration": 15, "reward": 23.00, "category": "telecom", "color": "#FFB800", "description": "Ходи и получай гигабайты"},
    {"id": 24, "title": "ВкусВилл натуральное", "brand": "ВкусВилл", "duration": 12, "reward": 15.00, "category": "grocery", "color": "#78BE20", "description": "Продукты без лишнего"},
    {"id": 25, "title": "Kaspersky защита устройств", "brand": "Kaspersky", "duration": 18, "reward": 33.00, "category": "tech", "color": "#006D5C", "description": "Полная защита от вирусов"},
    {"id": 26, "title": "Литрес аудиокниги", "brand": "Литрес", "duration": 12, "reward": 14.00, "category": "entertainment", "color": "#FF6600", "description": "Слушай книги в дороге"},
    {"id": 27, "title": "Пятёрочка выгодно", "brand": "Пятёрочка", "duration": 10, "reward": 12.00, "category": "grocery", "color": "#E21A1A", "description": "Скидки до 50% каждый день"},
    {"id": 28, "title": "GeekBrains обучение IT", "brand": "GeekBrains", "duration": 20, "reward": 38.00, "category": "education", "color": "#6A0DAD", "description": "Стань разработчиком за 9 месяцев"},
    {"id": 29, "title": "Adidas Originals", "brand": "Adidas", "duration": 15, "reward": 24.00, "category": "sport", "color": "#000000", "description": "Impossible Is Nothing"},
    {"id": 30, "title": "Магнит у дома", "brand": "Магнит", "duration": 10, "reward": 13.00, "category": "grocery", "color": "#D0021B", "description": "Свежие продукты каждый день"},
    {"id": 31, "title": "Ситимобил выгодные поездки", "brand": "Ситимобил", "duration": 12, "reward": 17.00, "category": "transport", "color": "#7B2BFC", "description": "Такси дешевле на 20%"},
    {"id": 32, "title": "ДНС техника для жизни", "brand": "DNS", "duration": 15, "reward": 20.00, "category": "tech", "color": "#FC4C02", "description": "Гаджеты по лучшим ценам"},
    {"id": 33, "title": "Самокат доставка 15 мин", "brand": "Самокат", "duration": 12, "reward": 16.00, "category": "delivery", "color": "#FF2E00", "description": "Продукты прямо к двери"},
    {"id": 34, "title": "РЖД Бонус путешествуй", "brand": "РЖД", "duration": 18, "reward": 30.00, "category": "transport", "color": "#E21A1A", "description": "Копи баллы — путешествуй бесплатно"},
    {"id": 35, "title": "Додо Пицца свежая", "brand": "Додо Пицца", "duration": 12, "reward": 15.00, "category": "food", "color": "#FF6900", "description": "Горячая пицца за 30 минут"},
    {"id": 36, "title": "Ренессанс Страхование", "brand": "Ренессанс", "duration": 18, "reward": 40.00, "category": "finance", "color": "#6C2D82", "description": "ОСАГО онлайн за 5 минут"},
    {"id": 37, "title": "М.Видео распродажа", "brand": "М.Видео", "duration": 15, "reward": 22.00, "category": "tech", "color": "#F8002B", "description": "Техника с выгодой до 50%"},
    {"id": 38, "title": "Яндекс Еда промокод", "brand": "Яндекс Еда", "duration": 12, "reward": 18.00, "category": "delivery", "color": "#FCE000", "description": "Бесплатная доставка на первый заказ"},
    {"id": 39, "title": "Почта Банк вклад 18%", "brand": "Почта Банк", "duration": 20, "reward": 44.00, "category": "finance", "color": "#0054A6", "description": "Выгодный вклад без визита в офис"},
    {"id": 40, "title": "KFC Баскет за 299₽", "brand": "KFC", "duration": 12, "reward": 14.00, "category": "food", "color": "#E4002B", "description": "Сочная курочка по суперцене"},
    {"id": 41, "title": "Huawei MatePad Pro", "brand": "Huawei", "duration": 15, "reward": 28.00, "category": "tech", "color": "#CF0A2C", "description": "Планшет нового поколения"},
    {"id": 42, "title": "ЦИАН — найди квартиру", "brand": "ЦИАН", "duration": 18, "reward": 35.00, "category": "realestate", "color": "#0468FF", "description": "Аренда и покупка недвижимости"},
    {"id": 43, "title": "Спортмастер кроссовки", "brand": "Спортмастер", "duration": 15, "reward": 20.00, "category": "sport", "color": "#ED1C24", "description": "Всё для спорта и отдыха"},
    {"id": 44, "title": "Тele2 честные тарифы", "brand": "Tele2", "duration": 15, "reward": 22.00, "category": "telecom", "color": "#1F2229", "description": "Связь без переплат"},
    {"id": 45, "title": "СберМаркет продукты", "brand": "СберМаркет", "duration": 12, "reward": 16.00, "category": "delivery", "color": "#21A038", "description": "Доставка из магазинов за час"},
    {"id": 46, "title": "Xiaomi Redmi Note 14", "brand": "Xiaomi", "duration": 15, "reward": 25.00, "category": "tech", "color": "#FF6700", "description": "Флагман за разумные деньги"},
    {"id": 47, "title": "HeadHunter ищи работу", "brand": "HeadHunter", "duration": 18, "reward": 30.00, "category": "jobs", "color": "#D6001C", "description": "Лучшие вакансии рядом"},
    {"id": 48, "title": "fix price всё по 99₽", "brand": "Fix Price", "duration": 10, "reward": 11.00, "category": "shopping", "color": "#FFD700", "description": "Товары по фиксированной цене"},
    {"id": 49, "title": "ПИК квартиры в Москве", "brand": "ПИК", "duration": 20, "reward": 48.00, "category": "realestate", "color": "#FF6B00", "description": "Новостройки с ипотекой от 5%"},
    {"id": 50, "title": "Озон Банк кэшбэк 5%", "brand": "Озон Банк", "duration": 18, "reward": 36.00, "category": "finance", "color": "#005BFF", "description": "Карта с кэшбэком на всё"},
]

CATEGORY_ICONS = {
    "tech": "📱", "services": "⭐", "delivery": "🚀", "finance": "💳",
    "shopping": "🛍️", "entertainment": "🎬", "telecom": "📶", "marketplace": "🏪",
    "fmcg": "🥤", "sport": "⚡", "education": "📚", "food": "🍔",
    "fashion": "👗", "grocery": "🛒", "transport": "🚗", "realestate": "🏠",
    "jobs": "💼",
}

def get_conn():
    return psycopg2.connect(os.environ["DATABASE_URL"])

def get_user_by_token(cur, token):
    cur.execute(
        "SELECT u.id FROM users u JOIN sessions s ON s.user_id=u.id WHERE s.token=%s",
        (token,)
    )
    return cur.fetchone()

def handler(event: dict, context) -> dict:
    """Возвращает рекламу с ротацией и начисляет деньги за просмотр."""
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
        count = 6
        try:
            qs = event.get("queryStringParameters") or {}
            count = min(int(qs.get("count", 6)), 20)
        except (ValueError, TypeError):
            pass

        selected = random.sample(ALL_ADS, min(count, len(ALL_ADS)))
        for ad in selected:
            ad["icon"] = CATEGORY_ICONS.get(ad.get("category", ""), "📺")
            ad["user_reward"] = round(ad["reward"] * 0.5, 2)

        return {
            "statusCode": 200,
            "headers": headers,
            "body": json.dumps({"ads": selected, "total_available": len(ALL_ADS)}),
        }

    if method == "POST":
        token = event.get("headers", {}).get("X-Auth-Token", "")
        if not token:
            return {"statusCode": 401, "headers": headers, "body": json.dumps({"error": "Нет токена"})}

        body = json.loads(event.get("body") or "{}")
        ad_id = body.get("ad_id")
        ad = next((a for a in ALL_ADS if a["id"] == ad_id), None)
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
                "body": json.dumps({"earned": user_earn, "new_balance": new_balance, "ad_brand": ad["brand"]}),
            }
        finally:
            cur.close()
            conn.close()

    return {"statusCode": 404, "headers": headers, "body": json.dumps({"error": "Not found"})}
