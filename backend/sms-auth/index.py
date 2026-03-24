import os
import json
import random
import time
import hashlib
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

# Хранилище кодов в памяти (key -> {code, expires, attempts})
_codes: dict = {}

def _detect_smtp(email_addr: str) -> tuple:
    """Определяет SMTP-сервер по домену email"""
    domain = email_addr.split('@')[-1].lower()
    if 'yandex' in domain or 'ya.ru' in domain:
        return 'smtp.yandex.ru', 465
    elif 'gmail' in domain:
        return 'smtp.gmail.com', 465
    else:
        return 'smtp.mail.ru', 465


def _send_email(to_email: str, code: str) -> None:
    """Отправляет письмо с кодом верификации"""
    from_email = os.environ.get('SMTP_EMAIL', '')
    password = os.environ.get('SMTP_PASSWORD', '')
    host, port = _detect_smtp(from_email)

    msg = MIMEMultipart('alternative')
    msg['Subject'] = f'Код входа в Гылекор: {code}'
    msg['From'] = f'Gylecor <{from_email}>'
    msg['To'] = to_email

    text_body = f'Ваш код для входа в Гылекор: {code}\n\nКод действителен 5 минут. Никому не сообщайте его.'
    html_body = f'''
    <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; background: #f0fdf4; border-radius: 16px;">
      <div style="text-align: center; margin-bottom: 24px;">
        <h1 style="color: #1a1a1a; font-size: 22px; margin: 0;">Гылекор</h1>
        <p style="color: #6b7280; font-size: 13px; margin: 4px 0 0;">Мессенджер нового поколения</p>
      </div>
      <div style="background: white; border-radius: 12px; padding: 24px; text-align: center; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
        <p style="color: #374151; margin: 0 0 16px; font-size: 15px;">Ваш код для входа:</p>
        <div style="letter-spacing: 8px; font-size: 36px; font-weight: bold; color: #2db55d; margin: 0 0 16px;">{code}</div>
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">Код действителен 5 минут.<br>Никому не сообщайте его.</p>
      </div>
    </div>
    '''

    msg.attach(MIMEText(text_body, 'plain'))
    msg.attach(MIMEText(html_body, 'html'))

    with smtplib.SMTP_SSL(host, port) as server:
        server.login(from_email, password)
        server.sendmail(from_email, to_email, msg.as_string())


def handler(event: dict, context) -> dict:
    """Обработчик email-верификации для мессенджера Гылекор"""
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

    if action == 'send_email':
        email = body.get('email', '').strip().lower()
        if not email or '@' not in email:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Укажите корректный email'})}

        code = str(random.randint(10000, 99999))
        expires = time.time() + 300
        _codes[email] = {'code': code, 'expires': expires, 'attempts': 0}

        _send_email(email, code)

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True, 'message': f'Письмо отправлено на {email}'})
        }

    if action == 'verify':
        email = body.get('email', '').strip().lower()
        code = body.get('code', '').strip()

        entry = _codes.get(email)
        if not entry:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Сначала запросите код'})}

        if time.time() > entry['expires']:
            del _codes[email]
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Код устарел, запросите новый'})}

        entry['attempts'] += 1
        if entry['attempts'] > 5:
            del _codes[email]
            return {'statusCode': 429, 'headers': headers, 'body': json.dumps({'error': 'Слишком много попыток, запросите новый код'})}

        if entry['code'] != code:
            return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неверный код'})}

        del _codes[email]
        session = hashlib.sha256(f'{email}{time.time()}{random.random()}'.encode()).hexdigest()

        return {
            'statusCode': 200,
            'headers': headers,
            'body': json.dumps({'success': True, 'session': session, 'email': email})
        }

    return {'statusCode': 400, 'headers': headers, 'body': json.dumps({'error': 'Неизвестное действие'})}
