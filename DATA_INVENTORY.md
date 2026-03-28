# K-HealthMap 데이터 인벤토리

**마지막 업데이트**: 2026-03-27
**총 파일**: ~202개 (PDF 93+, XLS 66, JSON 14, JS 18, ZIP 11)

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
| KOSIS 뇌졸중 | 35 | 2014-2024 | 통계청 | 뇌졸중/심혈관 |
| KOSIS MI | 17 | 2019-2024 | 통계청 | 심혈관 |
| KOSIS 당뇨 | 12 | 2019-2024 | 통계청 | 당뇨 |
| KOSIS HF | 1 | 2019-2024 | 통계청 | 심혈관 |
| KOSIS CKD | 0 | - | 통계청 | 콩팥 (API 오류) |

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

## 7. KOSIS API — 뇌졸중 (총 35개 XLS)

### 기존 (6개, 뇌졸중 전체)
stroke_patients / stroke_region_incidence / stroke_region_type / stroke_treatment / stroke_transport / mortality_by_region

### 뇌졸중 전체 (13개, 2014-2021)
| 파일 | 내용 | 크기 |
|---|---|---|
| stroke_er_result_age.xls | 응급진료결과 (성별,연령별) | 211KB |
| stroke_er_result_region.xls | 응급진료결과 (시도별) | 136KB |
| stroke_transport_age.xls | 내원수단 (성별,연령별) | 301KB |
| stroke_transport_region.xls | 내원수단 (시도별) | 193KB |
| stroke_arrival_time_age.xls | 도착소요시간 (성별,연령별) | 216KB |
| stroke_arrival_time_region.xls | 도착소요시간 (시도별) | 139KB |
| stroke_monthly_age.xls | 월별 환자수 (성별,연령별) | 518KB |
| stroke_monthly_region.xls | 월별 환자수 (시도별) | 243KB |
| stroke_death_place_age.xls | 사망장소 (성별,연령별) | 209KB |
| stroke_death_place_region.xls | 사망장소 (시도별) | 121KB |
| stroke_death_cause_region.xls | 퇴원후 사망원인 (시도별) | 205KB |
| stroke_death_timing_age.xls | 병원내 사망시점 (성별,연령별) | 124KB |
| stroke_death_timing_region.xls | 병원내 사망시점 (시도별) | 72KB |

### 허혈성 뇌졸중 (8개, 2022-2024)
| 파일 | 내용 |
|---|---|
| isch_er_result_age.xls | 응급진료결과 (성별,연령별) |
| isch_er_result_region.xls | 응급진료결과 (시도별) |
| isch_transport_age.xls | 내원수단 (성별,연령별) |
| isch_transport_region.xls | 내원수단 (시도별) |
| isch_arrival_time_age.xls | 도착소요시간 (성별,연령별) |
| isch_arrival_time_region.xls | 도착소요시간 (시도별) |
| isch_monthly_age.xls | 월별 환자수 (성별,연령별) |
| isch_monthly_region.xls | 월별 환자수 (시도별) |

### 출혈성 뇌졸중 (8개, 2022-2024)
| 파일 | 내용 |
|---|---|
| hem_er_result_age.xls | 응급진료결과 (성별,연령별) |
| hem_er_result_region.xls | 응급진료결과 (시도별) |
| hem_transport_age.xls | 내원수단 (성별,연령별) |
| hem_transport_region.xls | 내원수단 (시도별) |
| hem_arrival_time_age.xls | 도착소요시간 (성별,연령별) |
| hem_arrival_time_region.xls | 도착소요시간 (시도별) |
| hem_monthly_age.xls | 월별 환자수 (성별,연령별) |
| hem_monthly_region.xls | 월별 환자수 (시도별) |

### 처리 → stroke_kosis.js (770KB)
- 뇌졸중 전체 (2014-2021): 응급진료결과, 내원수단, 도착시간, 월별 — 성별·연령별 + 시도별
- 허혈성 (2022-2024): 동일 8개 차원
- 출혈성 (2022-2024): 동일 8개 차원
- 사망 (2017): 장소, 원인, 시점 — 성별·연령별 + 시도별
- 기존: 시도별 환자수, 이송시간 그룹화, 응급진료결과별

---

## 8. KOSIS API — 급성심근경색 (MI) ⭐ NEW

| 파일 | 내용 | 크기 | 탭 |
|---|---|---|---|
| mi_incidence_rate.xls | 발생률 (연도별) | 12KB | 심혈관 |
| mi_incidence_type.xls | 발생률 (유형별: STEMI/NSTEMI) | 14KB | 심혈관 |
| mi_cases.xls | 환자 수 (연도별) | 9KB | 심혈관 |
| mi_30day_fatality.xls | 30일 치명률 | 8KB | 심혈관 |
| mi_30day_fatality_type.xls | 30일 치명률 (유형별) | 14KB | 심혈관 |
| mi_1yr_fatality.xls | 1년 치명률 | 9KB | 심혈관 |
| ami_inhospital_30day.xls | 원내 30일 사망률 | 14KB | 심혈관 |
| ami_oecd_mortality.xls | OECD 비교 사망률 | 118KB | 심혈관 |
| mi_er_result_region.xls | 응급실 결과 (시도별) | 161KB | 심혈관+종합 |
| mi_er_result_age.xls | 응급실 결과 (연령별) | 247KB | 심혈관 |
| mi_transport_age.xls | 이송시간 (연령별) | 352KB | 심혈관 |
| mi_arrival_time_age.xls | 도착시간 (연령별) | 252KB | 심혈관 |
| mi_monthly_region.xls | 월별 발생 (시도별) | 292KB | 심혈관+종합 |
| mi_monthly_age.xls | 월별 발생 (연령별) | 586KB | 심혈관 |
| mi_death_cause_region.xls | 퇴원 후 사망원인 (시도별) | 205KB | 심혈관 |
| mi_death_timing_region.xls | 퇴원 후 사망시점 (시도별) | 72KB | 심혈관 |
| mi_death_timing_age.xls | 퇴원 후 사망시점 (연령별) | 124KB | 심혈관 |

**소계**: 17개 파일, 2.5MB

---

## 9. KOSIS API — 당뇨병 (DM) ⭐ NEW

| 파일 | 내용 | 크기 | 탭 |
|---|---|---|---|
| dm_admission.xls | 입원율 | 9KB | 당뇨 |
| dm_amputation.xls | 절단율 (전체) | 14KB | 당뇨 |
| dm_major_amputation.xls | 대절단율 | 14KB | 당뇨 |
| dm_minor_amputation.xls | 소절단율 | 14KB | 당뇨 |
| dm_diagnosis_region.xls | 진단율 (시도별) | 137KB | 당뇨+종합 |
| dm_treatment_region.xls | 치료율 (시도별) | 137KB | 당뇨+종합 |
| dm_eye_exam.xls | 안저검사율 (시도별) | 137KB | 당뇨 |
| dm_kidney_exam.xls | 신장검사율 (시도별) | 120KB | 당뇨+콩팥 |
| dm_statin_rx.xls | 스타틴 처방률 | 8KB | 당뇨+심혈관 |
| dm_antihtn_rx.xls | 항고혈압제 처방률 | 8KB | 당뇨+심혈관 |
| dm_smoking_male.xls | 남성 흡연율 (시도별) | 137KB | 당뇨+생활습관 |
| dm_disabled.xls | 장애인 당뇨 | 9KB | 당뇨 |

**소계**: 12개 파일, 744KB

---

## 10. KOSIS API — 심부전 (HF) ⭐ NEW

| 파일 | 내용 | 크기 | 탭 |
|---|---|---|---|
| hf_admission.xls | 입원율 | 9KB | 심혈관 |

**소계**: 1개 파일, 9KB

---

## 11. KOSIS API — 만성콩팥병 (CKD) ⭐ NEW

| 파일 | 내용 | 크기 | 상태 |
|---|---|---|---|
| ckd_prevalence.xls | 유병률 | 124B | ❌ API 오류 (재시도 필요) |

**소계**: 0개 유효 파일 — API 파라미터 수정 후 재다운로드 필요

---

## KOSIS 전체 요약

| 카테고리 | 파일 수 | 용량 | 상태 |
|---|---|---|---|
| 뇌졸중 | 35 | ~5.2MB | ✅ 처리완료 (stroke_kosis.js, 770KB) |
| 급성심근경색 | 17 | 2.5MB | 🟡 다운로드완료, 파싱 필요 |
| 당뇨병 | 12 | 744KB | 🟡 다운로드완료, 파싱 필요 |
| 심부전 | 1 | 9KB | 🟡 다운로드완료, 파싱 필요 |
| 만성콩팥병 | 0 | - | ❌ API 오류 |
| **합계** | **36+7** | **~3.3MB** | |

---

## 탭별 데이터 매핑 (NEW: 8-tab 구조)

| 탭 | 1차 데이터 (인사이트) | KOSIS 신규 | 2차 데이터 (추이) |
|---|---|---|---|
| **종합현황** | province_info, NATIONAL_AVG | mi_er_result_region, dm_diagnosis/treatment_region | trends.js |
| **검진항목** | full_data.js (2024) | — | 건강검진통계연보 Excel |
| **생활습관** | lifestyle_data.js | dm_smoking_male | lifestyle_trends.js |
| **당뇨** | DFS 2024, 합병증 4종, 진료지침 2025 | dm_admission, dm_amputation×3, dm_eye/kidney_exam, dm_statin/antihtn_rx, dm_disabled | DFS 2012-2020 |
| **간건강** | NAFLD FS 2023, MASLD GL 2025, 백서 2024, HBV/HCV/ALD FS | — | 백서 2021, NAFLD GL 2013/2021 |
| **심혈관** | KSR 2024, HF FS 2025, CVD 2022, stroke KOSIS | mi_×17, hf_admission, dm_statin/antihtn_rx | KSR 2012-2023, HF 2020/2022 |
| **콩팥** | ESKD FS 2024, DKD GL 2024, HTN-CKD GL 2025 | dm_kidney_exam, ckd_prevalence(재시도) | KSN News 2018-2021 |
| **네트워크** | disease_epi.js, stroke_ksr.js | — | historical_trends.json |
