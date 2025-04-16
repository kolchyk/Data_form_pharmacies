document.addEventListener('DOMContentLoaded', () => {
    const oblastSelect = document.getElementById('oblast');
    const citySelect = document.getElementById('city');
    const aptekaSelect = document.getElementById('apteka');
    const additionalFields = document.getElementById('additional-fields');
    const edrpouInput = document.getElementById('edrpou');
    const networkNameInput = document.getElementById('network_name');
    const form = document.getElementById('apteka-form');
    const messageContainer = document.getElementById('message-container');
    const submitButton = document.getElementById('submit-btn');
    const esozRadioYes = document.getElementById('esoz_yes');
    const esozRadioNo = document.getElementById('esoz_no');
    const isNameGroup = document.getElementById('is_name_group');
    const isNameInput = document.getElementById('is_name');
    const phoneInput = document.getElementById('phone');

    // !!! ЗАМІНІТЬ ЦЕ НА ВАШУ РЕАЛЬНУ URL-АДРЕСУ GOOGLE APPS SCRIPT !!!
    const googleAppScriptUrl = 'https://script.google.com/macros/s/AKfycbxyUA0u7Zfo__Jh57P2QFZ0-hQm9KjyZ4NhPTdfAUMjbdHjqXLtn-dELJqalwX5NQ10/exec';

    let pharmacyData = {}; // Структура: { oblast: { city: { apteka: edrpou } } }
    const MANUAL_INPUT_VALUE = "--- Ввести вручну ---"; // Константа для опції ручного вводу

    // Повертаємо функції Select2
    // Функція для ініціалізації Select2
    const initializeAptekaSelect2 = () => {
        if (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 !== 'undefined') {
            $(aptekaSelect).select2({
                placeholder: "-- Спочатку оберіть населений пункт --",
                allowClear: true,
                language: "uk" // Припускаємо, що локалізація потрібна
            });
            updateAptekaSelect2Placeholder('-- Спочатку оберіть населений пункт --');
        } else {
            console.warn('jQuery або Select2 не завантажено для initializeAptekaSelect2.');
        }
    };

    // Функція для знищення інстансу Select2
    const destroyAptekaSelect2 = () => {
        if (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 !== 'undefined' && $(aptekaSelect).data('select2')) {
            $(aptekaSelect).select2('destroy');
        }
    };

    // Функція для оновлення плейсхолдера Select2
    const updateAptekaSelect2Placeholder = (text) => {
         if (typeof jQuery !== 'undefined' && typeof jQuery.fn.select2 !== 'undefined') {
            const firstOption = aptekaSelect.querySelector('option[value=""]');
            if (firstOption) {
                firstOption.textContent = text;
            }
            // Переініціалізація або оновлення може бути потрібним, якщо Select2 вже активний
             if ($(aptekaSelect).data('select2')) {
                 // Оновлення placeholder може потребувати переініціалізації або спеціального методу
                 // Найпростіше - оновити текст першої опції, який Select2 часто використовує
                 // Якщо це не працює стабільно, можна спробувати 'destroy' і re-initialize
                 $(aptekaSelect).trigger('change.select2'); // Спробуємо оновити відображення
             }
        } else {
             console.warn('jQuery або Select2 не завантажено для updateAptekaSelect2Placeholder.');
        }
    };

    // Функція для очищення та деактивації селекта (з логікою Select2)
    const resetSelect = (selectElement, defaultOptionText) => {
        if (selectElement.id === 'apteka') {
            destroyAptekaSelect2();
        }
        selectElement.innerHTML = `<option value="" disabled selected>${defaultOptionText}</option>`;
        selectElement.disabled = true;
    };

    // Функція для заповнення селекта опціями (з логікою Select2)
    const populateSelect = (selectElement, options, addManualOption = false) => {
        // Очищення перед заповненням
         const placeholderOption = selectElement.querySelector('option[value=""]');
         selectElement.innerHTML = '';
         if (placeholderOption) selectElement.appendChild(placeholderOption);

        options.sort((a, b) => a.localeCompare(b, 'uk'));
        options.forEach(optionValue => {
            const option = document.createElement('option');
            option.value = optionValue;
            option.textContent = optionValue;
            selectElement.appendChild(option);
        });

        if (addManualOption) {
            const manualOption = document.createElement('option');
            manualOption.value = MANUAL_INPUT_VALUE;
            manualOption.textContent = MANUAL_INPUT_VALUE;
            selectElement.appendChild(manualOption);
        }

        selectElement.disabled = false;

        if (selectElement.id === 'apteka') {
           // Ініціалізуємо Select2 після заповнення, але після готовності jQuery
           $(function() {
               initializeAptekaSelect2();
               updateAptekaSelect2Placeholder('-- Оберіть аптеку або введіть для пошуку --');
           });
        }
    };

    // Функція для скидання стану полів 4 і 5 + кнопки submit
    const resetAdditionalFieldsState = () => {
        additionalFields.style.display = 'none';
        edrpouInput.value = '';
        edrpouInput.required = false;
        edrpouInput.readOnly = true;
        networkNameInput.value = '';
        networkNameInput.required = false;
        networkNameInput.disabled = true;
        // Скидаємо також стан полів 6-12, якщо вони всередині additionalFields
        // (Припускаємо, що вони там, судячи з HTML структури)
        const fieldsToReset = additionalFields.querySelectorAll('input:not([type="radio"]), select');
        fieldsToReset.forEach(field => {
             if (field.id !== 'edrpou' && field.id !== 'network_name') { // Не скидаємо те, що вже обробили
                 if (field.tagName === 'SELECT') {
                    field.selectedIndex = 0; // Скидаємо select до першого (disabled) опції
                 } else {
                    field.value = '';
                 }
             }
         });
         const radioGroupsToReset = additionalFields.querySelectorAll('input[type="radio"]');
         radioGroupsToReset.forEach(radio => { radio.checked = false; });
         isNameGroup.style.display = 'none'; // Ховаємо поле назви ІС
         isNameInput.required = false;

         submitButton.disabled = true; // Завжди вимикаємо кнопку при скиданні
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
            const oblasti = Object.keys(pharmacyData);
            populateSelect(oblastSelect, oblasti, false);
            resetAdditionalFieldsState(); // Це вже вимикає кнопку
            // Ініціалізуємо Select2 для аптек після завантаження CSV та готовності jQuery
            $(function() { // jQuery(document).ready shorthand
                 initializeAptekaSelect2();
            });
        })
        .catch(error => {
            console.error('Помилка завантаження або парсингу CSV:', error);
            displayMessage('Помилка завантаження довідника аптек. Спробуйте оновити сторінку.', 'error');
            oblastSelect.disabled = true;
            citySelect.disabled = true;
            aptekaSelect.disabled = true;
            submitButton.disabled = true;
            // Ініціалізуємо Select2 у вимкненому стані при помилці
            $(function() {
                 initializeAptekaSelect2();
            });
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
        destroyAptekaSelect2(); // Завжди знищуємо перед скиданням
        resetSelect(aptekaSelect, '-- Спочатку оберіть населений пункт --');
        initializeAptekaSelect2(); // Повторно ініціалізуємо
        updateAptekaSelect2Placeholder('-- Спочатку оберіть населений пункт --');
        resetAdditionalFieldsState(); // Це вимикає кнопку
        aptekaSelect.value = '';
        citySelect.value = '';

        const selectedOblast = oblastSelect.value;
        if (selectedOblast && pharmacyData[selectedOblast]) {
            const cities = Object.keys(pharmacyData[selectedOblast]);
            populateSelect(citySelect, cities, false);
             aptekaSelect.options[0].textContent = '-- Оберіть населений пункт --';
        } else {
            aptekaSelect.options[0].textContent = '-- Спочатку оберіть область --';
        }
    });

    citySelect.addEventListener('change', () => {
        destroyAptekaSelect2(); // Завжди знищуємо перед скиданням
        resetSelect(aptekaSelect, '-- Спочатку оберіть населений пункт --');
        resetAdditionalFieldsState(); // Це вимикає кнопку
        aptekaSelect.value = '';

        const selectedOblast = oblastSelect.value;
        const selectedCity = citySelect.value;
        if (selectedOblast && selectedCity && pharmacyData[selectedOblast]?.[selectedCity]) {
            const apteki = Object.keys(pharmacyData[selectedOblast][selectedCity]);
            populateSelect(aptekaSelect, apteki, true); // Викличе initializeAptekaSelect2
            // Плейсхолдер оновиться автоматично
        } else {
             initializeAptekaSelect2(); // Ініціалізуємо, бо populate не викликався
             updateAptekaSelect2Placeholder('-- Спочатку оберіть населений пункт --');
        }
    });

    // Новий обробник для Select2 події
    $(aptekaSelect).on('select2:select', function (e) {
        console.log('Select2 select event FIRED!');
        const selectedData = e.params.data;
        const selectedApteka = selectedData.id; // .id зазвичай містить value вибраної опції
        console.log('Selected Apteka Value (from select2:select):', selectedApteka);

        const selectedOblast = oblastSelect.value;
        const selectedCity = citySelect.value;

        // Логіка показу/приховування та налаштування полів - така сама, як раніше
        if (selectedOblast && selectedCity && selectedApteka) {
            console.log('Condition met (select2:select), ensuring additional fields are visible...');
            if (additionalFields.style.display === 'none') {
                 additionalFields.style.display = 'block';
            }

            if (selectedApteka === MANUAL_INPUT_VALUE) {
                console.log('Manual input selected (select2:select)');
                edrpouInput.value = '';
                edrpouInput.readOnly = false;
                edrpouInput.required = true;
                networkNameInput.value = '';
                networkNameInput.required = true;
                networkNameInput.disabled = false;
                networkNameInput.placeholder = 'Введіть назву аптеки/мережі';
            } else {
                console.log('Pharmacy selected from list (select2:select)');
                const edrpou = pharmacyData[selectedOblast]?.[selectedCity]?.[selectedApteka] || '';
                edrpouInput.value = edrpou;
                edrpouInput.readOnly = true;
                edrpouInput.required = true;
                networkNameInput.value = selectedApteka;
                networkNameInput.disabled = true;
                networkNameInput.required = false;
                networkNameInput.placeholder = '';
            }
        } else {
            console.log('Condition NOT met (select2:select), hiding and resetting fields.');
            resetAdditionalFieldsState();
        }
        // Залишаємо кнопку вимкненою, вона вмикається тільки при виборі ЕСОЗ
        submitButton.disabled = true;
    });

    // Можливо, також потрібен обробник для очищення (коли користувач натискає хрестик у Select2)
    $(aptekaSelect).on('select2:unselect', function (e) {
         console.log('Select2 unselect event FIRED!');
         resetAdditionalFieldsState(); // При очищенні просто ховаємо та скидаємо поля
    });

    // --- Обробник для поля телефону для очищення вводу --- 
    phoneInput.addEventListener('input', () => {
        // Видаляємо будь-які символи, крім дозволених: цифри, +, -, (, ), пробіл
        phoneInput.value = phoneInput.value.replace(/[^\d\+\-\(\)\s]/g, '');
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

            // Вмикаємо кнопку submit ТІЛЬКИ ЯКЩО обрано аптеку І обрано опцію ЕСОЗ
            if (aptekaSelect.value && (esozRadioYes.checked || esozRadioNo.checked)) {
                 console.log('Enabling submit button...');
                 submitButton.disabled = false;
            } else {
                 console.log('Disabling submit button (ESOZ changed)...');
                 submitButton.disabled = true;
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
            // Якщо обрано ручний ввід аптеки, а поле назви мережі/аптеки деактивовано
            // (таке не повинно трапитись з новою логікою, але про всяк випадок),
            // можливо, варто передавати значення з поля apteka.
            // Зараз передаємо як є.
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
             form.reset();
             resetSelect(citySelect, '-- Спочатку оберіть область --');
             destroyAptekaSelect2(); // Знищуємо перед скиданням
             resetSelect(aptekaSelect, '-- Спочатку оберіть населений пункт --');
             initializeAptekaSelect2(); // Повторно ініціалізуємо
             updateAptekaSelect2Placeholder('-- Спочатку оберіть область --');
             resetAdditionalFieldsState(); // Це вже вимикає кнопку після успішної відправки
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