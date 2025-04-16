document.addEventListener('DOMContentLoaded', () => {
    const oblastSelect = document.getElementById('oblast');
    const citySelect = document.getElementById('city');
    const aptekaSelect = document.getElementById('apteka');
    const additionalFields = document.getElementById('additional-fields');
    const edrpouInput = document.getElementById('edrpou');
    const form = document.getElementById('apteka-form');
    const messageContainer = document.getElementById('message-container');
    const submitButton = document.getElementById('submit-btn');
    const esozRadioYes = document.getElementById('esoz_yes');
    const esozRadioNo = document.getElementById('esoz_no');
    const isNameGroup = document.getElementById('is_name_group');
    const isNameInput = document.getElementById('is_name');

    // !!! ЗАМІНІТЬ ЦЕ НА ВАШУ РЕАЛЬНУ URL-АДРЕСУ GOOGLE APPS SCRIPT !!!
    const googleAppScriptUrl = 'https://script.google.com/macros/s/AKfycbzSAornnkv2z-ngGnl1cPPrDoFoOIH08A7i4js_GXwndcmEftr-omr7hMMaMr-3YVUe/exec';

    let pharmacyData = {}; // Структура: { oblast: { city: { apteka: edrpou } } }

    // Функція для очищення та деактивації селекта
    const resetSelect = (selectElement, defaultOptionText) => {
        selectElement.innerHTML = `<option value="" disabled selected>${defaultOptionText}</option>`;
        selectElement.disabled = true;
    };

    // Функція для заповнення селекта опціями
    const populateSelect = (selectElement, options) => {
        // Сортуємо опції за алфавітом
        options.sort((a, b) => a.localeCompare(b, 'uk'));
        options.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            selectElement.appendChild(option);
        });
        selectElement.disabled = false;
    };

    // --- Завантаження та парсинг CSV ---
    fetch('list.csv')
        .then(response => {
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.text();
        })
        .then(csvText => {
            pharmacyData = parseCSV(csvText);
            // Заповнюємо перший селект (Області)
            const oblasti = Object.keys(pharmacyData);
            populateSelect(oblastSelect, oblasti);
        })
        .catch(error => {
            console.error('Помилка завантаження або парсингу CSV:', error);
            displayMessage('Помилка завантаження довідника аптек. Спробуйте оновити сторінку.', 'error');
            // Блокуємо форму, якщо дані не завантажились
            oblastSelect.disabled = true;
            citySelect.disabled = true;
            aptekaSelect.disabled = true;
            submitButton.disabled = true;
        });

    // Функція парсингу CSV
    const parseCSV = (csvText) => {
        const data = {};
        const lines = csvText.trim().split('\n');
        // Пропускаємо заголовок (перший рядок)
        for (let i = 1; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue; // Пропускаємо порожні рядки

            // Розділяємо рядок, враховуючи можливі лапки
            const columns = line.split(';').map(col => col.trim().replace(/^"|"$/g, ''));

            if (columns.length === 4) {
                const [oblast, city, apteka, edrpou] = columns;
                if (!oblast || !city || !apteka) continue; // Пропускаємо, якщо основні поля порожні

                if (!data[oblast]) {
                    data[oblast] = {};
                }
                if (!data[oblast][city]) {
                    data[oblast][city] = {};
                }
                // Зберігаємо ЄДРПОУ разом з назвою аптеки
                data[oblast][city][apteka] = edrpou || ''; // Зберігаємо порожній рядок, якщо ЄДРПОУ немає
            } else {
                console.warn(`Неправильний формат рядка ${i + 1} у CSV: ${line}`);
            }
        }
        return data;
    };

    // --- Обробники подій для каскадних списків ---
    oblastSelect.addEventListener('change', () => {
        resetSelect(citySelect, '-- Спочатку оберіть область --');
        resetSelect(aptekaSelect, '-- Спочатку оберіть населений пункт --');
        additionalFields.style.display = 'none'; // Ховаємо дод. поля
        edrpouInput.value = ''; // Очищаємо ЄДРПОУ
        aptekaSelect.value = ''; // Скидаємо вибір аптеки
        citySelect.value = '';   // Скидаємо вибір міста

        const selectedOblast = oblastSelect.value;
        if (selectedOblast && pharmacyData[selectedOblast]) {
            const cities = Object.keys(pharmacyData[selectedOblast]);
            populateSelect(citySelect, cities);
            resetSelect(aptekaSelect, '-- Оберіть населений пункт --');
        } else {
            resetSelect(citySelect, '-- Спочатку оберіть область --');
        }
    });

    citySelect.addEventListener('change', () => {
        resetSelect(aptekaSelect, '-- Спочатку оберіть населений пункт --');
        additionalFields.style.display = 'none'; // Ховаємо дод. поля
        edrpouInput.value = ''; // Очищаємо ЄДРПОУ
        aptekaSelect.value = ''; // Скидаємо вибір аптеки

        const selectedOblast = oblastSelect.value;
        const selectedCity = citySelect.value;
        if (selectedOblast && selectedCity && pharmacyData[selectedOblast]?.[selectedCity]) {
            const apteki = Object.keys(pharmacyData[selectedOblast][selectedCity]);
            populateSelect(aptekaSelect, apteki);
        } else {
             resetSelect(aptekaSelect, '-- Спочатку оберіть населений пункт --');
        }
    });

    aptekaSelect.addEventListener('change', () => {
        const selectedOblast = oblastSelect.value;
        const selectedCity = citySelect.value;
        const selectedApteka = aptekaSelect.value;

        if (selectedOblast && selectedCity && selectedApteka) {
            additionalFields.style.display = 'block'; // Показуємо дод. поля
            const edrpou = pharmacyData[selectedOblast]?.[selectedCity]?.[selectedApteka] || '';
            edrpouInput.value = edrpou;
            // Можна зробити поле ЄДРПОУ тільки для читання, якщо потрібно
            // edrpouInput.readOnly = true;
        } else {
            additionalFields.style.display = 'none';
            edrpouInput.value = '';
            // edrpouInput.readOnly = false;
        }
    });

    // --- Обробник для поля "Чи використовує ІС" ---
    form.addEventListener('change', (event) => {
        if (event.target.name === 'esoz_compatible') {
            if (esozRadioYes.checked) {
                isNameGroup.style.display = 'block';
                isNameInput.required = true; // Робимо поле обов'язковим, якщо вибрано "Так"
            } else {
                isNameGroup.style.display = 'none';
                isNameInput.required = false; // Робимо поле необов'язковим
                isNameInput.value = ''; // Очищаємо значення, якщо вибрано "Ні"
            }
        }
    });

    // --- Обробка відправки форми ---
    form.addEventListener('submit', (event) => {
        event.preventDefault(); // Запобігаємо стандартній відправці форми
        submitButton.disabled = true; // Блокуємо кнопку під час відправки
        displayMessage('Надсилання даних...', 'info'); // Інформаційне повідомлення

        const formData = new FormData(form);
        const dataToSend = {};
        formData.forEach((value, key) => {
            dataToSend[key] = value;
        });

        // Додаємо мітку часу
        dataToSend['timestamp'] = new Date().toISOString();

        // Перевіряємо, чи заповнене поле IS Name, якщо вибрано "Так"
        if (esozRadioYes.checked && !isNameInput.value.trim()) {
             displayMessage('Будь ласка, вкажіть назву ІС.', 'error');
             isNameInput.focus(); // Фокус на полі
             submitButton.disabled = false; // Розблоковуємо кнопку
             return; // Зупиняємо відправку
         }

        // Відправляємо дані на Google Apps Script
        fetch(googleAppScriptUrl, {
            method: 'POST',
            mode: 'no-cors', // Важливо для GAS Web App, якщо не налаштовано CORS
            cache: 'no-cache',
            headers: {
                // 'Content-Type': 'application/json' // Не потрібно для FormData
            },
             body: JSON.stringify(dataToSend) // Надсилаємо як JSON
             // Примітка: GAS легше обробляє JSON через e.postData.contents
        })
        .then(response => {
             // З 'no-cors' ми не можемо отримати деталі відповіді, тому
             // просто вважаємо, що відправка успішна, якщо не було мережевої помилки.
             // Реальна перевірка успіху має бути на стороні GAS.
             displayMessage('Дякуємо, дані збережено!', 'success');
             form.reset(); // Очищаємо форму
             // Скидаємо стан до початкового
             resetSelect(citySelect, '-- Спочатку оберіть область --');
             resetSelect(aptekaSelect, '-- Спочатку оберіть населений пункт --');
             additionalFields.style.display = 'none';
             isNameGroup.style.display = 'none';
             isNameInput.required = false;
        })
        .catch(error => {
            console.error('Помилка відправки даних:', error);
            displayMessage('Сталася помилка під час надсилання даних. Спробуйте ще раз.', 'error');
        })
        .finally(() => {
            submitButton.disabled = false; // Розблоковуємо кнопку в будь-якому випадку
        });
    });

    // Функція для відображення повідомлень
    const displayMessage = (message, type) => {
        messageContainer.textContent = message;
        messageContainer.className = `message ${type}`; // type: 'success', 'error', 'info'
        messageContainer.style.display = 'block';

        // Автоматично ховаємо повідомлення через 5 секунд (опціонально)
        /*
        if (type === 'success' || type === 'error') {
            setTimeout(() => {
                messageContainer.style.display = 'none';
            }, 5000);
        }
        */
    };
}); 