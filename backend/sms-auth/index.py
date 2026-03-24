import os
import json
import random
import time
import hashlib
import urllib.request
import urllib.parse

# Хранилище кодов в памяти (phone -> {code, expires})
# В проде лучше использовать Redis/DB, но для MVP — достаточно
_codes: dict = {}

def _send_sms(phone: str, code: str) -> dict:
    """Отправляет SMS через SMS.ru API"""
    api_id = os.environ.get('SMSRU_API_ID', '')
    clean_phone = ''.join(c for c in phone if c.isdigit())
    if clean_phone.startswith('8'):
        clean_phone = '7' + clean_phone[1:]
    
    params = urllib.parse.urlencode({
        'api_id': api_id,
        'to': clean_phone,
        'msg': f'Ваш код Гылекор: {code}',
        'json': 1
    })
    url = f'https://sms.ru/sms/send?{params}'
    
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req, timeout=10) as resp:
        return json.loads(resp.read().decode())


def handler(event: dict, context) -> dict:
    """Обработчик SMS-верификации для мессенджера Гылекор"""
    headers = {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Content-Type': 'application/json'
    }
    
    if event.get('httpMethod') == 'OPTIONS':
        return {'statusCode': 200, 'headers': headers, 'body': ''}
    
    body = json.loads(event.get('body') or '{}')
    action = body.get('action')
    
    # Отправка кода
    if action == 'send':
        phone = body.get('phone', '').strip()
        if not phone:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Укажите номер телефона'})}
        
        code = str(random.randint(10000, 99999))
        expires = time.time() + 300  # 5 минут
        phone_key = ''.join(c for c in phone if c.isdigit())
        _codes[phone_key] = {'code': code, 'expires': expires, 'attempts': 0}
        
        result = _send_sms(phone, code)
        
        sms_ok = result.get('status') == 'OK'
        if not sms_ok:
            return {
                'statusCode': 500,
                'headers': headers,
                'body': json.dumps({'error': 'Не удалось отправить SMS', 'detail': result})
            }
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True, 'message': f'SMS отправлено на {phone}'})
        }
    
    # Проверка кода
    if action == 'verify':
        phone = body.get('phone', '').strip()
        code = body.get('code', '').strip()
        phone_key = ''.join(c for c in phone if c.isdigit())
        
        entry = _codes.get(phone_key)
        if not entry:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Сначала запросите код'})}
        
        if time.time() > entry['expires']:
            del _codes[phone_key]
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Код устарел, запросите новый'})}
        
        entry['attempts'] += 1
        if entry['attempts'] > 5:
            del _codes[phone_key]
            return {'statusCode': 429, 'headers': headers, 'body': json.dumps({'error': 'Слишком много попыток, запросите новый код'})}
        
        if entry['code'] != code:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неверный код'})}
        
        del _codes[phone_key]
        # Генерируем простой токен сессии
        session = hashlib.sha256(f'{phone_key}{time.time()}{random.random()}'.encode()).hexdigest()
        
        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True, 'session': session, 'phone': phone})
        }
    
    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестное действие'})}
