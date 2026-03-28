# K-HealthMap 데이터 스키마 레퍼런스

**마지막 업데이트**: 2026-03-27

모든 데이터 파일의 파라미터 구조. 값은 포함하지 않음 — 구조/키만 정리.

---

## 1. disease_epi.js — 질환별 역학 데이터 (팩트시트 기반)

### DISEASE_EPI.diseases

| 질환 키 | 출처 | 파라미터 |
|---|---|---|
| **obesity** | KOSSO 2025 | `prevalence`, `patients`, `trend`, `trendDetail`, `genderGap`, `ageNote`, `severity`, `severityTrend`, `familyRisk`, `comorbidityOR`, `pediatric`, `agePeak` |
| **diabetes** | KDA DFS 2024 | `prevalence`, `prevalence19plus`, `patients`, `trend`, `trendDetail`, `genderGap`, `ageBreakdown`, `prediabetes`, `management`{awareness/treatment/control}, `hba1cControl`, `integratedControl`, `treatmentApproach`, `obesityInDiabetics`, `lifestyle`, `youngAdults19_39`, `comorbidities` |
| **hypertension** | KSH 2025 | `prevalence`, `patients`, `trend`, `trendDetail`, `management`{awareness/treatment/control}, `ageNote`, `historicalTrend` |
| **dyslipidemia** | KSoLA 2024 | `prevalence`, `prevalenceModified`, `hypercholesterolemia`, `trend`, `trendDetail`, `genderGap`, `typeBreakdown`, `lipidProfiles`, `lipidProfiles2022`, `management`, `comorbidities`, `ldlTargets`, `healthBehaviors`, `historicalTrend` |
| **nafld** (alias: masld) | KASL 2023 FS | `incidence`, `incidenceTrend`, `totalPatients`, `totalPatients2022`, `prevalenceByAge2022`, `trend`, `trendDetail`, `comorbidities2022`, `comorbidityEvolution`, `multiComorbidity`, `costBurden`, `progression10yr_2010baseline`, `mortality10yr`, `medicalCost2022_KRW`, `progression2yr` |
| **mi** | KDCA CVD 2022 | `incidence`, `incidenceTrend`, `trend`, `trendDetail`, `tenYearChange`, `genderTrend`, `genderGap`, `ageRate80plus`, `ageNote`, `mortality` |
| **stroke** | KDCA CVD 2022 | `incidence`, `incidenceTrend`, `trend`, `trendDetail`, `tenYearChange`, `ageStdRateChange`, `ageStdTrend`, `genderGap`, `recurrence`, `ageRate80plus`, `ageNote`, `mortality` |
| **heart_failure** | KSHF 2025 | `prevalence`, `patients`, `trend`, `trendDetail`, `genderGap`, `comorbidities`, `survival`, `hospitalization`, `mortality`, `cost`, `medication`, `incidenceTrend` |
| **ckd** | KSN 2024 | `comorbidityEvolution`, `multiComorbidity`, `costBurden`, `progression10yr_2010baseline`, `mortality10yr`, `medicalCost2022_KRW`, `progression2yr` |
| **lc_hcc** | KASL 백서 | `progression10yr_male`, `progression10yr_female`, `dataQualityNote`, `trend`, `trendDetail` |
| **metabolic_syndrome** | NHIS 검진 | `prevalence`, `screeningAbnormalRate`, `trend`, `trendDetail`, `components`, `regionalPrevalence`, `ageBreakdown`, `covidImpact`, `componentsDetail`, `overall30plus`, `overall65plus` |

### DISEASE_TIMESERIES

| 키 | 내용 | 연도 |
|---|---|---|
| `nafld_incidence` | MASLD 발생률 추이 | 2010-2023 |
| `mi_incidence` | MI 발생률 추이 | 2013-2022 |
| `stroke_incidence` | 뇌졸중 발생률 추이 | 2013-2022 |
| `htn_prevalence` | 고혈압 유병률 | 2007-2022 |
| `htn_awareness` | 고혈압 인지율 | 2007-2022 |
| `dm_prevalence` | 당뇨 유병률 | 2012-2022 |
| `dyslipidemia_prevalence` | 이상지질혈증 유병률 | 2005-2022 |

---

## 2. nafld_2023.json — MASLD 상세 (KASL 팩트시트)

| 섹션 | 파라미터 |
|---|---|
| `section_1_prevalence` | `10_year_prevalence_by_age_and_gender` |
| `section_2_incidence` | `incident_cases_trend_2010_2023`, `incident_rate_by_age_and_gender_percent` |
| `section_3_comorbidities_and_costs` | `single_comorbidity_2012_vs_2022`, `two_comorbidities_*`, `three_*`, `four_*`, `medical_costs_kwr` |
| `section_4_progression_and_mortality` | `malignancy_progression_2yr`, `ischemic_heart_disease_2yr`, `ischemic_stroke_2yr`, `liver_cirrhosis_2yr`, `hcc_2yr`, `10_year_progression_2010`, `mortality_10yr` |

---

## 3. diabetes_2024.json — 당뇨 상세 (KDA DFS 2024)

| 파라미터 | 내용 |
|---|---|
| `prevalence_overall` | 전체 유병률 |
| `prevalence_by_age_group` | 연령별 유병률 |
| `prediabetes` | 전당뇨 |
| `type_1_vs_type_2` | 1형 vs 2형 |
| `awareness_treatment_control` | 인지·치료·조절률 |
| `hba1c_control_distribution` | HbA1c 분포 |
| `treatment_approaches` | 치료 접근법 |
| `comorbidities` | 동반질환 |
| `obesity_metrics` | 비만 지표 |
| `lifestyle_behaviors_diabetic_population` | 생활습관 |
| `dietary_patterns` | 식이 패턴 |

---

## 4. cardiovascular_2022.json — 심뇌혈관 (KDCA)

### myocardial_infarction
`incidence_by_year`, `ten_year_change`, `by_gender_2022`, `by_gender_trend`, `by_age_group_2022`, `mortality`, `first_vs_recurrent_2022`

### stroke
`incidence_by_year`, `ten_year_change`, `age_standardized_rate_change`, `by_gender_2022`, `by_gender_trend`, `by_age_group_2022`, `recurrent_stroke`, `mortality`

---

## 5. KOSIS — stroke_kosis.js (770KB)

```
STROKE_KOSIS
├── regionPatients           // 시도 → {year: 환자수} (2022-2024)
├── regionByOutcome          // 시도 → {퇴가/입원/전원/사망/기타/미상 → {year: 건}}
├── byGenderAge              // 성별 → 연령 → {year: 건} (2019-2021)
├── transportByRegion        // 시도 → {시간대 → {year: 건}} (2022-2024)
├── transportGrouped         // 시도 → {3시간미만/3~6시간/6시간이상/미상} (2023)
│
├── all                      // 뇌졸중 전체 (2014-2021)
│   ├── erResultAge          // {성별_연령} → {outcome → {year: 건}}
│   ├── erResultRegion       // {시도} → {outcome → {year: 건}}
│   ├── transportAge         // {수단} → {성별_연령 → {year: 건}}
│   ├── transportRegion      // {시도} → {수단 → {year: 건}}
│   ├── arrivalTimeAge       // {시간대} → {성별_연령 → {year: 건}}
│   ├── arrivalTimeRegion    // {시도} → {시간대 → {year: 건}}
│   ├── monthlyRegion        // {월} → {시도 → {year: 건}}
│   └── monthlyAge           // {월} → {성별_연령 → {year: 건}}
│
├── ischemic                 // 허혈성 뇌졸중 (2022-2024) — 동일 8개 구조
│   └── (erResultAge, erResultRegion, transportAge, transportRegion,
│        arrivalTimeAge, arrivalTimeRegion, monthlyRegion, monthlyAge)
│
├── hemorrhagic              // 출혈성 뇌졸중 (2022-2024) — 동일 8개 구조
│   └── (동일)
│
└── death                    // 사망 데이터 (2017, 뇌졸중 전체)
    ├── placeAge             // {성별_연령} → {장소 → {year: 명}}
    ├── placeRegion          // {시도} → {장소 → {year: 명}}
    ├── causeRegion          // {시도} → {원인 → {year: 명}}
    ├── timingAge            // {성별_연령} → {시점 → {year: 명}}
    └── timingRegion         // {시도} → {시점 → {year: 명}}
```

**차원값:**
- 성별: 전체, 남자, 여자
- 연령: 계, 1세미만, 1~9세, 10~19세, 20~29세, ... 80세이상, 미상
- 시도: 전체 + 17개 시도 (서울~제주)
- 월: 계, 1월~12월
- 응급결과: 계, 퇴가, 입원, 전원, 사망, 기타, 미상
- 내원수단: 계, 119구급차, 기타구급차, 자차/택시, 도보/기타, 미상
- 도착시간: 계, 1시간미만, 1~2시간, 2~3시간, 3~6시간, 6시간이상, 미상
- 사망장소: 계, 의료기관 내, 의료기관 외, 미상
- 사망원인: 계, 순환기계 질환, 허혈성 심장질환, 뇌혈관 질환, 기타 순환기계, 신생물, 호흡기계, 감염성, 기타
- 사망시점: 계, 입원 당일, 1~6일, 7~29일, 30일 이상

---

## 6. KOSIS — mi_kosis.js (270KB)

```
MI_KOSIS
├── incidenceRate            // {성별[_표준화]} → {year: 율/10만} (2013-2023)
├── incidenceType            // {성별_첫발생|재발생} → {year: 율}
├── cases                    // {성별} → {year: 명}
├── fatality30d              // {성별} → {year: %}
├── fatality30dType          // {성별_첫발생|재발생} → {year: %}
├── fatality1yr              // {성별} → {year: %}
├── inhospital30d            // {성별_환자|입원단위} → {year: %}
├── oecdMortality            // {국가} → {원내입원|입원외래} → {year: %} (36개국)
├── erResultRegion           // {시도} → {outcome → item_code → {year: 건}}
├── monthlyRegion            // {월} → {시도 → {year: 건}} (2014-2023)
├── monthlyAge               // {월} → {성별_연령 → {year: 건}}
├── deathCauseRegion         // {시도} → {원인 → {year: 명}} (2017)
├── deathTimingRegion        // {시도} → {시점 → {year: 명}}
└── deathTimingAge           // {성별_연령} → {시점 → {year: 명}}
```

---

## 7. KOSIS — dm_kosis.js (78KB)

```
DM_KOSIS
├── admission                // {성별} → {year: 율/10만} (2008-2023)
├── amputation               // {성별_환자|입원단위} → {year: 율/10만}
├── majorAmputation          // 대절단 (동일 구조)
├── minorAmputation          // 소절단 (동일 구조)
├── statinRx                 // {성별} → {year: %} (2011-2023)
├── antihtnRx                // {성별} → {year: %}
├── diagnosisRegion          // {17시도} → {율|대상자수} → {year: %|명}
├── treatmentRegion          // {17시도} → {율|대상자수} → {year: %}
├── eyeExamRegion            // {17시도} → {율|대상자수} → {year: %}
├── kidneyExamRegion         // {17시도} → {율|대상자수} → {year: %}
├── smokingMaleRegion        // {17시도} → {율|대상자수} → {year: %}
└── disabled                 // {카테고리_계|장애인} → {등록인원|장애인원|유병률} → {year}
```

---

## 8. KOSIS — hf_kosis.js (1.3KB)

```
HF_KOSIS
└── admission                // {성별} → {year: 율/10만} (2008-2023)
```

---

## 9. province_info.js — 17시도 기본 정보

### NATIONAL_AVG
`grdpPerCapita`, `agingRate`, `tertiaryHospitals`, `doctorsPerThousand`, `unmetMedical`, `smokingRate`, `drinkingRate`, `noExerciseRate`, `lifeExpectancy`, `strokeIncidence`, `strokeMortality`, `tpaRate`, `thrombectomyRate`, `goldenTimeRate`

### PROVINCE_INFO[시도]
`population`, `grdp`, `agingRate`, `tertiaryHospitals`, `doctorsPerThousand`, `unmetMedical`, `smokingRate`, `drinkingRate`, `noExerciseRate`, `lifeExpectancy`, `strokeIncidence`, `strokeMortality`, `tpaRate`, `goldenTimeRate`, `strokePatients2023`, `tertiaryList`

---

## 10. full_data.js (103KB) — 건강검진통계연보

```
FULL_DATA
└── {41개 검진항목} → {17시도} → {15연령구간} → 수치
```
항목 예: 혈색소, 공복혈당, 총콜레스테롤, HDL, LDL, AST, ALT, GGT, 크레아티닌, eGFR, 혈압, BMI, 허리둘레, ...

---

## 11. insights.js — 사전 인사이트 엔진

함수 기반. `getInsight(province, item, lang)` → 해당 시도+항목의 해석 텍스트 반환.
의사밀도 해석 시 미충족의료 데이터 항상 함께 해석.

---

## 공통 차원값 정리

| 차원 | 값 |
|---|---|
| **성별** | 전체, 남자, 여자 |
| **17시도** | 서울, 부산, 대구, 인천, 광주, 대전, 울산, 세종, 경기, 강원, 충북, 충남, 전북, 전남, 경북, 경남, 제주 |
| **연령** | 계, 1세미만, 1~9세, 10~19세, 20~29세, 30~39세, 40~49세, 50~59세, 60~69세, 70~79세, 80세이상 |
| **OECD** | 한국 포함 36개국 |
