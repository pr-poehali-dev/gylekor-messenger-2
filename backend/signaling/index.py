import os
import json
import psycopg2
import time

SCHEMA = os.environ.get('MAIN_DB_SCHEMA', 't_p54536790_gylekor_messenger_2')

def get_conn():
    return psycopg2.connect(os.environ['DATABASE_URL'])

def ok(data):
    return {'statusCode': 200, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps(data, ensure_ascii=False, default=str)}

def err(msg, code=400):
    return {'statusCode': code, 'headers': {'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json'}, 'body': json.dumps({'error': msg})}

def handler(event: dict, context) -> dict:
    """WebRTC сигналинг для звонков в Гылекор: отправка/получение offer/answer/ICE"""
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': {
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
            'Access-Control-Allow-Headers': 'Content-Type',
        }, 'body': ''}

    method = event.get('httpMethod', 'GET')
    params = event.get('queryStringParameters') or {}
    body = json.loads(event.get('body') or '{}')

    conn = get_conn()
    cur = conn.cursor()

    try:
        # Отправить сигнал (offer/answer/ice-candidate/bye)
        if method == 'POST':
            room_id = body.get('room_id', '')
            signal_type = body.get('type', '')
            payload = body.get('payload', '')
            from_user = body.get('from_user_id')
            to_user = body.get('to_user_id')

            if not room_id or not signal_type:
                return err('Нужен room_id и type')

            cur.execute(f"""
                INSERT INTO {SCHEMA}.webrtc_signals (room_id, from_user_id, to_user_id, type, payload)
                VALUES (%s, %s, %s, %s, %s)
            """, (room_id, from_user, to_user, signal_type, json.dumps(payload)))
            conn.commit()
            return ok({'sent': True})

        # Получить новые сигналы для комнаты (polling)
        if method == 'GET':
            room_id = params.get('room_id', '')
            since_id = int(params.get('since_id', 0))
            to_user = params.get('to_user_id')

            if not room_id:
                return err('Нужен room_id')

            query = f"""
                SELECT id, from_user_id, to_user_id, type, payload, created_at
                FROM {SCHEMA}.webrtc_signals
                WHERE room_id = %s AND id > %s
            """
            args = [room_id, since_id]

            if to_user:
                query += " AND (to_user_id = %s OR to_user_id IS NULL)"
                args.append(int(to_user))

            query += " ORDER BY id ASC LIMIT 50"

            cur.execute(query, args)
            rows = cur.fetchall()
            signals = [{
                'id': r[0],
                'from_user_id': r[1],
                'to_user_id': r[2],
                'type': r[3],
                'payload': json.loads(r[4]) if r[4] else None,
                'created_at': str(r[5])
            } for r in rows]

            return ok({'signals': signals})

        return err('Метод не поддерживается')

    finally:
        cur.close()
        conn.close()
