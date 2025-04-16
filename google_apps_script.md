 
const SHEET_NAME = "Відповіді"; // <-- ЗАМІНІТЬ НА НАЗВУ ВАШОГО АРКУША

function doPost(e) {
  // --- Покращене логування та перевірка --- 
  if (!e) {
    Logger.log("Функцію doPost викликано без об'єкта події 'e'. Можливо, ручний запуск?");
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Event object missing.' })).setMimeType(ContentService.MimeType.JSON);
  }
  Logger.log("Отримано doPost запит. Параметри: " + JSON.stringify(e.parameter) + " Довжина postData: " + (e.postData ? e.postData.length : 'undefined'));
  
  if (!e.postData || !e.postData.contents) {
    Logger.log("Об'єкт події 'e' не містить 'postData' або 'postData.contents'. Запит не містить тіла?");
    Logger.log("Повний об'єкт 'e': " + JSON.stringify(e));
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Request body (postData) missing.' })).setMimeType(ContentService.MimeType.JSON);
  }
  // --- Кінець перевірки ---

  try {
    const ss = SpreadsheetApp.getActiveSpreadsheet();
    let sheet = ss.getSheetByName(SHEET_NAME);

    // Якщо аркуша немає, створюємо його і додаємо заголовки
    if (!sheet) {
      sheet = ss.insertSheet(SHEET_NAME);
      const headers = [
        "Timestamp", "1. Область", "2. Населений пункт", "3. Адреса та назва аптечного закладу",
        "4. Код ЄДРПОУ", "5. Назва аптечної мережі або назва аптеки", "6. Форма власності",
        "7. Тип аптечного закладу", "8. Контактний номер телефону",
        "9. Кількість фарм працівників (всього)", "10. Кількість фарм працівників (ЕСОЗ)",
        "11. Сумісність з ЕСОЗ", "12. Назва ІС"
      ];
       sheet.appendRow(headers);
       // Встановлюємо форматування для першого рядка (заголовків) - опціонально
       sheet.getRange(1, 1, 1, headers.length).setFontWeight("bold");
    }


    // Отримуємо дані з POST-запиту (JSON)
    const requestBody = e.postData.contents;
    Logger.log("Тіло запиту (e.postData.contents): " + requestBody);
    const data = JSON.parse(requestBody);

    // Визначаємо порядок стовпців (відповідає заголовкам вище)
    const rowData = [
      data.timestamp || new Date(), // Мітка часу
      data.oblast || '',            // 1. Область
      data.city || '',              // 2. Населений пункт
      data.apteka || '',            // 3. Адреса та назва
      data.edrpou || '',            // 4. Код ЄДРПОУ
      data.network_name || '',      // 5. Назва мережі/аптеки
      data.ownership || '',         // 6. Форма власності
      data.apteka_type || '',       // 7. Тип закладу
      data.phone || '',             // 8. Телефон
      data.staff_total || '',       // 9. Кількість працівників (всього)
      data.staff_esoz || '',        // 10. Кількість працівників (ЕСОЗ)
      data.esoz_compatible || '',   // 11. Сумісність з ЕСОЗ
      data.is_name || ''            // 12. Назва ІС
    ];

    // Додаємо новий рядок у таблицю
    sheet.appendRow(rowData);

    // Повертаємо успішну відповідь (для логування або майбутнього використання)
    return ContentService.createTextOutput(JSON.stringify({ status: 'success', message: 'Data saved successfully' }))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (error) {
    // Логуємо помилку РАЗОМ з отриманим тілом запиту для діагностики
    Logger.log('Помилка doPost: ' + error + ' Stack: ' + error.stack + ' \nОтримане тіло запиту: ' + (e.postData ? e.postData.contents : 'N/A'));
    // Повертаємо відповідь про помилку
    return ContentService.createTextOutput(JSON.stringify({ status: 'error', message: 'Failed to process data', error: error.toString() }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Додаткова функція doGet для тестування (можна відкрити URL веб-додатку в браузері)
function doGet(e) {
   return HtmlService.createHtmlOutput("Веб-додаток для обробки форми аптек працює. Використовуйте POST-запити для надсилання даних.");
}

 