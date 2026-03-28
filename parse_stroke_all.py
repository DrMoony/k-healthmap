#!/usr/bin/env python3
"""
Parse ALL stroke KOSIS XLS files (old + new) into a single stroke_kosis.js.
Covers: 전체 뇌졸중 (2014-2021), 허혈성 (2022-2024), 출혈성 (2022-2024),
        + existing region/patients/transport data.

Structure:
  STROKE_KOSIS = {
    all: { ... },       // 뇌졸중 전체 (2014-2021)
    ischemic: { ... },  // 허혈성 (2022-2024)
    hemorrhagic: { ... }, // 출혈성 (2022-2024)
    death: { ... },     // 사망 데이터 (2017, 전체 뇌졸중만)
  }
"""

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

# ── Code maps ──────────────────────────────────

SEX = {'SE_00': '전체', 'SE_11': '남자', 'SE_22': '여자'}
AGE = {
    'AG_00': '계', 'AG_01': '1세미만', 'AG_02': '1~9세', 'AG_03': '10~19세',
    'AG_04': '20~29세', 'AG_05': '30~39세', 'AG_06': '40~49세', 'AG_07': '50~59세',
    'AG_08': '60~69세', 'AG_09': '70~79세', 'AG_10': '80세이상', 'AG_11': '미상',
    'AG_12': '계',
}
REGION = {
    'RE_00': '전체', 'RE_11': '서울', 'RE_12': '부산', 'RE_13': '대구', 'RE_14': '인천',
    'RE_15': '광주', 'RE_16': '대전', 'RE_17': '울산', 'RE_18': '세종', 'RE_21': '경기',
    'RE_22': '강원', 'RE_23': '충북', 'RE_24': '충남', 'RE_25': '전북', 'RE_26': '전남',
    'RE_27': '경북', 'RE_28': '경남', 'RE_29': '제주'
}
REGION_R = {
    'r_01': '전체', 'r_02': '서울', 'r_03': '부산', 'r_04': '대구', 'r_05': '인천',
    'r_06': '광주', 'r_07': '대전', 'r_08': '울산', 'r_09': '세종', 'r_10': '경기',
    'r_11': '강원', 'r_12': '충북', 'r_13': '충남', 'r_14': '전북', 'r_15': '전남',
    'r_16': '경북', 'r_17': '경남', 'r_18': '제주'
}
OUTCOME = {
    'OT_20': '계', 'OT_21': '퇴가', 'OT_22': '입원', 'OT_23': '전원',
    'OT_24': '사망', 'OT_25': '기타', 'OT_26': '미상'
}
VEHICLE = {
    'VH_00': '계', 'VH_01': '119구급차', 'VH_02': '기타구급차',
    'VH_03': '자차/택시', 'VH_04': '도보/기타', 'VH_05': '미상'
}
MONTH = {
    'MO_00': '계', 'MO_01': '1월', 'MO_02': '2월', 'MO_03': '3월',
    'MO_04': '4월', 'MO_05': '5월', 'MO_06': '6월', 'MO_07': '7월',
    'MO_08': '8월', 'MO_09': '9월', 'MO_10': '10월', 'MO_11': '11월', 'MO_12': '12월'
}
TRANSPORT_TIME = {
    'TD_00': '계', 'TD_01': '1시간미만', 'TD_021': '1~2시간', 'TD_022': '2~3시간',
    'TD_03': '3~6시간', 'TD_04': '6시간이상', 'TD_05': '미상'
}
DEATH_PLACE = {
    '1': '계', '2': '의료기관 내', '3': '의료기관 외', '4': '미상'
}
DEATH_CAUSE = {
    '1': '계', '10': '순환기계 질환', '11': '허혈성 심장질환',
    '12': '뇌혈관 질환', '13': '기타 순환기계', '20': '신생물',
    '30': '호흡기계 질환', '40': '감염성 질환', '50': '기타'
}
DEATH_TIMING = {
    '1': '계', '2': '입원 당일', '3': '입원 후 1일~6일',
    '4': '입원 후 7일~29일', '5': '입원 후 30일 이상'
}

DIR = Path('D:/Google Drive/k-healthmap/factsheets/kosis')
OUT = Path('D:/Google Drive/k-healthmap/src/data/stroke_kosis.js')


def parse_xls(filename):
    path = DIR / filename
    with open(path, 'r', encoding='utf-8') as f:
        content = re.sub(r'\t', '', f.read().strip())
    root = ET.fromstring(content)
    ns = {'ss': 'urn:schemas-microsoft-com:office:spreadsheet'}
    rows = []
    for row in root.findall('.//ss:Row', ns):
        cells = [c.find('ss:Data', ns).text if c.find('ss:Data', ns) is not None else ''
                 for c in row.findall('ss:Cell', ns)]
        rows.append(cells)
    return rows


def pv(v):
    if not v or v.strip() in ('', '-'):
        return None
    try:
        f = float(v)
        return int(f) if f == int(f) else round(f, 2)
    except ValueError:
        return None


def get_years(header, start_idx):
    return [h for h in header[start_idx:] if h and h.strip().isdigit()]


def year_dict(row, start_idx, years):
    vals = row[start_idx:]
    return {years[i]: pv(vals[i]) for i in range(min(len(years), len(vals)))}


def to_js(obj, indent=0):
    sp = '  '
    if obj is None: return 'null'
    if isinstance(obj, bool): return 'true' if obj else 'false'
    if isinstance(obj, (int, float)): return str(obj)
    if isinstance(obj, str): return json.dumps(obj, ensure_ascii=False)
    if isinstance(obj, list):
        items = [f'{sp*(indent+1)}{to_js(v, indent+1)}' for v in obj]
        return '[\n' + ',\n'.join(items) + f'\n{sp*indent}]'
    if isinstance(obj, dict):
        if not obj: return '{}'
        items = [f'{sp*(indent+1)}{json.dumps(k, ensure_ascii=False)}: {to_js(v, indent+1)}' for k, v in obj.items()]
        return '{\n' + ',\n'.join(items) + f'\n{sp*indent}}}'
    return str(obj)


# ═══════════════════════════════════════
# GENERIC PARSERS (reusable across all 3 types)
# ═══════════════════════════════════════

def parse_er_result_age(filename):
    """outcome × sex × age × item × years → {sex_age: {outcome: {year: val}}}"""
    rows = parse_xls(filename)
    years = get_years(rows[0], 8)
    result = {}
    for r in rows[1:]:
        outcome = OUTCOME.get(r[0], r[0])
        sex = SEX.get(r[2], r[2])
        age = AGE.get(r[4], r[4])
        key = f"{sex}_{age}"
        if key not in result:
            result[key] = {}
        result[key][outcome] = year_dict(r, 8, years)
    return result, years


def parse_er_result_region(filename):
    """outcome × region × item × years → {region: {outcome: {year: val}}}"""
    rows = parse_xls(filename)
    years = get_years(rows[0], 6)
    result = {}
    for r in rows[1:]:
        outcome = OUTCOME.get(r[0], r[0])
        region = REGION.get(r[2], r[2])
        if region not in result:
            result[region] = {}
        result[region][outcome] = year_dict(r, 6, years)
    return result, years


def parse_transport_age(filename):
    """vehicle × sex × age × item × years → {vehicle: {sex_age: {year: val}}}"""
    rows = parse_xls(filename)
    years = get_years(rows[0], 8)
    result = {}
    for r in rows[1:]:
        vehicle = VEHICLE.get(r[0], r[0])
        sex = SEX.get(r[2], r[2])
        age = AGE.get(r[4], r[4])
        if vehicle not in result:
            result[vehicle] = {}
        result[vehicle][f"{sex}_{age}"] = year_dict(r, 8, years)
    return result, years


def parse_transport_region(filename):
    """vehicle × region × item × years → {region: {vehicle: {year: val}}}"""
    rows = parse_xls(filename)
    years = get_years(rows[0], 6)
    result = {}
    for r in rows[1:]:
        vehicle = VEHICLE.get(r[0], r[0])
        region = REGION.get(r[2], r[2])
        if region not in result:
            result[region] = {}
        result[region][vehicle] = year_dict(r, 6, years)
    return result, years


def parse_arrival_time_age(filename):
    """Same structure as transport_age but with transport time codes"""
    rows = parse_xls(filename)
    years = get_years(rows[0], 8)
    result = {}
    for r in rows[1:]:
        time_code = r[0]
        time_label = TRANSPORT_TIME.get(time_code, time_code)
        sex = SEX.get(r[2], r[2])
        age = AGE.get(r[4], r[4])
        if time_label not in result:
            result[time_label] = {}
        result[time_label][f"{sex}_{age}"] = year_dict(r, 8, years)
    return result, years


def parse_arrival_time_region(filename):
    """transport_time × region × item × years → {region: {time: {year: val}}}"""
    rows = parse_xls(filename)
    years = get_years(rows[0], 6)
    result = {}
    for r in rows[1:]:
        time_label = TRANSPORT_TIME.get(r[0], r[0])
        region = REGION.get(r[2], r[2])
        if region not in result:
            result[region] = {}
        result[region][time_label] = year_dict(r, 6, years)
    return result, years


def parse_monthly_region(filename):
    """month × region × item × years → {month: {region: {year: val}}}"""
    rows = parse_xls(filename)
    years = get_years(rows[0], 6)
    result = {}
    for r in rows[1:]:
        month = MONTH.get(r[0], r[0])
        region = REGION.get(r[2], r[2])
        if month not in result:
            result[month] = {}
        result[month][region] = year_dict(r, 6, years)
    return result, years


def parse_monthly_age(filename):
    """month × sex × age × item × years → {month: {sex_age: {year: val}}}"""
    rows = parse_xls(filename)
    years = get_years(rows[0], 8)
    result = {}
    for r in rows[1:]:
        month = MONTH.get(r[0], r[0])
        sex = SEX.get(r[2], r[2])
        age = AGE.get(r[4], r[4])
        if month not in result:
            result[month] = {}
        result[month][f"{sex}_{age}"] = year_dict(r, 8, years)
    return result, years


# ═══════════════════════════════════════
# DEATH DATA (뇌졸중 전체, 2017 only)
# ═══════════════════════════════════════

def parse_death_place_age():
    """sex × age × place × item × years"""
    rows = parse_xls('stroke_death_place_age.xls')
    years = get_years(rows[0], 8)
    result = {}
    for r in rows[1:]:
        sex = SEX.get(r[0], r[0])
        age = AGE.get(r[2], r[2])
        place = DEATH_PLACE.get(r[4], r[4])
        key = f"{sex}_{age}"
        if key not in result:
            result[key] = {}
        result[key][place] = year_dict(r, 8, years)
    return result, years


def parse_death_place_region():
    """region × place × item × years"""
    rows = parse_xls('stroke_death_place_region.xls')
    years = get_years(rows[0], 6)
    result = {}
    for r in rows[1:]:
        region = REGION_R.get(r[0], r[0])
        place = DEATH_PLACE.get(r[2], r[2])
        if region not in result:
            result[region] = {}
        result[region][place] = year_dict(r, 6, years)
    return result, years


def parse_death_cause_region():
    """region × cause × item × years"""
    rows = parse_xls('stroke_death_cause_region.xls')
    years = get_years(rows[0], 6)
    result = {}
    for r in rows[1:]:
        region = REGION_R.get(r[0], r[0])
        cause = DEATH_CAUSE.get(r[2], r[2])
        if region not in result:
            result[region] = {}
        result[region][cause] = year_dict(r, 6, years)
    return result, years


def parse_death_timing_age():
    """sex × age × timing × item × years"""
    rows = parse_xls('stroke_death_timing_age.xls')
    years = get_years(rows[0], 8)
    result = {}
    for r in rows[1:]:
        sex = SEX.get(r[0], r[0])
        age = AGE.get(r[2], r[2])
        timing = DEATH_TIMING.get(r[4], r[4])
        key = f"{sex}_{age}"
        if key not in result:
            result[key] = {}
        result[key][timing] = year_dict(r, 8, years)
    return result, years


def parse_death_timing_region():
    """region × timing × item × years"""
    rows = parse_xls('stroke_death_timing_region.xls')
    years = get_years(rows[0], 6)
    result = {}
    for r in rows[1:]:
        region = REGION_R.get(r[0], r[0])
        timing = DEATH_TIMING.get(r[2], r[2])
        if region not in result:
            result[region] = {}
        result[region][timing] = year_dict(r, 6, years)
    return result, years


# ═══════════════════════════════════════
# EXISTING DATA (from regenerate_stroke.py)
# ═══════════════════════════════════════

def parse_region_patients():
    """stroke_region_incidence.xls: OT_20 rows, region × years"""
    rows = parse_xls('stroke_region_incidence.xls')
    years = get_years(rows[0], 6)
    result = {}
    for r in rows[1:]:
        if r[0] != 'OT_20':
            continue
        region = REGION.get(r[2], r[2])
        if region == '전체':
            continue
        result[region] = year_dict(r, 6, years)
    return result, years


def parse_region_by_outcome():
    """stroke_region_incidence.xls: all outcomes for each region"""
    rows = parse_xls('stroke_region_incidence.xls')
    years = get_years(rows[0], 6)
    result = {}
    for r in rows[1:]:
        outcome = OUTCOME.get(r[0], r[0])
        region = REGION.get(r[2], r[2])
        if region == '전체' or outcome == '계':
            continue
        if region not in result:
            result[region] = {}
        result[region][outcome] = year_dict(r, 6, years)
    return result, years


def parse_patients_gender_age():
    """stroke_patients.xls: OT × sex × age × item × years"""
    rows = parse_xls('stroke_patients.xls')
    years = get_years(rows[0], 8)
    result = {}
    for r in rows[1:]:
        if r[0] != 'OT_20':
            continue
        sex = SEX.get(r[2], r[2])
        age = AGE.get(r[4], r[4])
        if sex not in result:
            result[sex] = {}
        result[sex][age] = year_dict(r, 8, years)

    # Compute 전체 age breakdown by summing 남자 + 여자
    if '남자' in result and '여자' in result:
        all_ages = set(result['남자'].keys()) | set(result['여자'].keys())
        for age in all_ages:
            if age == '계':
                continue  # 계 already exists from SE_00/AG_00
            m = result['남자'].get(age, {})
            f = result['여자'].get(age, {})
            all_years = set(list(m.keys()) + list(f.keys()))
            yd = {}
            for y in sorted(all_years):
                mv, fv = m.get(y), f.get(y)
                if mv is None and fv is None:
                    yd[y] = None
                else:
                    yd[y] = (mv or 0) + (fv or 0)
            result['전체'][age] = yd

    return result, years


def parse_old_transport_region():
    """stroke_transport.xls: transport_time × region × item × years"""
    rows = parse_xls('stroke_transport.xls')
    years = get_years(rows[0], 6)
    result = {}
    for r in rows[1:]:
        time_label = TRANSPORT_TIME.get(r[0], r[0])
        region = REGION.get(r[2], r[2])
        if region not in result:
            result[region] = {}
        result[region][time_label] = year_dict(r, 6, years)
    return result, years


def parse_region_type():
    """stroke_region_type.xls: type × region × item × years"""
    rows = parse_xls('stroke_region_type.xls')
    years = get_years(rows[0], 6)
    # First check what the type codes are
    result = {}
    for r in rows[1:]:
        type_code = r[0]
        region = REGION.get(r[2], r[2])
        if region not in result:
            result[region] = {}
        result[region][type_code] = year_dict(r, 6, years)
    return result, years


def parse_treatment():
    """stroke_treatment.xls"""
    rows = parse_xls('stroke_treatment.xls')
    years = get_years(rows[0], 8)
    result = {}
    for r in rows[1:]:
        if r[0] != 'OT_20':
            continue
        sex = SEX.get(r[2], r[2])
        age = AGE.get(r[4], r[4])
        if sex not in result:
            result[sex] = {}
        result[sex][age] = year_dict(r, 8, years)
    return result, years


# ═══════════════════════════════════════
# MAIN
# ═══════════════════════════════════════

def build_type_block(prefix, label):
    """Build a data block for one stroke type (isch_ or hem_)"""
    print(f"\n  [{label}]")
    block = {}

    print(f"    erResultAge...")
    block['erResultAge'], _ = parse_er_result_age(f'{prefix}er_result_age.xls')

    print(f"    erResultRegion...")
    block['erResultRegion'], _ = parse_er_result_region(f'{prefix}er_result_region.xls')

    print(f"    transportAge...")
    block['transportAge'], _ = parse_transport_age(f'{prefix}transport_age.xls')

    print(f"    transportRegion...")
    block['transportRegion'], _ = parse_transport_region(f'{prefix}transport_region.xls')

    print(f"    arrivalTimeAge...")
    block['arrivalTimeAge'], _ = parse_arrival_time_age(f'{prefix}arrival_time_age.xls')

    print(f"    arrivalTimeRegion...")
    block['arrivalTimeRegion'], _ = parse_arrival_time_region(f'{prefix}arrival_time_region.xls')

    print(f"    monthlyRegion...")
    block['monthlyRegion'], _ = parse_monthly_region(f'{prefix}monthly_region.xls')

    print(f"    monthlyAge...")
    block['monthlyAge'], _ = parse_monthly_age(f'{prefix}monthly_age.xls')

    return block


def main():
    print("=== Parsing ALL stroke KOSIS data ===")

    # ── Existing data ──
    print("\n[기존 데이터]")
    print("  regionPatients...")
    region_patients, _ = parse_region_patients()

    print("  regionByOutcome...")
    region_by_outcome, _ = parse_region_by_outcome()

    print("  byGenderAge...")
    by_gender_age, _ = parse_patients_gender_age()

    print("  transportByRegion (old)...")
    old_transport, _ = parse_old_transport_region()

    # ── 뇌졸중 전체 (2014-2021) ──
    print("\n[뇌졸중 전체 2014-2021]")
    all_block = {}

    print("  erResultAge...")
    all_block['erResultAge'], _ = parse_er_result_age('stroke_er_result_age.xls')

    print("  erResultRegion...")
    all_block['erResultRegion'], _ = parse_er_result_region('stroke_er_result_region.xls')

    print("  transportAge...")
    all_block['transportAge'], _ = parse_transport_age('stroke_transport_age.xls')

    print("  transportRegion...")
    all_block['transportRegion'], _ = parse_transport_region('stroke_transport_region.xls')

    print("  arrivalTimeAge...")
    all_block['arrivalTimeAge'], _ = parse_arrival_time_age('stroke_arrival_time_age.xls')

    print("  arrivalTimeRegion...")
    all_block['arrivalTimeRegion'], _ = parse_arrival_time_region('stroke_arrival_time_region.xls')

    print("  monthlyRegion...")
    all_block['monthlyRegion'], _ = parse_monthly_region('stroke_monthly_region.xls')

    print("  monthlyAge...")
    all_block['monthlyAge'], _ = parse_monthly_age('stroke_monthly_age.xls')

    # ── 허혈성 (2022-2024) ──
    isch_block = build_type_block('isch_', '허혈성 2022-2024')

    # ── 출혈성 (2022-2024) ──
    hem_block = build_type_block('hem_', '출혈성 2022-2024')

    # ── 사망 데이터 (2017) ──
    print("\n[사망 데이터 2017]")
    death = {}

    print("  deathPlaceAge...")
    death['placeAge'], _ = parse_death_place_age()

    print("  deathPlaceRegion...")
    death['placeRegion'], _ = parse_death_place_region()

    print("  deathCauseRegion...")
    death['causeRegion'], _ = parse_death_cause_region()

    print("  deathTimingAge...")
    death['timingAge'], _ = parse_death_timing_age()

    print("  deathTimingRegion...")
    death['timingRegion'], _ = parse_death_timing_region()

    # ── Compute transportGrouped (2023) from old data ──
    year = '2023'
    transport_grouped = {}
    under3_keys = ['1시간미만', '1~2시간', '2~3시간']
    for region, data in old_transport.items():
        under3 = sum(data.get(k, {}).get(year) or 0 for k in under3_keys)
        transport_grouped[region] = {
            '3시간미만': under3,
            '3~6시간': data.get('3~6시간', {}).get(year) or 0,
            '6시간이상': data.get('6시간이상', {}).get(year) or 0,
            '미상': data.get('미상', {}).get(year) or 0,
        }

    # ── Generate JS ──
    js = f"""// Auto-generated from KOSIS XLS files by parse_stroke_all.py
// Source: KOSIS 심뇌혈관질환통계 (orgId=411)
// Generated: 2026-03-27
// 뇌졸중 전체: 2014-2021, 허혈성/출혈성: 2022-2024 (분리), 사망: 2017

export const STROKE_KOSIS = {{
  // ── 시도별 환자수 (2022-2024, 뇌졸중 전체 기준) ──
  regionPatients: {to_js(region_patients, 1)},

  // ── 시도별 응급진료결과 (2022-2024) ──
  regionByOutcome: {to_js(region_by_outcome, 1)},

  // ── 성별·연령별 환자수 (2019-2021) ──
  byGenderAge: {to_js(by_gender_age, 1)},

  // ── 이송시간 시도별 (2022-2024, old format) ──
  transportByRegion: {to_js(old_transport, 1)},

  // ── 이송시간 그룹화 (2023 기준) ──
  transportGrouped: {to_js(transport_grouped, 1)},

  // ═══════════════════════════════════════
  // 뇌졸중 전체 (2014-2021)
  // ═══════════════════════════════════════
  all: {to_js(all_block, 1)},

  // ═══════════════════════════════════════
  // 허혈성 뇌졸중 (2022-2024)
  // ═══════════════════════════════════════
  ischemic: {to_js(isch_block, 1)},

  // ═══════════════════════════════════════
  // 출혈성 뇌졸중 (2022-2024)
  // ═══════════════════════════════════════
  hemorrhagic: {to_js(hem_block, 1)},

  // ═══════════════════════════════════════
  // 사망 데이터 (2017, 뇌졸중 전체)
  // ═══════════════════════════════════════
  death: {to_js(death, 1)},

  source: 'KOSIS 심뇌혈관질환통계 (orgId=411), 2014-2024. 접근일: 2026-03-27',
}};
"""

    OUT.write_text(js, encoding='utf-8')
    print(f"\n=> Written {OUT} ({len(js):,} bytes)")

    # Verification
    print("\n── Verification ──")
    print(f"  regionPatients: {len(region_patients)} regions")
    print(f"  서울 2024: {region_patients.get('서울', {}).get('2024')}")
    print(f"  all.erResultAge keys: {len(all_block['erResultAge'])}")
    print(f"  ischemic.erResultAge keys: {len(isch_block['erResultAge'])}")
    print(f"  hemorrhagic.erResultAge keys: {len(hem_block['erResultAge'])}")
    print(f"  death sections: {list(death.keys())}")
    s = all_block['monthlyRegion'].get('1월', {}).get('전체', {})
    print(f"  all.monthly 1월/전체: {s}")
    s2 = isch_block['monthlyRegion'].get('1월', {}).get('전체', {})
    print(f"  isch.monthly 1월/전체: {s2}")
    s3 = hem_block['monthlyRegion'].get('1월', {}).get('전체', {})
    print(f"  hem.monthly 1월/전체: {s3}")


if __name__ == '__main__':
    main()
