# K-HealthMap 데이터 인벤토리

**마지막 업데이트**: 2026-03-27
**총 파일**: ~142개 (PDF 93+, XLS 6, JSON 14, JS 18, ZIP 11)

## 요약

| 카테고리 | 파일 수 | 연도 범위 | 주요 출처 | 대시보드 탭 |
|---|---|---|---|---|
| 당뇨 | 12 | 2012-2025 | KDA | 당뇨 |
| 간 | 16 | 2013-2025 | KASL | 간건강 |
| 심혈관 | 8 | 2018-2025 | KDCA, KSHF | 심혈관 |
| 콩팥 | 18+ | 2012-2026 | KSN | 콩팥 |
| 고혈압 | 9 | 2018-2025 | KSH | 심혈관/종합 |
| 이상지질혈증 | 2 | 2024 | KSoLA | 심혈관 |
| 뇌졸중 | 11 | 2012-2024 | KSR | 심혈관 |
| 비만 | 1 | 2025 | KOSSO | 당뇨/종합 |
| 건강검진통계 | 23 | 2011-2024 | NHIS | 검진항목 |
| KOSIS API | 6+7 | 2019-2024 | 통계청 | 뇌졸중 |

## 활용 원칙
- **2020년 이후**: inference/인사이트 주요 기준 데이터
- **2020년 이전**: 추이 분석용 단면 데이터만 활용

---

## 1. 당뇨병 (Diabetes) — 탭: 당뇨

### 팩트시트 (연도별)
| 파일 | 연도 | 언어 | 활용 | 핵심 |
|---|---|---|---|---|
| DiabetesFactSheet2012_en.pdf | 2012 | EN | 추이 | baseline |
| DiabetesFactSheet_2013111.pdf | 2013 | KO | 추이 | |
| diabetes_factsheet_2016.pdf | 2016 | KO | 추이 | |
| DMJ-FACT SHEET 2016.pdf | 2016 | EN | 추이 | DMJ 논문 |
| DMJ-FACT SHEET 2018.pdf | 2018 | EN | 추이 | |
| DIABETES fact sheet 2018 Eng.pdf | 2018 | EN | 추이 | |
| DMJ-FACT SHEET 2020.pdf | 2020 | EN | 인사이트 | |
| 당뇨FS2020 eng.pdf | 2020 | EN | 인사이트 | |
| factsheet_2021.pdf | 2021 | - | 인사이트 | |
| DFS 2024 eng.pdf | 2024 | EN | **주요** | 15.5%, 530만 |
| DFS 2025 비만·임신.pdf | 2025 | KO | 참고 | 특수 주제 |
| 2025 당뇨병 진료지침.pdf | 2025 | KO | 참고 | 치료 가이드 |

### 합병증 (2018 DMJ)
| 파일 | 핵심 | 활용 |
|---|---|---|
| 2018-Cardiovascular.pdf | 당뇨+CVD 위험 | ⭐ 당뇨→심혈관 |
| 2018-ESKD.pdf | 당뇨+말기신부전 | ⭐ 당뇨→콩팥 |
| 2018-Neuropathy.pdf | 당뇨+신경병증 | ⭐ 합병증 |
| 2018-Retinopathy.pdf | 당뇨+망막병증 | ⭐ 합병증 |
| Diabetes & Complication 리플렛.pdf | 합병증 요약 | 참고 |

### 처리된 데이터
| 파일 | 내용 | 페이지 |
|---|---|---|
| diabetes_2024.json | 유병률/인지/치료/조절 | DiseaseNetwork |
| disease_epi.js (diabetes) | 시계열+관리캐스케이드 | 전체 |

---

## 2. 간 질환 (Liver) — 탭: 간건강

### MASLD/NAFLD
| 파일 | 연도 | 핵심 |
|---|---|---|
| 2013 NAFLD guideline.pdf | 2013 | 초기 가이드라인 (추이) |
| 2013 NAFLD 논문.pdf | 2013 | (추이) |
| NAFLD 가이드라인 2021.pdf | 2021 | 인사이트 |
| **NAFLD FACT SHEET 2023.pdf** | 2023 | ⭐ 핵심 역학 |
| **MASLD 가이드라인 2025.pdf** | 2025 | ⭐ 최신 치료지침 |

### HBV/HCV/ALD
| 파일 | 연도 | 핵심 |
|---|---|---|
| HBV 팩트시트 2023.pdf | 2023 | B형간염 역학 |
| HCV 팩트시트 2021.pdf | 2021 | C형간염 역학 |
| 알코올 간질환 FS 2023.pdf | 2023 | ALD 역학 |
| B형간염 가이드라인 2022.pdf | 2022 | 치료 |
| C형간염 가이드라인 2025.pdf | 2025 | DAA 치료 |
| 자가면역간염 가이드라인 2022.pdf | 2022 | AIH |

### 간질환 백서
| 파일 | 연도 | 핵심 |
|---|---|---|
| 한국인 간질환 백서 1부.pdf | - | 전체 역학 |
| 한국인 간질환 백서 2부 1장 간염.pdf | - | HBV/HCV |
| 한국인 간질환 백서 2부 2장 알코올/비알코올.pdf | - | ALD+NAFLD |
| 한국인 간질환 백서 2부 3장 간암/간이식.pdf | - | HCC+LT |
| 간질환 백서 2021.pdf | 2021 | 인사이트 |
| 간질환 백서 2023 Update.pdf | 2023 | 인사이트 |
| **간질환 백서 2024 Update.pdf** | 2024 | ⭐ 최신 |

### 간섬유화
| 파일 | 연도 |
|---|---|
| 간섬유화 비침습검사 가이드라인 2024.pdf | 2024 |
| 간섬유화 체계적 문헌고찰 (별책).pdf | 2024 |

### 처리된 데이터
| 파일 | 내용 |
|---|---|
| nafld_2023.json | 유병률, 동반질환, 진행, 비용 |
| disease_epi.js (nafld/masld) | 시계열+동반질환+2yr진행 |

---

## 3. 심혈관 (Cardiovascular) — 탭: 심혈관

### 심부전
| 파일 | 연도 | 핵심 |
|---|---|---|
| HF FACT SHEET 2020.pdf | 2020 | 추이 |
| 2022 Korean HF Fact Sheet.pdf | 2022 | 인사이트 |
| **HF Fact Sheet 2025 영문.pdf** | 2025 | ⭐ 최신 |

### 이상지질혈증
| 파일 | 연도 | 핵심 |
|---|---|---|
| dyslipidemia_factsheet_2024.pdf | 2024 | 유병률 48.4% |

### 뇌졸중 — KSR 레지스트리
| 파일 | 연도 |
|---|---|
| KSR 2024 Fact Sheet.pdf | 2024 ⭐ |
| KSR Annual Report 2024.pdf | 2024 |
| KSR Annual Report 2023.pdf | 2023 |
| KSR Annual Report 2022.pdf | 2022 |
| KSR Annual Report 2020.pdf | 2020 |
| CRCS-K-NIHKSR-221221.pdf | 2022 |
| CRCS-K Statistics 2018.pdf | 2018 |
| CRCS-5 Statistics 2014.pdf | 2014 |
| CRCS-5 Statistics 2013.pdf | 2013 |
| CRCS-5 Statistics 2012.pdf | 2012 |
| Statistics 2016 report.pdf | 2016 |

### 처리된 데이터
| 파일 | 내용 |
|---|---|
| cardiovascular_2022.json | MI/뇌졸중 발생/사망 |
| stroke_ksr.js | KSR 레지스트리 |
| stroke_kosis.js | KOSIS 시도별 |

---

## 4. 콩팥 (Kidney) — 탭: 콩팥

### 팩트시트
| 파일 | 연도 | 핵심 |
|---|---|---|
| **말기콩팥병 팩트시트 2024.pdf** | 2024 | ⭐ ESKD |
| 2024 KSN 봄호 Factsheet.pdf | 2024 | CKD 최신 |
| 2021 KSN 여름호 Factsheet.pdf | 2021 | CKD 추이 |
| KSN News 11-21호 (2018-2021) | 2018-2021 | 연도별 추이 |

### 진료지침
| 파일 | 연도 | 핵심 |
|---|---|---|
| **당뇨병콩팥병 진료지침 2024.pdf** | 2024 | ⭐ DKD |
| 당뇨병콩팥병 진료지침 2023.pdf | 2023 | DKD |
| **고혈압콩팥병 진료지침 2025.pdf** | 2025 | ⭐ HTN+CKD |
| 노인 만성콩팥병 진료지침 2026.pdf | 2026 | 고령 CKD |
| 노인말기콩팥병 진료지침 2023.pdf | 2023 | 고령 ESKD |
| 만성콩팥병 임상진료지침.pdf | - | CKD |
| 투석전문의 factsheet 2024.pdf | 2024 | 투석 현황 |
| 혈액투석 진료지침 2021.pdf | 2021 | HD |
| CKRT 진료지침.pdf | - | 급성 |
| 혈관통로 진료지침.pdf | - | VA |
| 복막투석 복막염 진료지침 2012.pdf | 2012 | PD |
| 저나트륨혈증 진료지침.pdf | 2022 | |
| 알포트 증후군 권고안 2025.pdf | 2025 | |
| 인공신장실 감염관리/재난매뉴얼 | - | |

---

## 5. 고혈압 (Hypertension) — 연도별 시리즈

| 파일 | 연도 | 언어 | 핵심 |
|---|---|---|---|
| 2018 Fact Sheet.pdf | 2018 | KO | 추이 baseline |
| 2019 팩트시트.pdf | 2019 | KO | 추이 |
| 2020 팩트시트.pdf | 2020 | KO | COVID 영향 |
| 2021 팩트시트 영문.pdf | 2021 | EN | |
| 2022 팩트시트 + 진료지침.pdf | 2022 | KO | 인사이트 |
| 2023 팩트시트.pdf | 2023 | KO | 인사이트 |
| 2024 팩트시트.pdf | 2024 | KO | 인사이트 |
| **2025 팩트시트.pdf** | 2025 | KO | ⭐ 최신 |

---

## 6. 건강검진통계연보 (NHIS)

### PDF (2011-2022)
13개 연도 + 지침서 1개

### Excel ZIP (2015-2024)
10개 연도 — **미사용, 향후 추출 가능**

### 처리된 데이터
| 파일 | 내용 |
|---|---|
| full_data.js (79KB) | 41개 검진항목 × 17시도 × 15연령 |
| lifestyle_data.js | 흡연/음주/운동 |

---

## 7. KOSIS API

### XLS (6개)
stroke_patients / stroke_region_incidence / stroke_region_type / stroke_treatment / stroke_transport / mortality_by_region

### 처리 → stroke_kosis.js
시도별 환자수, 이송시간, 전귀결과 (2022-2024)

---

## 탭별 데이터 매핑

| 탭 | 1차 데이터 (인사이트) | 2차 데이터 (추이) |
|---|---|---|
| **당뇨** | DFS 2024, 합병증 4종, 진료지침 2025 | DFS 2012-2020 |
| **간건강** | NAFLD FS 2023, MASLD GL 2025, 백서 2024, HBV/HCV/ALD FS | 백서 2021, NAFLD GL 2013/2021 |
| **심혈관** | KSR 2024, HF FS 2025, CVD 2022, KOSIS | KSR 2012-2023, HF 2020/2022 |
| **콩팥** | ESKD FS 2024, DKD GL 2024, HTN-CKD GL 2025 | KSN News 2018-2021 |
| **종합현황** | province_info, NATIONAL_AVG | trends.js |
| **검진항목** | full_data.js (2024) | 건강검진통계연보 Excel |
| **생활습관** | lifestyle_data.js | lifestyle_trends.js |
| **질환네트워크** | disease_epi.js, stroke_ksr.js | historical_trends.json |
