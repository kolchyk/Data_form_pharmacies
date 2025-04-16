import csv
import json
from collections import defaultdict

def csv_to_nested_json(csv_filepath, json_filepath):
    """
    Reads a CSV file with pharmacy data and converts it into a nested JSON structure
    including EDRPOU.

    CSV format expected: "Область";"Місто";"Аптека";"ЄДРПОУ"
    JSON output format: {
        "Oblast": {
            "City": [
                { "name": "Apteka1", "edrpou": "11111111" },
                { "name": "Apteka2", "edrpou": "22222222" },
                ...
            ]
        }
    }
    Pharmacy objects within each city list will be sorted alphabetically by name.
    """
    # Structure: { oblast: { city: [ {name: apteka, edrpou: edrpou}, ... ] } }
    data_structure = defaultdict(lambda: defaultdict(list))

    try:
        with open(csv_filepath, mode='r', encoding='utf-8') as csvfile:
            # Use csv.reader with specified delimiter and quote character
            reader = csv.reader(csvfile, delimiter=';', quotechar='"')

            header = next(reader) # Skip header row

            expected_header = ["Область", "Місто", "Аптека", "ЄДРПОУ"]
            if header != expected_header:
                 print(f"Попередження: Заголовки у CSV ({header}) не відповідають очікуваним {expected_header}.")

            line_num = 1 # Start from 1 because we skipped the header
            for row in reader:
                line_num += 1
                # Basic validation to ensure row has enough columns
                if len(row) >= 4:
                    oblast = row[0].strip()
                    city = row[1].strip()
                    apteka = row[2].strip()
                    edrpou = row[3].strip()

                    # Add apteka object if oblast, city, and apteka are not empty
                    if oblast and city and apteka:
                        pharmacy_entry = {"name": apteka, "edrpou": edrpou or ""} # Store empty string if EDRPOU is missing

                        # Avoid adding exact duplicates (same name and edrpou in the same city)
                        # Note: This checks for duplicates based on the entire object.
                        # If you only want to avoid duplicate names per city, adjust the check.
                        if pharmacy_entry not in data_structure[oblast][city]:
                            data_structure[oblast][city].append(pharmacy_entry)
                        # else:
                        #    print(f"Info: Duplicate entry skipped on line {line_num}: {row}")

                elif len(row) > 0: # Avoid printing warning for completely empty lines
                    print(f"Попередження: Пропущено рядок {line_num} через недостатню кількість стовпців ({len(row)} < 4): {row}")


        # Sort pharmacy lists alphabetically by name for each city
        for oblast in data_structure:
            for city in data_structure[oblast]:
                # Sort the list of dictionaries based on the 'name' key
                data_structure[oblast][city].sort(key=lambda x: x['name'].lower())

        # Convert defaultdicts back to regular dicts for cleaner JSON output
        output_dict = {k: dict(v) for k, v in data_structure.items()}


        # Write the data structure to a JSON file
        with open(json_filepath, mode='w', encoding='utf-8') as jsonfile:
            json.dump(output_dict, jsonfile, ensure_ascii=False, indent=2)

        print(f"Файл '{json_filepath}' успішно створено з ієрархією та ЄДРПОУ.")

    except FileNotFoundError:
        print(f"Помилка: Файл '{csv_filepath}' не знайдено.")
    except Exception as e:
        print(f"Сталася помилка під час обробки файлів: {e}")

# --- Використання ---
csv_file = 'list.csv'
json_file = 'apteky_with_edrpou.json' # Using a new filename to avoid overwriting the old one
csv_to_nested_json(csv_file, json_file)