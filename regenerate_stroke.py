#!/usr/bin/env python3
"""
Regenerate stroke_kosis.js from KOSIS XLS (XML Spreadsheet) files.
Uses code-based keys (SE_00, AG_01, RE_11, TD_01, OT_20...) to avoid
encoding issues with Korean text in XLS files.
"""

import json
import xml.etree.ElementTree as ET
from pathlib import Path

# ── Code → Label mappings ──────────────────────────────────

GENDER_MAP = {'SE_00': '전체', 'SE_11': '남자', 'SE_22': '여자'}
AGE_MAP = {
    'AG_00': '계', 'AG_01': '1세미만', 'AG_02': '1~9세', 'AG_03': '10~19세',
    'AG_04': '20~29세', 'AG_05': '30~39세', 'AG_06': '40~49세', 'AG_07': '50~59세',
    'AG_08': '60~69세', 'AG_09': '70~79세', 'AG_10': '80세이상', 'AG_11': '미상',
    'AG_12': '계',  # treatment file uses AG_12 for total
}
REGION_MAP = {
    'RE_00': '전체', 'RE_11': '서울', 'RE_12': '부산', 'RE_13': '대구', 'RE_14': '인천',
    'RE_15': '광주', 'RE_16': '대전', 'RE_17': '울산', 'RE_18': '세종', 'RE_21': '경기',
    'RE_22': '강원', 'RE_23': '충북', 'RE_24': '충남', 'RE_25': '전북', 'RE_26': '전남',
    'RE_27': '경북', 'RE_28': '경남', 'RE_29': '제주'
}
TRANSPORT_MAP = {
    'TD_00': '계', 'TD_01': '1시간미만', 'TD_021': '1~2시간', 'TD_022': '2~3시간',
    'TD_03': '3~6시간', 'TD_04': '6시간이상', 'TD_05': '미상'
}
OUTCOME_MAP = {
    'OT_20': '계', 'OT_21': '퇴가', 'OT_22': '입원', 'OT_23': '전원',
    'OT_24': '사망', 'OT_25': '기타', 'OT_26': '미상'
}

KOSIS_DIR = Path('factsheets/kosis')


def parse_xls(filename):
    """Parse KOSIS XLS (XML Spreadsheet) file, return header + data rows."""
    path = KOSIS_DIR / filename
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    # Strip leading tabs that break XML parsing
    content = content.strip()
    while content.startswith('\t'):
        content = content[1:]
    content = content.replace('\t\n', '\n').replace('\n\t', '\n')
    # Also handle tabs around XML tags
    import re
    content = re.sub(r'\t(<)', r'\1', content)
    content = re.sub(r'(>)\t', r'\1', content)

    root = ET.fromstring(content)
    ns = {'ss': 'urn:schemas-microsoft-com:office:spreadsheet'}
    rows = root.findall('.//ss:Row', ns)
    result = []
    for row in rows:
        cells = row.findall('ss:Cell', ns)
        vals = []
        for c in cells:
            d = c.find('ss:Data', ns)
            vals.append(d.text if d is not None else None)
        result.append(vals)
    return result


def parse_val(v):
    """Parse a value: '-' or None → None, otherwise int."""
    if v is None or v == '-' or v.strip() == '' or v.strip() == '-':
        return None
    try:
        return int(v)
    except ValueError:
        try:
            return float(v)
        except ValueError:
            return None


def build_region_patients():
    """
    stroke_region_incidence.xls: Outcome × Region × years(2022,2023,2024)
    We want OT_20 (계=total) for each region (excluding RE_00=전체).
    Structure: { "서울": {"2022": X, "2023": Y, "2024": Z}, ... }
    """
    rows = parse_xls('stroke_region_incidence.xls')
    years = rows[0][6:]  # ['2022','2023','2024']
    result = {}
    for r in rows[1:]:
        ot_code, _, re_code, _, item_code, _, *vals = r
        if ot_code != 'OT_20':  # only total outcome
            continue
        region = REGION_MAP.get(re_code)
        if not region or region == '전체':
            continue
        year_data = {}
        for i, y in enumerate(years):
            year_data[y] = parse_val(vals[i]) if i < len(vals) else None
        result[region] = year_data
    return result


def build_region_by_outcome():
    """
    stroke_region_incidence.xls: Outcome × Region × years(2022,2023,2024)
    Structure: { "서울": {"퇴가": {"2022":..}, "입원": {..}, ...}, ... }
    """
    rows = parse_xls('stroke_region_incidence.xls')
    years = rows[0][6:]
    result = {}
    for r in rows[1:]:
        ot_code, _, re_code, _, item_code, _, *vals = r
        outcome = OUTCOME_MAP.get(ot_code)
        region = REGION_MAP.get(re_code)
        if not outcome or not region or region == '전체' or outcome == '계':
            continue
        if region not in result:
            result[region] = {}
        year_data = {}
        for i, y in enumerate(years):
            year_data[y] = parse_val(vals[i]) if i < len(vals) else None
        result[region][outcome] = year_data
    return result


def build_by_gender_age():
    """
    stroke_patients.xls: Outcome × Gender × Age × years(2019,2020,2021)
    We want OT_20 (계=total outcome) rows.
    Structure: { "전체": {"계": {"2019":..}, "1세미만": {..}, ...}, "남자": {...}, "여자": {...} }
    """
    rows = parse_xls('stroke_patients.xls')
    years = rows[0][8:]  # ['2019','2020','2021']
    result = {}
    for r in rows[1:]:
        ot_code, _, se_code, _, ag_code, _, item_code, _, *vals = r
        if ot_code != 'OT_20':  # total outcome only
            continue
        gender = GENDER_MAP.get(se_code)
        age = AGE_MAP.get(ag_code)
        if not gender or not age:
            continue
        if gender not in result:
            result[gender] = {}
        year_data = {}
        for i, y in enumerate(years):
            year_data[y] = parse_val(vals[i]) if i < len(vals) else None
        result[gender][age] = year_data

    # Compute 전체 age breakdown by summing 남자 + 여자
    if '남자' in result and '여자' in result:
        all_ages = set(result['남자'].keys()) | set(result['여자'].keys())
        for age in all_ages:
            if age == '계':
                continue  # 계 already exists from SE_00/AG_00
            m = result['남자'].get(age, {})
            f = result['여자'].get(age, {})
            all_years = set(list(m.keys()) + list(f.keys()))
            year_data = {}
            for y in sorted(all_years):
                mv = m.get(y)
                fv = f.get(y)
                if mv is None and fv is None:
                    year_data[y] = None
                else:
                    year_data[y] = (mv or 0) + (fv or 0)
            result['전체'][age] = year_data

    # Sort age groups in canonical order
    AGE_ORDER = ['계', '1세미만', '1~9세', '10~19세', '20~29세', '30~39세',
                 '40~49세', '50~59세', '60~69세', '70~79세', '80세이상', '미상']
    sorted_result = {}
    for gender in ['전체', '남자', '여자']:
        if gender in result:
            sorted_result[gender] = {}
            for age in AGE_ORDER:
                if age in result[gender]:
                    sorted_result[gender][age] = result[gender][age]
    return sorted_result


def build_transport_by_region():
    """
    stroke_transport.xls: Transport × Region × years(2022,2023,2024)
    Structure: { "서울": {"계": {"2022":..}, "1시간미만": {..}, ...}, ... }
    """
    rows = parse_xls('stroke_transport.xls')
    years = rows[0][6:]
    result = {}
    for r in rows[1:]:
        td_code, _, re_code, _, item_code, _, *vals = r
        transport = TRANSPORT_MAP.get(td_code)
        region = REGION_MAP.get(re_code)
        if not transport or not region:
            continue
        if region not in result:
            result[region] = {}
        year_data = {}
        for i, y in enumerate(years):
            year_data[y] = parse_val(vals[i]) if i < len(vals) else None
        result[region][transport] = year_data
    return result


def build_transport_grouped(transport_by_region):
    """
    Aggregate transport times for dashboard display.
    "3시간미만" = 1시간미만 + 1~2시간 + 2~3시간
    "3~6시간" = 3~6시간
    "6시간이상" = 6시간이상
    Uses 2023 data (latest full year).
    """
    year = '2023'
    result = {}
    under3_keys = ['1시간미만', '1~2시간', '2~3시간']
    for region, data in transport_by_region.items():
        under3 = 0
        for k in under3_keys:
            v = data.get(k, {}).get(year)
            if v is not None:
                under3 += v
        t36 = data.get('3~6시간', {}).get(year)
        over6 = data.get('6시간이상', {}).get(year)
        unknown = data.get('미상', {}).get(year)
        result[region] = {
            '3시간미만': under3,
            '3~6시간': t36 if t36 is not None else 0,
            '6시간이상': over6 if over6 is not None else 0,
            '미상': unknown if unknown is not None else 0,
        }
    return result


def to_js(obj, indent=0):
    """Convert Python dict/value to JS literal string."""
    sp = '  '
    if obj is None:
        return 'null'
    if isinstance(obj, bool):
        return 'true' if obj else 'false'
    if isinstance(obj, (int, float)):
        return str(obj)
    if isinstance(obj, str):
        return json.dumps(obj, ensure_ascii=False)
    if isinstance(obj, dict):
        if not obj:
            return '{}'
        items = []
        for k, v in obj.items():
            items.append(f'{sp * (indent + 1)}{json.dumps(k, ensure_ascii=False)}: {to_js(v, indent + 1)}')
        return '{\n' + ',\n'.join(items) + f'\n{sp * indent}}}'
    return str(obj)


def main():
    print("Parsing stroke_region_incidence.xls...")
    region_patients = build_region_patients()
    print(f"  regionPatients: {len(region_patients)} regions")

    print("Parsing stroke_region_incidence.xls (outcomes)...")
    region_by_outcome = build_region_by_outcome()
    print(f"  regionByOutcome: {len(region_by_outcome)} regions")

    print("Parsing stroke_patients.xls...")
    by_gender_age = build_by_gender_age()
    for g, ages in by_gender_age.items():
        print(f"  byGenderAge[{g}]: {len(ages)} age groups")

    print("Parsing stroke_transport.xls...")
    transport_by_region = build_transport_by_region()
    print(f"  transportByRegion: {len(transport_by_region)} regions")

    print("Building transportGrouped (2023)...")
    transport_grouped = build_transport_grouped(transport_by_region)
    print(f"  transportGrouped: {len(transport_grouped)} regions")

    # Generate JS
    js = """// Auto-generated from KOSIS XLS files by regenerate_stroke.py
// Source: KOSIS 심뇌혈관질환통계 (orgId=411)
// Generated: 2026-03-24

export const STROKE_KOSIS = {
  // 시도별 허혈성 뇌졸중 환자수 (2022, 2023, 2024)
  regionPatients: """ + to_js(region_patients, 1) + """,

  // 성별·연령별 환자수 - 전국, 뇌졸중 전체 (2019, 2020, 2021)
  byGenderAge: """ + to_js(by_gender_age, 1) + """,

  // 이송시간별 시도별 환자수 (2022, 2023, 2024)
  transportByRegion: """ + to_js(transport_by_region, 1) + """,

  // Aggregated transport time groups (2023 data)
  // 3시간미만 = 1시간미만 + 1~2시간 + 2~3시간
  transportGrouped: """ + to_js(transport_grouped, 1) + """,

  // 응급진료결과별 × 시도별 환자수 (2022, 2023, 2024)
  regionByOutcome: """ + to_js(region_by_outcome, 1) + """,

  source: 'KOSIS 심뇌혈관질환통계 (orgId=411), 2019-2024. 접근일: 2026-03-24',
};
"""

    out_path = Path('src/data/stroke_kosis.js')
    out_path.write_text(js, encoding='utf-8')
    print(f"\nWritten to {out_path} ({len(js)} bytes)")

    # Verify a few values
    print("\n── Verification ──")
    print(f"  서울 2023 patients: {region_patients.get('서울', {}).get('2023')}")
    print(f"  byGenderAge 전체/계/2021: {by_gender_age.get('전체', {}).get('계', {}).get('2021')}")
    print(f"  byGenderAge 남자/50~59세/2021: {by_gender_age.get('남자', {}).get('50~59세', {}).get('2021')}")
    print(f"  transport 서울/1시간미만/2023: {transport_by_region.get('서울', {}).get('1시간미만', {}).get('2023')}")
    tg_seoul = transport_grouped.get('서울', {})
    print(f"  transportGrouped 서울: {tg_seoul}")
    print(f"  outcome 서울/입원/2023: {region_by_outcome.get('서울', {}).get('입원', {}).get('2023')}")


if __name__ == '__main__':
    main()
