import requests
import json
from datetime import datetime

# URL вашого веб-додатку Google Apps Script
url = 'https://script.google.com/macros/s/AKfycbxbMb71_G1R3xjrqcRtJMHkC_UTa0I6lEDvjJxolaVIwLIfnTL43p5NFLvtweLBCrNkbQ/exec'

# Тестові дані, що імітують дані з форми
test_data = {
    "timestamp": datetime.now().isoformat(),
    "oblast": "Тестова Область",
    "city": "Тестове Місто",
    "apteka": "Тестова Аптека (вул. Тестова, 1)",
    "edrpou": "12345678",
    "network_name": "Тестова Мережа",
    "ownership": "Приватна",
    "apteka_type": "Аптека",
    "phone": "+380991234567",
    "staff_total": "5",
    "staff_esoz": "3",
    "esoz_compatible": "Так",
    "is_name": "Тест ІС"
}

# Заголовки - вказуємо, що надсилаємо JSON
headers = {
    'Content-Type': 'application/json'
}

# Відправляємо POST-запит
try:
    print(f"Надсилання POST-запиту на: {url}")
    print(f"З даними: {json.dumps(test_data, indent=2)}")

    response = requests.post(url, headers=headers, data=json.dumps(test_data))

    # Перевіряємо відповідь
    print(f"Статус-код відповіді: {response.status_code}")

    # Намагаємося розпарсити відповідь як JSON (Apps Script має повертати JSON)
    try:
        response_json = response.json()
        print("Відповідь від сервера (JSON):")
        print(json.dumps(response_json, indent=2, ensure_ascii=False))
    except json.JSONDecodeError:
        print("Відповідь від сервера (не JSON):")
        print(response.text)

    if response.status_code == 200:
         # Важливо: Успішний статус-код 200 НЕ гарантує, що Apps Script
         # виконав усі внутрішні операції (наприклад, запис у таблицю) без помилок.
         # Перевірте логи виконання Apps Script!
         print("\n*** Запит успішно надіслано (код 200), але перевірте виконання та логи на стороні Google Apps Script! ***")
    else:
        print(f"\n*** Сталася помилка під час надсилання запиту (код {response.status_code}) ***")


except requests.exceptions.RequestException as e:
    print(f"\n*** Виникла помилка під час виконання запиту: {e} ***") 