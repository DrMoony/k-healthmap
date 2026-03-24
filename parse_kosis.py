"""Parse KOSIS XML Spreadsheet (.xls) files → stroke_kosis.js"""
import xml.etree.ElementTree as ET
import json
import os

KOSIS_DIR = 'factsheets/kosis'
OUT_FILE = 'src/data/stroke_kosis.js'

NS = {'ss': 'urn:schemas-microsoft-com:office:spreadsheet'}

RE_MAP = {
    'RE_11': '서울', 'RE_12': '부산', 'RE_13': '대구', 'RE_14': '인천',
    'RE_15': '광주', 'RE_16': '대전', 'RE_17': '울산', 'RE_18': '세종',
    'RE_21': '경기', 'RE_22': '강원', 'RE_23': '충북', 'RE_24': '충남',
    'RE_25': '전북', 'RE_26': '전남', 'RE_27': '경북', 'RE_28': '경남',
    'RE_29': '제주',
}


def parse_xml_xls(filepath):
    """Parse XML Spreadsheet and return list of rows (each row = list of cell strings)."""
    # KOSIS files have leading tabs on each line — strip them
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    # Strip leading/trailing whitespace from each line, rejoin
    lines = [line.strip() for line in content.split('\n')]
    clean_xml = '\n'.join(lines)
    root = ET.fromstring(clean_xml)
    worksheet = root.find('.//ss:Worksheet', NS)
    table = worksheet.find('ss:Table', NS)
    rows = []
    for row_el in table.findall('ss:Row', NS):
        cells = []
        for cell_el in row_el.findall('ss:Cell', NS):
            data_el = cell_el.find('ss:Data', NS)
            if data_el is not None:
                cells.append(data_el.text or '')
            else:
                cells.append('')
        rows.append(cells)
    return rows


def parse_region_incidence():
    """stroke_region_incidence.xls: cols = [진료결과코드, 진료결과, 지역코드, 지역명, 항목코드, 항목명, 2022, 2023, 2024]"""
    rows = parse_xml_xls(os.path.join(KOSIS_DIR, 'stroke_region_incidence.xls'))
    header = rows[0]
    years = [h for h in header if h.isdigit()]

    result = {}         # total by region (OT_20 = 계)
    result_detail = {}   # by outcome type × region
    for row in rows[1:]:
        if len(row) < len(header):
            continue
        ot_code = row[0]
        ot_label = row[1]
        region_code = row[2]
        if region_code not in RE_MAP:
            continue
        province = RE_MAP[region_code]
        year_vals = {}
        for i, yr in enumerate(years):
            val = row[6 + i]
            try:
                year_vals[int(yr)] = int(float(val))
            except (ValueError, IndexError):
                year_vals[int(yr)] = None

        if ot_code == 'OT_20':
            result[province] = year_vals
        else:
            if ot_label not in result_detail:
                result_detail[ot_label] = {}
            result_detail[ot_label][province] = year_vals

    return result, result_detail, years


def parse_transport():
    """stroke_transport.xls: cols = [소요시간코드, 소요시간, 지역코드, 지역명, 항목코드, 항목명, 2022, 2023, 2024]"""
    rows = parse_xml_xls(os.path.join(KOSIS_DIR, 'stroke_transport.xls'))
    header = rows[0]
    years = [h for h in header if h.isdigit()]

    # Collect time categories and region data
    result = {}  # {time_label: {province: {year: val}}}
    time_labels = {}  # code -> label

    for row in rows[1:]:
        if len(row) < len(header):
            continue
        time_code = row[0]
        time_label = row[1]
        region_code = row[2]

        time_labels[time_code] = time_label

        if region_code not in RE_MAP:
            # Also capture 전체 (RE_00)
            if region_code == 'RE_00':
                province = '전체'
            else:
                continue
        else:
            province = RE_MAP[region_code]

        if time_label not in result:
            result[time_label] = {}

        year_vals = {}
        for i, yr in enumerate(years):
            val = row[6 + i]
            try:
                year_vals[int(yr)] = int(float(val))
            except (ValueError, IndexError):
                year_vals[int(yr)] = None
        result[time_label][province] = year_vals

    return result, years


def parse_patients():
    """stroke_patients.xls: cols = [진료결과코드, 진료결과, 성별코드, 성별, 연령코드, 연령, 항목코드, 항목명, yr1, yr2, yr3]"""
    rows = parse_xml_xls(os.path.join(KOSIS_DIR, 'stroke_patients.xls'))
    header = rows[0]
    years = [h for h in header if h.isdigit()]

    result = {}  # {gender: {age_group: {year: val}}}
    for row in rows[1:]:
        if len(row) < len(header):
            continue
        gender_label = row[3]
        age_label = row[5]

        year_vals = {}
        for i, yr in enumerate(years):
            idx = 8 + i
            if idx < len(row):
                val = row[idx]
                try:
                    year_vals[int(yr)] = int(float(val))
                except ValueError:
                    year_vals[int(yr)] = None
            else:
                year_vals[int(yr)] = None

        if gender_label not in result:
            result[gender_label] = {}
        result[gender_label][age_label] = year_vals

    return result, years


def parse_treatment():
    """stroke_treatment.xls: cols = [수단코드, 수단, 성별코드, 성별, 연령코드, 연령, 항목코드, 항목명, yr1, yr2, yr3]"""
    rows = parse_xml_xls(os.path.join(KOSIS_DIR, 'stroke_treatment.xls'))
    header = rows[0]
    years = [h for h in header if h.isdigit()]

    result = {}  # {vehicle_label: {gender: {age_group: {year: val}}}}
    for row in rows[1:]:
        if len(row) < len(header):
            continue
        vehicle_label = row[1]
        gender_label = row[3]
        age_label = row[5]

        year_vals = {}
        for i, yr in enumerate(years):
            idx = 8 + i
            if idx < len(row):
                val = row[idx]
                try:
                    year_vals[int(yr)] = int(float(val))
                except ValueError:
                    year_vals[int(yr)] = None
            else:
                year_vals[int(yr)] = None

        if vehicle_label not in result:
            result[vehicle_label] = {}
        if gender_label not in result[vehicle_label]:
            result[vehicle_label][gender_label] = {}
        result[vehicle_label][gender_label][age_label] = year_vals

    return result, years


def parse_region_type():
    """stroke_region_type.xls: cols = [소요시간코드, 소요시간, 성별코드, 성별, 연령코드, 연령, 항목코드, 항목명, yr1, yr2, yr3]"""
    rows = parse_xml_xls(os.path.join(KOSIS_DIR, 'stroke_region_type.xls'))
    header = rows[0]
    years = [h for h in header if h.isdigit()]

    result = {}  # {time_label: {gender: {age_group: {year: val}}}}
    for row in rows[1:]:
        if len(row) < len(header):
            continue
        time_label = row[1]
        gender_label = row[3]
        age_label = row[5]

        year_vals = {}
        for i, yr in enumerate(years):
            idx = 8 + i
            if idx < len(row):
                val = row[idx]
                try:
                    year_vals[int(yr)] = int(float(val))
                except ValueError:
                    year_vals[int(yr)] = None
            else:
                year_vals[int(yr)] = None

        if time_label not in result:
            result[time_label] = {}
        if gender_label not in result[time_label]:
            result[time_label][gender_label] = {}
        result[time_label][gender_label][age_label] = year_vals

    return result, years


def to_js(obj, indent=2):
    """Convert Python dict to JS-friendly JSON string."""
    return json.dumps(obj, ensure_ascii=False, indent=indent)


def main():
    print('Parsing stroke_region_incidence.xls...')
    region_patients, region_by_outcome, rp_years = parse_region_incidence()
    print(f'  {len(region_patients)} provinces, years: {rp_years}')
    print(f'  {len(region_by_outcome)} outcome categories: {list(region_by_outcome.keys())}')

    print('Parsing stroke_transport.xls...')
    transport, tr_years = parse_transport()
    print(f'  {len(transport)} time categories, years: {tr_years}')
    for k in transport:
        print(f'    {k}: {len(transport[k])} regions')

    print('Parsing stroke_patients.xls...')
    patients, pt_years = parse_patients()
    print(f'  {len(patients)} genders, years: {pt_years}')

    print('Parsing stroke_treatment.xls...')
    treatment, tx_years = parse_treatment()
    print(f'  {len(treatment)} vehicle types, years: {tx_years}')

    print('Parsing stroke_region_type.xls...')
    region_type, rt_years = parse_region_type()
    print(f'  {len(region_type)} time categories, years: {rt_years}')

    # Build JS output
    js_lines = []
    js_lines.append('// Auto-generated from KOSIS XLS files by parse_kosis.py')
    js_lines.append('// Source: KOSIS 심뇌혈관질환통계 (orgId=411)')
    js_lines.append('')
    js_lines.append('export const STROKE_KOSIS = {')

    # 1. regionPatients
    js_lines.append(f'  // 시도별 허혈성 뇌졸중 환자수 ({", ".join(rp_years)})')
    js_lines.append(f'  regionPatients: {to_js(region_patients)},')
    js_lines.append('')

    # 1b. regionByOutcome (응급진료결과별 × 시도별)
    js_lines.append(f'  // 응급진료결과별 × 시도별 환자수 ({", ".join(rp_years)})')
    js_lines.append(f'  regionByOutcome: {to_js(region_by_outcome)},')
    js_lines.append('')

    # 2. transportByRegion
    js_lines.append(f'  // 이송 소요시간별 × 시도별 환자수 ({", ".join(tr_years)})')
    js_lines.append(f'  transportByRegion: {to_js(transport)},')
    js_lines.append('')

    # 3. byGenderAge
    js_lines.append(f'  // 성별 × 연령별 환자수 ({", ".join(pt_years)})')
    js_lines.append(f'  byGenderAge: {to_js(patients)},')
    js_lines.append('')

    # 4. byTreatment (내원수단별)
    js_lines.append(f'  // 내원수단별 × 성별 × 연령별 환자수 ({", ".join(tx_years)})')
    js_lines.append(f'  byTreatment: {to_js(treatment)},')
    js_lines.append('')

    # 5. transportByGenderAge
    js_lines.append(f'  // 소요시간별 × 성별 × 연령별 환자수 ({", ".join(rt_years)})')
    js_lines.append(f'  transportByGenderAge: {to_js(region_type)},')
    js_lines.append('')

    js_lines.append("  source: 'KOSIS 심뇌혈관질환통계 (orgId=411), 2019-2024',")
    js_lines.append('};')

    os.makedirs(os.path.dirname(OUT_FILE), exist_ok=True)
    with open(OUT_FILE, 'w', encoding='utf-8') as f:
        f.write('\n'.join(js_lines) + '\n')

    print(f'\nWrote {OUT_FILE}')

    # Print region patients for verification
    print('\n== Region Patients (2023) ==')
    for prov in ['서울', '부산', '대구', '인천', '광주', '대전', '울산', '세종',
                 '경기', '강원', '충북', '충남', '전북', '전남', '경북', '경남', '제주']:
        if prov in region_patients:
            vals = region_patients[prov]
            print(f'  {prov}: {vals}')


if __name__ == '__main__':
    main()
