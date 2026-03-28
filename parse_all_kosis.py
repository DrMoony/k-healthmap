#!/usr/bin/env python3
"""
Parse all KOSIS XLS (XML Spreadsheet) files for MI, DM, HF data.
Generates: mi_kosis.js, dm_kosis.js, hf_kosis.js
Uses code-based keys to avoid broken Korean encoding in XLS files.
"""

import json
import re
import xml.etree.ElementTree as ET
from pathlib import Path

# ── Code → Label mappings ──────────────────────────────────

SEX_MAP = {'0': '전체', '1': '남자', '2': '여자'}
SEX_MAP2 = {'SE_00': '전체', 'SE_11': '남자', 'SE_22': '여자'}

REGION_MAP = {
    'RE_00': '전체', 'RE_11': '서울', 'RE_12': '부산', 'RE_13': '대구', 'RE_14': '인천',
    'RE_15': '광주', 'RE_16': '대전', 'RE_17': '울산', 'RE_18': '세종', 'RE_21': '경기',
    'RE_22': '강원', 'RE_23': '충북', 'RE_24': '충남', 'RE_25': '전북', 'RE_26': '전남',
    'RE_27': '경북', 'RE_28': '경남', 'RE_29': '제주'
}

# Regional files use numeric region codes
REGION_NUM_MAP = {
    '001': '서울', '002': '부산', '003': '대구', '004': '인천',
    '005': '광주', '006': '대전', '007': '울산', '0071': '세종',
    '008': '경기', '009': '강원', '010': '충북', '011': '충남', '012': '전북',
    '013': '전남', '014': '경북', '015': '경남', '016': '제주'
}

# mi_death_cause_region uses r_XX codes
REGION_R_MAP = {
    'r_01': '전체', 'r_02': '서울', 'r_03': '부산', 'r_04': '대구', 'r_05': '인천',
    'r_06': '광주', 'r_07': '대전', 'r_08': '울산', 'r_09': '세종', 'r_10': '경기',
    'r_11': '강원', 'r_12': '충북', 'r_13': '충남', 'r_14': '전북', 'r_15': '전남',
    'r_16': '경북', 'r_17': '경남', 'r_18': '제주'
}

AGE_MAP = {
    'AG_00': '계', 'AG_01': '1세미만', 'AG_02': '1~9세', 'AG_03': '10~19세',
    'AG_04': '20~29세', 'AG_05': '30~39세', 'AG_06': '40~49세', 'AG_07': '50~59세',
    'AG_08': '60~69세', 'AG_09': '70~79세', 'AG_10': '80세이상', 'AG_11': '미상',
}

OUTCOME_MAP = {
    'OT_20': '계', 'OT_21': '퇴가', 'OT_22': '입원', 'OT_23': '전원',
    'OT_24': '사망', 'OT_25': '기타', 'OT_26': '미상'
}

VEHICLE_MAP = {
    'VH_00': '계', 'VH_01': '119구급차', 'VH_02': '기타구급차',
    'VH_03': '자차/택시', 'VH_04': '도보/기타', 'VH_05': '미상'
}

MONTH_MAP = {
    'MO_00': '계', 'MO_01': '1월', 'MO_02': '2월', 'MO_03': '3월',
    'MO_04': '4월', 'MO_05': '5월', 'MO_06': '6월', 'MO_07': '7월',
    'MO_08': '8월', 'MO_09': '9월', 'MO_10': '10월', 'MO_11': '11월', 'MO_12': '12월'
}

# MI onset type
ONSET_MAP = {'B01': '첫발생', 'B02': '재발생'}

# MI patient/admission basis
BASIS_MAP = {'AA': '환자단위', 'BB': '입원단위'}

# OECD countries (selected)
OECD_MAP = {
    '1005': '한국', '1095': '이스라엘', '1140': '일본', '1300': '멕시코',
    '2010': '호주', '2040': '오스트리아', '2056': '벨기에', '2124': '캐나다',
    '2203': '체코', '2208': '덴마크', '2233': '에스토니아', '2246': '핀란드',
    '2250': '프랑스', '2276': '독일', '2300': '그리스', '2348': '헝가리',
    '2352': '아이슬란드', '2372': '아일랜드', '2380': '이탈리아',
    '2428': '라트비아', '2440': '리투아니아', '2442': '룩셈부르크',
    '2528': '네덜란드', '2554': '뉴질랜드', '2578': '노르웨이',
    '2616': '폴란드', '2620': '포르투갈', '2703': '슬로바키아',
    '2705': '슬로베니아', '2724': '스페인', '2752': '스웨덴',
    '2756': '스위스', '2792': '터키', '2826': '영국', '2840': '미국',
    '2152': '칠레', '2170': '콜롬비아', '2188': '코스타리카',
}

# Death cause codes (from mi_death_cause_region)
DEATH_CAUSE_MAP = {
    '1': '계', '10': '순환기계 질환', '11': '허혈성 심장질환',
    '12': '뇌혈관 질환', '13': '기타 순환기계', '20': '신생물',
    '30': '호흡기계 질환', '40': '감염성 질환', '50': '기타'
}

# Death timing codes
DEATH_TIMING_MAP = {
    '1': '계', '2': '퇴원 후 30일 이내', '3': '31일~90일',
    '4': '91일~180일', '5': '181일~365일'
}

# DM disabled special categories
DM_SPECIAL_MAP = {
    'A01': '전체', 'A02': '뇌병변', 'A03': '지체', 'A04': '시각',
    'A05': '신장', 'A06': '심장'
}
DM_DISABLED_SUB = {
    'B01': '계', 'B02': '장애인'
}

KOSIS_DIR = Path('D:/Google Drive/k-healthmap/factsheets/kosis')
OUT_DIR = Path('D:/Google Drive/k-healthmap/src/data')


def parse_xls(filename):
    """Parse KOSIS XLS (XML Spreadsheet) file, return rows of cell values."""
    path = KOSIS_DIR / filename
    with open(path, 'r', encoding='utf-8') as f:
        content = f.read()
    content = content.strip()
    content = re.sub(r'\t', '', content)
    root = ET.fromstring(content)
    ns = {'ss': 'urn:schemas-microsoft-com:office:spreadsheet'}
    rows = []
    for row in root.findall('.//ss:Row', ns):
        cells = []
        for cell in row.findall('ss:Cell', ns):
            d = cell.find('ss:Data', ns)
            cells.append(d.text if d is not None else None)
        rows.append(cells)
    return rows


def pv(v):
    """Parse value: '-' or None → None, otherwise float/int."""
    if v is None or v.strip() in ('', '-'):
        return None
    try:
        f = float(v)
        return int(f) if f == int(f) else round(f, 2)
    except ValueError:
        return None


def years_data(row, year_start_idx, years):
    """Extract {year: value} dict from row."""
    vals = row[year_start_idx:]
    return {years[i]: pv(vals[i]) for i in range(min(len(years), len(vals)))}


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
    if isinstance(obj, list):
        if not obj:
            return '[]'
        items = [f'{sp * (indent + 1)}{to_js(v, indent + 1)}' for v in obj]
        return '[\n' + ',\n'.join(items) + f'\n{sp * indent}]'
    if isinstance(obj, dict):
        if not obj:
            return '{}'
        items = []
        for k, v in obj.items():
            key = json.dumps(k, ensure_ascii=False)
            items.append(f'{sp * (indent + 1)}{key}: {to_js(v, indent + 1)}')
        return '{\n' + ',\n'.join(items) + f'\n{sp * indent}}}'
    return str(obj)


# ═══════════════════════════════════════════════════════
# MI (급성심근경색) PARSERS
# ═══════════════════════════════════════════════════════

def parse_mi_simple_sex(filename, year_offset=6):
    """Parse files with: sex, special_code, item_code, item_name, ...years
    Used for: mi_incidence_rate, mi_30day_fatality, mi_1yr_fatality, mi_cases
    """
    rows = parse_xls(filename)
    header = rows[0]
    years = [h for h in header[year_offset:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        sex_code = r[0]
        sex = SEX_MAP.get(sex_code, sex_code)
        # Check if there's A01/A08 special code (age-standardized)
        special = r[2] if len(r) > 2 else None
        if special == 'A08':
            key = f"{sex}_표준화"
        else:
            key = sex
        result[key] = years_data(r, year_offset, years)
    return result, years


def parse_mi_incidence_rate():
    """mi_incidence_rate.xls: sex × special(전체/표준화) × years"""
    rows = parse_xls('mi_incidence_rate.xls')
    years = [h for h in rows[0][8:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        sex = SEX_MAP.get(r[0], r[0])
        special = r[2]  # A01=전체, A08=표준화
        key = f"{sex}_표준화" if special == 'A08' else sex
        result[key] = years_data(r, 8, years)
    return result, years


def parse_mi_incidence_type():
    """mi_incidence_type.xls: sex × special × onset_type × years"""
    rows = parse_xls('mi_incidence_type.xls')
    years = [h for h in rows[0][8:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        sex = SEX_MAP.get(r[0], r[0])
        onset = ONSET_MAP.get(r[4], r[4])
        key = f"{sex}_{onset}"
        result[key] = years_data(r, 8, years)
    return result, years


def parse_mi_fatality_type():
    """mi_30day_fatality_type.xls: sex × special × onset_type × years"""
    rows = parse_xls('mi_30day_fatality_type.xls')
    years = [h for h in rows[0][8:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        sex = SEX_MAP.get(r[0], r[0])
        onset = ONSET_MAP.get(r[4], r[4])
        key = f"{sex}_{onset}"
        result[key] = years_data(r, 8, years)
    return result, years


def parse_mi_cases():
    """mi_cases.xls: special × sex × years (columns swapped)"""
    rows = parse_xls('mi_cases.xls')
    years = [h for h in rows[0][6:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        sex = SEX_MAP.get(r[2], r[2])
        result[sex] = years_data(r, 6, years)
    return result, years


def parse_mi_30day_fatality():
    """mi_30day_fatality.xls: sex × special × years"""
    rows = parse_xls('mi_30day_fatality.xls')
    years = [h for h in rows[0][6:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        sex = SEX_MAP.get(r[0], r[0])
        result[sex] = years_data(r, 6, years)
    return result, years


def parse_mi_1yr_fatality():
    """mi_1yr_fatality.xls: sex × special × years"""
    rows = parse_xls('mi_1yr_fatality.xls')
    years = [h for h in rows[0][6:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        sex = SEX_MAP.get(r[0], r[0])
        result[sex] = years_data(r, 6, years)
    return result, years


def parse_ami_inhospital():
    """ami_inhospital_30day.xls: sex × basis(환자/입원) × years"""
    rows = parse_xls('ami_inhospital_30day.xls')
    years = [h for h in rows[0][6:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        sex = SEX_MAP.get(r[0], r[0])
        basis = BASIS_MAP.get(r[2], r[2])
        key = f"{sex}_{basis}"
        result[key] = years_data(r, 6, years)
    return result, years


def parse_ami_oecd():
    """ami_oecd_mortality.xls: country × item(T001=원내, T002=입원+외래) × years"""
    rows = parse_xls('ami_oecd_mortality.xls')
    years = [h for h in rows[0][4:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        country_code = r[0]
        country = OECD_MAP.get(country_code, country_code)
        item = r[2]
        # T001=원내 입원기간 기준, T002=입원+외래 기준
        metric = '원내입원' if item == 'T001' else '입원외래'
        if country not in result:
            result[country] = {}
        result[country][metric] = years_data(r, 4, years)
    return result, years


def parse_mi_er_result_region():
    """mi_er_result_region.xls: outcome × region × item × years"""
    rows = parse_xls('mi_er_result_region.xls')
    years = [h for h in rows[0][6:] if h and h.strip().isdigit()]
    # item codes: B331=환자수, B332=사망률, etc.
    # Discover items from data
    result = {}
    for r in rows[1:]:
        outcome = OUTCOME_MAP.get(r[0], r[0])
        region = REGION_MAP.get(r[2], r[2])
        item_code = r[4]
        if region not in result:
            result[region] = {}
        if outcome not in result[region]:
            result[region][outcome] = {}
        result[region][outcome][item_code] = years_data(r, 6, years)
    return result, years


def parse_mi_er_result_age():
    """mi_er_result_age.xls: outcome × sex × age × item × years"""
    rows = parse_xls('mi_er_result_age.xls')
    years = [h for h in rows[0][8:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        outcome = OUTCOME_MAP.get(r[0], r[0])
        sex = SEX_MAP2.get(r[2], r[2])
        age = AGE_MAP.get(r[4], r[4])
        item_code = r[6]
        key = f"{sex}_{age}"
        if key not in result:
            result[key] = {}
        if outcome not in result[key]:
            result[key][outcome] = {}
        result[key][outcome][item_code] = years_data(r, 8, years)
    return result, years


def parse_mi_transport_age():
    """mi_transport_age.xls: vehicle × sex × age × item × years"""
    rows = parse_xls('mi_transport_age.xls')
    years = [h for h in rows[0][8:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        vehicle = VEHICLE_MAP.get(r[0], r[0])
        sex = SEX_MAP2.get(r[2], r[2])
        age = AGE_MAP.get(r[4], r[4])
        item_code = r[6]
        if vehicle not in result:
            result[vehicle] = {}
        key = f"{sex}_{age}"
        result[vehicle][key] = years_data(r, 8, years)
    return result, years


def parse_mi_monthly(filename, has_region=True):
    """mi_monthly_region.xls or mi_monthly_age.xls"""
    rows = parse_xls(filename)
    years = [h for h in rows[0][6:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        month = MONTH_MAP.get(r[0], r[0])
        if has_region:
            dim2 = REGION_MAP.get(r[2], r[2])
        else:
            dim2 = r[2]  # age code will be mapped differently
        item_code = r[4]
        if month not in result:
            result[month] = {}
        result[month][dim2] = years_data(r, 6, years)
    return result, years


def parse_mi_monthly_age():
    """mi_monthly_age.xls: month × sex × age × item × years"""
    rows = parse_xls('mi_monthly_age.xls')
    years = [h for h in rows[0][8:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        month = MONTH_MAP.get(r[0], r[0])
        sex = SEX_MAP2.get(r[2], r[2])
        age = AGE_MAP.get(r[4], r[4])
        if month not in result:
            result[month] = {}
        key = f"{sex}_{age}"
        result[month][key] = years_data(r, 8, years)
    return result, years


def parse_mi_arrival_time_age():
    """mi_arrival_time_age.xls: same structure as transport_age"""
    return parse_mi_transport_age()


def parse_mi_death_cause_region():
    """mi_death_cause_region.xls: region × cause × item × years"""
    rows = parse_xls('mi_death_cause_region.xls')
    years = [h for h in rows[0][6:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        region = REGION_R_MAP.get(r[0], r[0])
        cause = DEATH_CAUSE_MAP.get(r[2], r[2])
        if region not in result:
            result[region] = {}
        result[region][cause] = years_data(r, 6, years)
    return result, years


def parse_mi_death_timing(filename, dim2_type='age'):
    """mi_death_timing_age.xls or _region.xls"""
    rows = parse_xls(filename)
    if dim2_type == 'age':
        years = [h for h in rows[0][8:] if h and h.strip().isdigit()]
        result = {}
        for r in rows[1:]:
            sex = SEX_MAP2.get(r[0], r[0])
            age = AGE_MAP.get(r[2], r[2])
            timing = DEATH_TIMING_MAP.get(r[4], r[4])
            key = f"{sex}_{age}"
            if key not in result:
                result[key] = {}
            result[key][timing] = years_data(r, 8, years)
    else:  # region
        years = [h for h in rows[0][6:] if h and h.strip().isdigit()]
        result = {}
        for r in rows[1:]:
            region = REGION_R_MAP.get(r[0], r[0])
            timing = DEATH_TIMING_MAP.get(r[2], r[2])
            if region not in result:
                result[region] = {}
            result[region][timing] = years_data(r, 6, years)
    return result, years


# ═══════════════════════════════════════════════════════
# DM (당뇨병) PARSERS
# ═══════════════════════════════════════════════════════

def parse_dm_simple_sex(filename, year_offset=4):
    """Parse simple sex-stratified DM files (admission, statin, antihtn)"""
    rows = parse_xls(filename)
    years = [h for h in rows[0][year_offset:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        sex = SEX_MAP.get(r[0], r[0])
        result[sex] = years_data(r, year_offset, years)
    return result, years


def parse_dm_amputation(filename):
    """dm_amputation.xls: sex × basis(환자/입원) × years"""
    rows = parse_xls(filename)
    years = [h for h in rows[0][6:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        sex = SEX_MAP.get(r[0], r[0])
        basis = BASIS_MAP.get(r[2], r[2])
        key = f"{sex}_{basis}"
        result[key] = years_data(r, 6, years)
    return result, years


def parse_dm_region(filename):
    """dm_diagnosis_region.xls, dm_treatment_region.xls, dm_eye_exam.xls, etc.
    region(numeric) × item(CR=율, CR_SE=표준오차, N=대상자수) × years
    """
    rows = parse_xls(filename)
    years = [h for h in rows[0][4:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        region_code = r[0]
        region = REGION_NUM_MAP.get(region_code, region_code)
        item = r[2]  # CR, CR_SE, N
        if item == 'CR_SE':
            continue  # Skip standard errors for now
        metric = '율' if item == 'CR' else '대상자수'
        if region not in result:
            result[region] = {}
        result[region][metric] = years_data(r, 4, years)
    return result, years


def parse_dm_disabled():
    """dm_disabled.xls: special_category × sub × items(multiple) × years"""
    rows = parse_xls('dm_disabled.xls')
    years = [h for h in rows[0][6:] if h and h.strip().isdigit()]
    result = {}
    for r in rows[1:]:
        category = DM_SPECIAL_MAP.get(r[0], r[0])
        sub = DM_DISABLED_SUB.get(r[2], r[2])
        item = r[4]  # T001=등록인원, T002=장애인원, T003=유병률
        metric_map = {'T001': '등록인원', 'T002': '장애인원', 'T003': '유병률'}
        metric = metric_map.get(item, item)
        key = f"{category}_{sub}"
        if key not in result:
            result[key] = {}
        result[key][metric] = years_data(r, 6, years)
    return result, years


# ═══════════════════════════════════════════════════════
# GENERATE JS FILES
# ═══════════════════════════════════════════════════════

def generate_mi_kosis():
    """Generate mi_kosis.js from all MI KOSIS data."""
    print("\n═══ MI (급성심근경색) ═══")

    print("  Parsing mi_incidence_rate...")
    incidence_rate, _ = parse_mi_incidence_rate()

    print("  Parsing mi_incidence_type...")
    incidence_type, _ = parse_mi_incidence_type()

    print("  Parsing mi_cases...")
    cases, _ = parse_mi_cases()

    print("  Parsing mi_30day_fatality...")
    fatality_30d, _ = parse_mi_30day_fatality()

    print("  Parsing mi_30day_fatality_type...")
    fatality_30d_type, _ = parse_mi_fatality_type()

    print("  Parsing mi_1yr_fatality...")
    fatality_1yr, _ = parse_mi_1yr_fatality()

    print("  Parsing ami_inhospital_30day...")
    inhospital, _ = parse_ami_inhospital()

    print("  Parsing ami_oecd_mortality...")
    oecd, _ = parse_ami_oecd()

    print("  Parsing mi_er_result_region...")
    er_region, _ = parse_mi_er_result_region()

    print("  Parsing mi_monthly_region...")
    monthly_region, _ = parse_mi_monthly('mi_monthly_region.xls', has_region=True)

    print("  Parsing mi_monthly_age...")
    monthly_age, _ = parse_mi_monthly_age()

    print("  Parsing mi_death_cause_region...")
    death_cause, _ = parse_mi_death_cause_region()

    print("  Parsing mi_death_timing_region...")
    death_timing_region, _ = parse_mi_death_timing('mi_death_timing_region.xls', 'region')

    print("  Parsing mi_death_timing_age...")
    death_timing_age, _ = parse_mi_death_timing('mi_death_timing_age.xls', 'age')

    # Skip large er_result_age, transport_age, arrival_time_age for now
    # (very large, 176-251 rows × years — process when needed)

    js = f"""// Auto-generated from KOSIS XLS files by parse_all_kosis.py
// Source: KOSIS 심뇌혈관질환통계 (orgId=411)
// Generated: 2026-03-27

export const MI_KOSIS = {{
  // 발생률 (명/10만명 당) — 성별, 표준화 포함
  incidenceRate: {to_js(incidence_rate, 1)},

  // 발생률 — 발생유형별 (첫발생/재발생)
  incidenceType: {to_js(incidence_type, 1)},

  // 환자 수 (명)
  cases: {to_js(cases, 1)},

  // 30일 치명률 (%)
  fatality30d: {to_js(fatality_30d, 1)},

  // 30일 치명률 — 발생유형별
  fatality30dType: {to_js(fatality_30d_type, 1)},

  // 1년 치명률 (%)
  fatality1yr: {to_js(fatality_1yr, 1)},

  // 원내 30일 사망률 (%) — 환자/입원 단위
  inhospital30d: {to_js(inhospital, 1)},

  // OECD 비교 — 국가별 원내/입원외래 30일 사망률
  oecdMortality: {to_js(oecd, 1)},

  // 응급진료결과 × 시도별 (환자수)
  erResultRegion: {to_js(er_region, 1)},

  // 월별 × 시도별 환자수
  monthlyRegion: {to_js(monthly_region, 1)},

  // 월별 × 성별·연령별 환자수
  monthlyAge: {to_js(monthly_age, 1)},

  // 퇴원 후 사망원인 × 시도별
  deathCauseRegion: {to_js(death_cause, 1)},

  // 퇴원 후 사망시점 × 시도별
  deathTimingRegion: {to_js(death_timing_region, 1)},

  // 퇴원 후 사망시점 × 성별·연령별
  deathTimingAge: {to_js(death_timing_age, 1)},

  source: 'KOSIS 심뇌혈관질환통계 (orgId=411), 2008-2023. 접근일: 2026-03-27',
}};
"""
    out = OUT_DIR / 'mi_kosis.js'
    out.write_text(js, encoding='utf-8')
    print(f"  → Written {out} ({len(js):,} bytes)")
    return js


def generate_dm_kosis():
    """Generate dm_kosis.js from all DM KOSIS data."""
    print("\n═══ DM (당뇨병) ═══")

    print("  Parsing dm_admission...")
    admission, _ = parse_dm_simple_sex('dm_admission.xls')

    print("  Parsing dm_amputation (전체)...")
    amputation, _ = parse_dm_amputation('dm_amputation.xls')

    print("  Parsing dm_major_amputation...")
    major_amp, _ = parse_dm_amputation('dm_major_amputation.xls')

    print("  Parsing dm_minor_amputation...")
    minor_amp, _ = parse_dm_amputation('dm_minor_amputation.xls')

    print("  Parsing dm_statin_rx...")
    statin, _ = parse_dm_simple_sex('dm_statin_rx.xls')

    print("  Parsing dm_antihtn_rx...")
    antihtn, _ = parse_dm_simple_sex('dm_antihtn_rx.xls')

    print("  Parsing dm_diagnosis_region...")
    dx_region, _ = parse_dm_region('dm_diagnosis_region.xls')

    print("  Parsing dm_treatment_region...")
    tx_region, _ = parse_dm_region('dm_treatment_region.xls')

    print("  Parsing dm_eye_exam...")
    eye_exam, _ = parse_dm_region('dm_eye_exam.xls')

    print("  Parsing dm_kidney_exam...")
    kidney_exam, _ = parse_dm_region('dm_kidney_exam.xls')

    print("  Parsing dm_smoking_male...")
    smoking, _ = parse_dm_region('dm_smoking_male.xls')

    print("  Parsing dm_disabled...")
    disabled, _ = parse_dm_disabled()

    js = f"""// Auto-generated from KOSIS XLS files by parse_all_kosis.py
// Source: KOSIS 건강보험심사평가원 당뇨병 적정성 평가
// Generated: 2026-03-27

export const DM_KOSIS = {{
  // 입원율 (인구 십만명당 명) — 성별
  admission: {to_js(admission, 1)},

  // 절단율 (인구 십만명당 명) — 성별 × 환자/입원 단위
  amputation: {to_js(amputation, 1)},

  // 대절단율
  majorAmputation: {to_js(major_amp, 1)},

  // 소절단율
  minorAmputation: {to_js(minor_amp, 1)},

  // 스타틴 처방률 (%) — 성별
  statinRx: {to_js(statin, 1)},

  // 항고혈압제 처방률 (%) — 성별
  antihtnRx: {to_js(antihtn, 1)},

  // 진단율 (%) — 시도별 (율 + 대상자수)
  diagnosisRegion: {to_js(dx_region, 1)},

  // 치료율 (%) — 시도별
  treatmentRegion: {to_js(tx_region, 1)},

  // 안저검사율 (%) — 시도별
  eyeExamRegion: {to_js(eye_exam, 1)},

  // 신장검사율 (%) — 시도별
  kidneyExamRegion: {to_js(kidney_exam, 1)},

  // 남성 흡연율 (%) — 시도별
  smokingMaleRegion: {to_js(smoking, 1)},

  // 장애인 당뇨 유병률
  disabled: {to_js(disabled, 1)},

  source: 'KOSIS 건강보험심사평가원 당뇨병 적정성 평가, 2008-2023. 접근일: 2026-03-27',
}};
"""
    out = OUT_DIR / 'dm_kosis.js'
    out.write_text(js, encoding='utf-8')
    print(f"  → Written {out} ({len(js):,} bytes)")
    return js


def generate_hf_kosis():
    """Generate hf_kosis.js from HF KOSIS data."""
    print("\n═══ HF (심부전) ═══")

    print("  Parsing hf_admission...")
    admission, _ = parse_dm_simple_sex('hf_admission.xls')

    js = f"""// Auto-generated from KOSIS XLS files by parse_all_kosis.py
// Source: KOSIS 건강보험심사평가원 심부전 적정성 평가
// Generated: 2026-03-27

export const HF_KOSIS = {{
  // 입원율 (인구 십만명당 명) — 성별
  admission: {to_js(admission, 1)},

  source: 'KOSIS 건강보험심사평가원 심부전 적정성 평가, 2008-2023. 접근일: 2026-03-27',
}};
"""
    out = OUT_DIR / 'hf_kosis.js'
    out.write_text(js, encoding='utf-8')
    print(f"  → Written {out} ({len(js):,} bytes)")
    return js


if __name__ == '__main__':
    generate_mi_kosis()
    generate_dm_kosis()
    generate_hf_kosis()
    print("\n✅ All done!")
