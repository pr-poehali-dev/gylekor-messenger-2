import os
import json
import hashlib
import psycopg2

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p54536790_gylekor_messenger_2')

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}

def handler(event: dict, context) -> dict:
    """API управления пользователями Гылекор: регистрация, поиск, контакты, онлайн-статус"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type, X-Session-Token',
        }, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = json.loads(event.get('body') or '{}')
    action = params.get('action') or body.get('action', '')
    headers = event.get('headers') or {}
    session_token = headers.get('X-Session-Token') or params.get('token', '')

    conn = get_conn()
    cur = conn.cursor()

    def get_user_by_token(token):
        cur.execute(f"SELECT id, name, username, phone, email, avatar FROM {SCHEMA}.users WHERE session_token = %s", (token,))
        row = cur.fetchone()
        if not row:
            return None
        return {'id': row[0], 'name': row[1], 'username': row[2], 'phone': row[3], 'email': row[4], 'avatar': row[5]}

    try:
        # Регистрация/обновление профиля
        if action == 'register':
            name = body.get('name', '').strip()
            username = body.get('username', '').strip().lower()
            phone = body.get('phone', '').strip()
            email = body.get('email', '').strip().lower()
            avatar = body.get('avatar', '🦊')
            session = body.get('session', '')

            if not all([name, username, phone]):
                return err('Не все поля заполнены')

            token = hashlib.sha256(f'{phone}{email}{session}'.encode()).hexdigest()[:32]

            cur.execute(f"""
                INSERT INTO {SCHEMA}.users (phone, email, name, username, avatar, session_token, online)
                VALUES (%s, %s, %s, %s, %s, %s, true)
                ON CONFLICT (phone) DO UPDATE SET
                    name = EXCLUDED.name,
                    username = EXCLUDED.username,
                    avatar = EXCLUDED.avatar,
                    email = EXCLUDED.email,
                    session_token = EXCLUDED.session_token,
                    online = true,
                    last_seen = NOW()
                RETURNING id, name, username, phone, email, avatar
            """, (phone, email or None, name, username, avatar, token))
            row = cur.fetchone()
            conn.commit()
            return ok({'id': row[0], 'name': row[1], 'username': row[2], 'phone': row[3], 'email': row[4], 'avatar': row[5], 'token': token})

        # Поиск пользователей по @username или телефону
        if action == 'search':
            q = params.get('q', '').strip()
            if len(q) < 2:
                return err('Введите минимум 2 символа')
            me = get_user_by_token(session_token)
            me_id = me['id'] if me else -1
            cur.execute(f"""
                SELECT id, name, username, phone, avatar, online, last_seen
                FROM {SCHEMA}.users
                WHERE (username ILIKE %s OR phone LIKE %s) AND id != %s
                LIMIT 20
            """, (f'%{q.lstrip("@")}%', f'%{q}%', me_id))
            rows = cur.fetchall()
            users = [{'id': r[0], 'name': r[1], 'username': r[2], 'phone': r[3], 'avatar': r[4], 'online': r[5], 'lastSeen': str(r[6])} for r in rows]
            return ok({'users': users})

        # Мои контакты
        if action == 'contacts':
            me = get_user_by_token(session_token)
            if not me:
                return err('Не авторизован', 401)
            cur.execute(f"""
                SELECT u.id, u.name, u.username, u.phone, u.avatar, u.online, u.last_seen
                FROM {SCHEMA}.contacts c
                JOIN {SCHEMA}.users u ON u.id = c.contact_id
                WHERE c.owner_id = %s
                ORDER BY u.online DESC, u.name
            """, (me['id'],))
            rows = cur.fetchall()
            users = [{'id': r[0], 'name': r[1], 'username': r[2], 'phone': r[3], 'avatar': r[4], 'online': r[5], 'lastSeen': str(r[6])} for r in rows]
            return ok({'contacts': users})

        # Добавить контакт
        if action == 'add_contact':
            me = get_user_by_token(session_token)
            if not me:
                return err('Не авторизован', 401)
            contact_id = body.get('contact_id')
            if not contact_id:
                return err('Не указан contact_id')
            cur.execute(f"""
                INSERT INTO {SCHEMA}.contacts (owner_id, contact_id)
                VALUES (%s, %s) ON CONFLICT DO NOTHING
            """, (me['id'], contact_id))
            conn.commit()
            return ok({'success': True})

        # Удалить контакт
        if action == 'remove_contact':
            me = get_user_by_token(session_token)
            if not me:
                return err('Не авторизован', 401)
            contact_id = body.get('contact_id')
            cur.execute(f"UPDATE {SCHEMA}.contacts SET owner_id = owner_id WHERE owner_id = %s AND contact_id = %s", (me['id'], contact_id))
            conn.commit()
            return ok({'success': True})

        # Обновить онлайн-статус
        if action == 'ping':
            me = get_user_by_token(session_token)
            if not me:
                return err('Не авторизован', 401)
            cur.execute(f"UPDATE {SCHEMA}.users SET online = true, last_seen = NOW() WHERE id = %s", (me['id'],))
            conn.commit()
            return ok({'ok': True})

        # Офлайн
        if action == 'offline':
            me = get_user_by_token(session_token)
            if me:
                cur.execute(f"UPDATE {SCHEMA}.users SET online = false, last_seen = NOW() WHERE id = %s", (me['id'],))
                conn.commit()
            return ok({'ok': True})

        # Получить себя
        if action == 'me':
            me = get_user_by_token(session_token)
            if not me:
                return err('Не авторизован', 401)
            return ok(me)

        return err('Неизвестное действие')

    finally:
        cur.close()
        conn.close()
