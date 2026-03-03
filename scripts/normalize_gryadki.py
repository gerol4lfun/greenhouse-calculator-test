#!/usr/bin/env python3
"""
Скрипт для нормализации данных о грядках из CSV
Создает 3 файла:
- gryadki_normalized_rows.csv - нормализованные строки
- gryadki_price_matrix.csv - матрица цен
- gryadki_conflicts.csv - конфликты цен по городам
"""

import csv
import re
from urllib.parse import urlparse
from collections import defaultdict

IN_FILE = "gryadki_prices.csv"

def parse_length_m(s: str):
    """Извлекает длину из строки типа '4 метра' или '10 метров'"""
    m = re.search(r"(\d+)", s or "")
    return int(m.group(1)) if m else None

def parse_type_height(model_path: str):
    """Определяет тип и высоту по пути модели"""
    if "vysokie" in (model_path or ""):
        return "высокая", 38
    return "низкая", 19

def parse_width(model_path: str):
    """Извлекает ширину из пути модели"""
    if re.search(r"-05-m/?$", model_path or ""):
        return 0.50
    m = re.search(r"-(05m|065m|075m|1m)/$", model_path or "")
    if not m:
        return None
    return {"05m": 0.50, "065m": 0.65, "075m": 0.75, "1m": 1.00}[m.group(1)]

def to_int(s):
    """Преобразует строку в число"""
    if s is None:
        return None
    s = str(s).strip()
    if not s:
        return None
    s = re.sub(r"[^\d]", "", s)
    return int(s) if s else None

rows = []
prices_by_key = defaultdict(set)     # (model_path, length_m) -> {prices}
cities_by_key = defaultdict(set)     # (model_path, length_m, price) -> {city_root}

print("📊 Чтение CSV файла...")

with open(IN_FILE, "r", encoding="utf-8") as f:
    r = csv.DictReader(f)
    for row in r:
        city = row.get("city_root")
        url = row.get("product_url")
        length = row.get("length")
        price = to_int(row.get("discount_price_rub"))

        if not url:
            continue

        model_path = urlparse(url).path

        # фильтр: только грядки
        if "gryadki" not in model_path.lower():
            continue
        if not re.search(r"/item/\d+-", model_path, re.I):
            continue

        length_m = parse_length_m(length)
        typ, height_cm = parse_type_height(model_path)
        width_m = parse_width(model_path)

        rows.append({
            "city_root": city,
            "model_path": model_path,
            "type": typ,
            "width_m": width_m,
            "height_cm": height_cm,
            "length_m": length_m,
            "price_rub": price
        })

        if length_m is not None and price is not None:
            prices_by_key[(model_path, length_m)].add(price)
            cities_by_key[(model_path, length_m, price)].add(city)

print(f"✅ Обработано {len(rows)} строк")

# A) normalized rows
print("📝 Создание gryadki_normalized_rows.csv...")
with open("gryadki_normalized_rows.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.DictWriter(f, fieldnames=[
        "city_root","model_path","type","width_m","height_cm","length_m","price_rub"
    ])
    w.writeheader()
    for row in rows:
        w.writerow(row)

# C) conflicts
print("🔍 Поиск конфликтов цен...")
conflicts = []
for (model_path, length_m), price_set in prices_by_key.items():
    if len(price_set) > 1:
        conflicts.append((model_path, length_m, sorted(price_set)))

with open("gryadki_conflicts.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["model_path","length_m","prices","cities_by_price"])
    for model_path, length_m, price_list in conflicts:
        city_map = []
        for p in price_list:
            cs = sorted(cities_by_key[(model_path, length_m, p)])
            city_map.append(f"{p}: {len(cs)} cities")
        w.writerow([model_path, length_m, " | ".join(map(str, price_list)), " ; ".join(city_map)])

if conflicts:
    print(f"⚠️ Найдено {len(conflicts)} конфликтов цен")
else:
    print("✅ Конфликтов не найдено - цены одинаковые для всех городов!")

# B) matrix
print("📊 Создание матрицы цен...")
models = sorted({r["model_path"] for r in rows})

def get_meta(model_path):
    typ, height = parse_type_height(model_path)
    width = parse_width(model_path)
    return typ, width, height

with open("gryadki_price_matrix.csv", "w", encoding="utf-8", newline="") as f:
    w = csv.writer(f)
    w.writerow(["model_path","type","width_m","height_cm",
                "price_4","price_6","price_8","price_10","price_12",
                "step_2m","all_steps_equal"])
    for mp in models:
        typ, width, height = get_meta(mp)
        prices = {}
        ok = True
        for L in [4,6,8,10,12]:
            s = prices_by_key.get((mp, L), set())
            if len(s) == 1:
                prices[L] = list(s)[0]
            elif len(s) == 0:
                prices[L] = ""
            else:
                # конфликт
                prices[L] = ""
                ok = False

        # step + equality (если все цены есть и без конфликтов)
        steps_equal = False
        step = ""
        if ok and all(prices[L] != "" for L in [4,6,8,10,12]):
            step = prices[6] - prices[4]
            steps_equal = (
                (prices[8] - prices[6] == step) and
                (prices[10] - prices[8] == step) and
                (prices[12] - prices[10] == step)
            )

        w.writerow([mp, typ, width, height,
                    prices[4], prices[6], prices[8], prices[10], prices[12],
                    step, str(steps_equal).lower()])

print("\n✅ Готово! Созданы файлы:")
print("  - gryadki_normalized_rows.csv")
print("  - gryadki_price_matrix.csv")
print("  - gryadki_conflicts.csv")
