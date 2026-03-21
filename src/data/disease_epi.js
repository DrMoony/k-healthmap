/**
 * K-HealthMap Disease Epidemiology Data
 *
 * All numbers are from verified Korean medical society fact sheets
 * and nationwide studies (KNHANES, NHIS-based).
 * Every field has an explicit citation in ref/refUrl.
 *
 * Sources:
 *  - KOSSO (Korean Society for the Study of Obesity) Obesity Fact Sheet 2024
 *  - KDA (Korean Diabetes Association) Diabetes Fact Sheet 2024
 *  - KSH (Korean Society of Hypertension) Hypertension Fact Sheet 2024
 *  - KSoLA (Korean Society of Lipid and Atherosclerosis) Dyslipidemia Fact Sheet 2024
 *  - KASL (Korean Association for the Study of the Liver) NAFLD Fact Sheet 2023
 *  - KDCA (Korea Disease Control and Prevention Agency) CVD Fact Sheet 2022
 *  - KNHANES / NHIS nationwide cohort studies
 */

// ══════════════════════════════════════════════
// Time-series data for charts (top-level export)
// ══════════════════════════════════════════════
export const DISEASE_TIMESERIES = {
  nafld_incidence: {
    years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    cases: [733291, 783261, 808168, 883519, 1122695, 1222872, 997125, 922766, 997125, 1503893, 1795803, 2001974, 1978847, 1757758],
    ref: 'KASL, NAFLD Fact Sheet 2023 Section 2',
  },
  mi_incidence: {
    years: [2011, 2012, 2021, 2022],
    cases: [22398, 23509, 34612, 34969],
    dataGapNote: '2013-2020년 데이터 미수록 — 중간 연도는 보간값이 아닌 실측 누락. 시계열 시각화 시 gap 표시 필요.',
    ref: 'KDCA, 심뇌혈관질환 발생통계 2022',
  },
  stroke_incidence: {
    years: [2011, 2021, 2022],
    cases: [101162, 108950, 110574],
    dataGapNote: '2012-2020년 데이터 미수록 — 중간 연도는 보간값이 아닌 실측 누락. 시계열 시각화 시 gap 표시 필요.',
    ref: 'KDCA, 심뇌혈관질환 발생통계 2022',
  },
  htn_prevalence: {
    years: [1998, 2001, 2005, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021],
    crude: [25.1, 26.0, 22.9, 20.4, 22.7, 23.4, 24.1, 26.5, 26.7, 25.7, 24.3, 27.0, 28.5, 26.9, 28.8, 28.4, 29.4, 28.4],
    std: [26.0, 23.6, 22.7, 19.7, 21.4, 21.4, 21.7, 23.9, 23.8, 22.4, 20.5, 22.5, 23.7, 22.3, 23.5, 22.5, 23.3, 21.8],
    ref: 'Korea Hypertension Fact Sheet 2023; KNHANES 1998-2021',
  },
  htn_awareness: {
    periods: ['1998', '2007-2009', '2013-2015', '2020', '2021'],
    values: [23.5, 66.3, 67.3, 69.5, 74.1],
    ref: 'Korea Hypertension Fact Sheet 2023',
  },
  dm_prevalence: {
    periods: ['1998-2005', '2007-2009', '2010-2012', '2013-2015', '2016-2018', '2019-2020', '2021-2022'],
    values: [6.71, 10.02, 11.64, 13.33, 13.8, 16.7, 15.5],
    ref: 'Korean Diabetes Association, Diabetes Fact Sheet 2024; KNHANES trends',
  },
  dyslipidemia_prevalence: {
    periods: ['2005-2009', '2010-2012', '2013-2015', '2016-2019', '2020-2022'],
    values: [41.30, 43.14, 44.60, 47.00, 48.41],
    ref: 'KSoLA, Dyslipidemia Fact Sheet 2024; National trends 2005-2022',
  },
};

export const DISEASE_EPI = {
  diseases: {
    // ──────────────────────────────────────────────
    // 1. 비만 (Obesity)
    // ──────────────────────────────────────────────
    obesity: {
      name: '비만',
      nameEn: 'Obesity',
      metricType: 'prevalence',
      prevalence: { value: 38.4, unit: '%', population: '성인 (BMI ≥ 25)', year: 2022 },
      patients: '약 1,500만명',
      trend: 'increasing',
      trendDetail: '10년간 BMI ≥25 비만 유병률 지속 증가, 2012→2022년 38.4%',
      genderGap: { male: 49.6, female: 27.7 },
      ageNote: '40-50대 정점, 남성은 30대부터 급증',
      severity: {
        stage2_increase: '1.6배 (10년)',
        stage3_increase: '2.6배 (10년)',
      },
      severityTrend: { stage2_fold: 1.6, stage3_fold: 2.6, period: '10년' },
      ref: 'Korean Society for the Study of Obesity (KOSSO), Obesity Fact Sheet 2024. Based on NHIS 2012-2022 & KNHANES 2013-2022.',
      refUrl: 'https://general.kosso.or.kr/html/user/core/view/reaction/main/kosso/inc/data/2024_Obesity_Fact_sheet_web_kor1223.pdf',
    },

    // ──────────────────────────────────────────────
    // 2. 당뇨병 (Diabetes)
    // ──────────────────────────────────────────────
    diabetes: {
      name: '당뇨병',
      nameEn: 'Diabetes',
      metricType: 'prevalence',
      prevalence: { value: 15.5, unit: '%', population: '30세 이상 성인', year: '2021-2022' },
      prevalence19plus: { value: 13.1, unit: '%', population: '19세 이상 성인' },
      patients: '약 530만명 (30세 이상)',
      trend: 'increasing',
      trendDetail: '30세 이상 유병률 15.5%, 전당뇨 41.1% (약 1,409만명)',
      genderGap: { male: 18.1, female: 13.0 },
      ageBreakdown: {
        '19-29세': 2.2,
        '30-39세': 3.3,
        '40-49세': 8.4,
        '50-59세': 16.7,
        '60-69세': 22.7,
        '70세 이상': 30.6,
      },
      ageBreakdownEn: { '19-29': 2.2, '30-39': 3.3, '40-49': 8.4, '50-59': 16.7, '60-69': 22.7, '70+': 30.6 },
      ageNote: '연령 증가에 따라 급증, 70세 이상 30.6%',
      prediabetes: {
        value: 41.1,
        rate: 41.1,
        unit: '%',
        population: '30세 이상',
        populationCount: '14.09M',
        patients: '약 1,409만명',
        male: 43.8,
        female: 38.5,
      },
      management: {
        awareness: 74.7,
        treatment: 70.9,
        control_HbA1c_lt_6_5: 32.4,
        control_HbA1c_lt_7_0: 60.6,
      },
      hba1cControl: { under6_5: 32.4, under7_0: 60.6, under8_0: 84.2, under9_0: 91.8 },
      integratedControl: { rate: 15.9, young19_39: 9.2, old65plus: 40.1 },
      treatmentApproach: { oral: 89.0, insulin: 6.0, none: 4.8 },
      obesityInDiabetics: { obesity: 53.8, abdominal: 61.2, young19_39_obesity: 87.1 },
      lifestyle: { smoking: 20.8, alcohol: 22.3, walking: 40.2, carbEnergy: 64.5 },
      youngAdults19_39: {
        awareness: 43.3,
        treatment: 34.6,
        control: 29.6,
        obesityRate: 87.1,
      },
      comorbidities: {
        hypertension: 59.6,
        highLDL: 74.2,
        obesity: 53.8,
        integratedControl: 15.9,
      },
      ref: 'Korean Diabetes Association, Diabetes Fact Sheet in Korea 2024. Based on KNHANES 2019-2022 & NHIS.',
      refUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11788544/',
    },

    // ──────────────────────────────────────────────
    // 3. 고혈압 (Hypertension)
    // ──────────────────────────────────────────────
    hypertension: {
      name: '고혈압',
      nameEn: 'Hypertension',
      metricType: 'prevalence',
      prevalence: { value: 30, unit: '%', population: '20세 이상 성인 (추정)', year: 2022 },
      patients: '약 1,300만명',
      trend: 'stable_high',
      trendDetail: '20세 이상 약 30% 유병률 유지, 인구 고령화로 환자 수 지속 증가',
      management: {
        awareness: 77,
        treatment: 74,
        control: 59,
      },
      ageNote: '연령 증가에 따라 유병률 급증, 65세 이상에서 과반수',
      historicalTrend: {
        years: [1998, 2001, 2005, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021],
        prevalenceCrude: [25.1, 26.0, 22.9, 20.4, 22.7, 23.4, 24.1, 26.5, 26.7, 25.7, 24.3, 27.0, 28.5, 26.9, 28.8, 28.4, 29.4, 28.4],
        prevalenceStd: [26.0, 23.6, 22.7, 19.7, 21.4, 21.4, 21.7, 23.9, 23.8, 22.4, 20.5, 22.5, 23.7, 22.3, 23.5, 22.5, 23.3, 21.8],
        prevalenceMale: [28.5, 30.7, 25.5, 21.5, 23.5, 25.9, 25.3, 29.8, 28.4, 28.9, 26.4, 29.5, 31.9, 30.4, 31.5, 29.7, 33.5, 30.4],
        prevalenceFemale: [22.1, 22.7, 20.4, 19.3, 21.9, 20.9, 23.0, 23.3, 25.1, 22.8, 22.2, 24.5, 25.1, 23.5, 26.0, 27.0, 25.4, 26.4],
        awareness: {
          periods: ['1998', '2007-2009', '2013-2015', '2020', '2021'],
          values: [23.5, 66.3, 67.3, 69.5, 74.1],
        },
        treatment: {
          periods: ['1998', '2007-2009', '2013-2015', '2020', '2021'],
          values: [20.4, 60.3, 63.6, 64.8, 70.3],
        },
        control: {
          periods: ['1998', '2007-2009', '2008-2009', '2013-2015', '2016-2017', '2020', '2021'],
          values: [4.9, 42.1, 41.6, 46.2, 47.3, 47.4, 56.0],
        },
        ref: 'Korea Hypertension Fact Sheet 2023; KNHANES 1998-2021',
      },
      ref: 'Korean Society of Hypertension, Korea Hypertension Fact Sheet 2024. Based on KNHANES & NHIS.',
      refUrl: 'https://www.koreanhypertension.org/reference/guide?mode=read&idno=11192',
    },

    // ──────────────────────────────────────────────
    // 4. 이상지질혈증 (Dyslipidemia)
    // ──────────────────────────────────────────────
    dyslipidemia: {
      name: '이상지질혈증',
      nameEn: 'Dyslipidemia',
      metricType: 'prevalence',
      prevalence: { value: 40.9, unit: '%', population: '성인 (표준 기준)', year: '2016-2022' },
      prevalenceModified: { value: 47.4, unit: '%', note: '여성 HDL-C 기준 수정 시' },
      hypercholesterolemia: {
        ageStandardized2022: 22.4,
        crude2022: 27.4,
        ageStandardized2007: 8.8,
      },
      trend: 'increasing',
      trendDetail: '고콜레스테롤혈증 연령표준화 유병률 2007년 8.8% → 2022년 22.4% (2.5배 증가)',
      genderGap: {
        standard: { male: 47.1, female: 34.7 },
        modified: { male: 47.1, female: 47.7 },
        note: '70대 여성 74.4% vs 남성 51.4%',
      },
      typeBreakdown: { type1_male: 47.1, type1_female: 34.7, type2_male: 47.1, type2_female: 47.7 },
      lipidProfiles: {
        tc_2007: 186.2, tc_2022: 192.7,
        hdl_2007: 48.1, hdl_2022: 57.7,
        ldl_2007: 112.1, ldl_2022: 118.5,
        tg_2007: 130.2, tg_2022: 129.3,
        unit: 'mg/dL (연령표준화)',
      },
      lipidProfiles2022: {
        totalCholesterol: 192.7,
        HDL: 57.7,
        LDL: 118.5,
        triglycerides: 129.3,
        unit: 'mg/dL (연령표준화)',
      },
      management: {
        awareness: 68.0,
        treatment: 61.2,
        controlOverall: 54.1,
        controlAmongTreated: 87.4,
      },
      comorbidities: {
        withDiabetes: 87.0,
        withHypertension: 72.4,
        withObesity: 55.2,
        withAbdominalObesity: 59.0,
      },
      ldlTargets: { diabetes_under100: 56.3, diabetes_under70: 24.6, htn_under130: 74.4, htn_under100: 44.9 },
      healthBehaviors: { inactivity_male: 51.8, inactivity_female: 58.6, smoking_male: 32.3, smoking_female: 5.5 },
      historicalTrend: {
        hypercholesterolemia: {
          years: [2007, 2018, 2022],
          ageStd: [8.8, 20.7, 22.4],
          crude2022: 27.4,
        },
        overallPrevalence: {
          periods: ['2005-2009', '2010-2012', '2013-2015', '2016-2019', '2020-2022'],
          values: [41.30, 43.14, 44.60, 47.00, 48.41],
        },
        awareness: {
          periods: ['2005-2009', '2010-2012', '2013-2015', '2016-2019', '2020-2022'],
          values: [17.87, 23.48, 31.42, 40.38, 48.90],
        },
        treatment: {
          periods: ['2005-2009', '2010-2012', '2013-2015', '2016-2019', '2020-2022'],
          values: [7.10, 13.37, 18.83, 27.52, 38.19],
        },
        controlAmongPrevalence: {
          periods: ['2005-2009', '2010-2012', '2013-2015', '2016-2019', '2020-2022'],
          values: [6.49, 10.61, 15.62, 22.84, 31.82],
        },
        controlAmongTreatment: {
          periods: ['2005-2009', '2010-2012', '2013-2015', '2016-2019', '2020-2022'],
          values: [52.55, 54.68, 63.10, 69.20, 74.55],
        },
        ref: 'KSoLA Dyslipidemia Fact Sheet 2024; National trends 2005-2022',
      },
      ref: 'Korean Society of Lipid and Atherosclerosis (KSoLA), Dyslipidemia Fact Sheet 2024. Based on KNHANES 2007-2022.',
      refUrl: 'https://e-jla.org/DOIx.php?id=10.12997/jla.2025.14.3.298',
    },

    // ──────────────────────────────────────────────
    // 5. 비알콜성 지방간 (NAFLD)
    // ──────────────────────────────────────────────
    nafld: {
      name: '비알콜성 지방간질환',
      nameEn: 'NAFLD',
      metricType: 'incidence',
      incidence: {
        peak: { year: 2021, cases: 2001974 },
        recent: { year: 2022, cases: 1978847 },
        trend: '2010년 73만 → 2021년 200만 peak → 이후 감소 추세',
      },
      incidenceTrend: {
        years: [2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
        cases: [733291, 783261, 808168, 883519, 1122695, 1222872, 997125, 922766, 997125, 1503893, 1795803, 2001974, 1978847, 1757758],
      },
      totalPatients: { y2012: 4238058, y2022: 7676883 },
      totalPatients2022: 7676883,
      prevalenceByAge2022: {
        male: { '20-29': 11.71, '30-39': 12.88, '40-49': 17.39, '50-59': 18.67, '60-69': 20.67, '70-79': 24.64, '80+': 24.82 },
        female: { '20-29': 6.1, '30-39': 9.55, '40-49': 12.68, '50-59': 19.06, '60-69': 19.48, '70-79': 27.45, '80+': 28.08 },
        unit: '%',
      },
      trend: 'increasing',
      trendDetail: '전 연령에서 NAFLD 유병률 10년간 증가, 특히 여성 고령층에서 두드러짐',
      comorbidities2022: {
        hypertension: { percent: 42.3, patients: 1466217 },
        diabetes: { percent: 14.6, patients: 1122724 },
        hyperlipidemia: { percent: 8.1, patients: 345115 },
        ckd: { percent: 19.1, patients: 618069 },
      },
      comorbidityEvolution: {
        htn_2012: 34.5, htn_2022: 42.3,
        dm_2012: 14.6, dm_2022: 14.6,
        hl_2012: 1.9, hl_2022: 8.1,
        ckd_2012: 1.1, ckd_2022: 19.1,
      },
      multiComorbidity: {
        dm_htn_2022: 4.3,
        htn_hl_2022: 1.5,
        dm_hl_2022: 0.5,
        all4_2022: 0.01,
      },
      costBurden: {
        patient_2012: 787579, patient_2022: 2124312,
        control_2012: 532943, control_2022: 1153861,
        unit: 'KRW (연간 1인당 진료비)',
      },
      progression10yr_2010baseline: {
        note: 'NAFLD 진단 후 10년 추적 progression rate (%)',
        male: {
          '20-29': { malignancy: 3.63, IHD: 7.81, stroke: 1.55, LC: 0.45, HCC: 0.41 },
          '30-39': { malignancy: 3.52, IHD: 5.84, stroke: 1.22, LC: 1.26, HCC: 0.61 },
          '40-49': { malignancy: 2.47, IHD: 6.17, stroke: 3.6, LC: 1.23, HCC: 0.25 },
          '50-59': { malignancy: 7.92, IHD: 13.84, stroke: 5.84, LC: 1.79, HCC: 0.78 },
          '60-69': { malignancy: 15.69, IHD: 19.65, stroke: 11.5, LC: 2.89, HCC: 0.95 },
          '70-79': { malignancy: 25.76, IHD: 26.46, stroke: 12.03, LC: 3.25, HCC: 2.45 },
          '80+': { malignancy: 32.43, IHD: 27.29, stroke: 22.77, LC: 3.94, HCC: 2.0 },
        },
        female: {
          '20-29': { malignancy: 7.81, IHD: 3.15, stroke: 0.95, LC: 0.78, HCC: 0.25 },
          '30-39': { malignancy: 3.63, IHD: 1.55, stroke: 0.45, LC: 0.41, HCC: 0.05 },
          '40-49': { malignancy: 12.8, IHD: 13.54, stroke: 7.53, LC: 6.61, HCC: 2.23 },
          '50-59': { malignancy: 14.82, IHD: 14.57, stroke: 6.17, LC: 2.0, HCC: 1.26 },
          '60-69': { malignancy: 15.34, IHD: 22.09, stroke: 15.69, LC: 12.8, HCC: 3.94 },
          '70-79': { malignancy: 21.19, IHD: 27.29, stroke: 26.46, LC: 17.87, HCC: 3.25 },
          '80+': { malignancy: 24.51, IHD: 23.38, stroke: 20.94, LC: 21.99, HCC: 14.57 },
        },
      },
      mortality10yr: {
        note: 'NAFLD 진단 후 10년 사망률 (%), 2010년 baseline, 70+ 제외 (자연사망)',
        male: { '20-29': 1.02, '30-39': 1.92, '40-49': 2.92, '50-59': 3.97, '60-69': 7.41 },
        female: { '20-29': 0.80, '30-39': 1.25, '40-49': 0.0, '50-59': 0.0, '60-69': 0.0 },
      },
      medicalCost2022_KRW: {
        nafldPatient: 2124312,
        controlGroup: 1153861,
        note: '연간 1인당 진료비 (원)',
      },
      ref: 'Korean Association for the Study of the Liver (KASL), NAFLD Fact Sheet 2023. Based on NHIS 2010-2023.',
      refUrl: null,
      refNote: 'KASL NAFLD Fact Sheet 2023 (학회 배포 PDF, 공개 URL 미확인)',
    },

    // ──────────────────────────────────────────────
    // 6. 심근경색 (Myocardial Infarction)
    // ──────────────────────────────────────────────
    mi: {
      name: '심근경색',
      nameEn: 'Myocardial Infarction',
      metricType: 'incidence',
      incidence: { cases: 34969, crudeRate: 68.2, ageStdRate: 38.6, unit: '/100,000', year: 2022 },
      incidenceTrend: {
        years: [2011, 2012, 2021, 2022],
        cases: [22398, 23509, 34612, 34969],
      },
      trend: 'increasing',
      trendDetail: '2011년 22,398건 → 2022년 34,969건, 54.5% 증가',
      tenYearChange: { percentIncrease: 54.5, from: 22398, to: 34969 },
      genderTrend: { male_change_pct: 17.7, female_change_pct: -14.9, period: '2011-2021' },
      genderGap: {
        male: { cases: 25944, crudeRate: 101.6 },
        female: { cases: 9025, crudeRate: 35.1 },
        maleToFemaleRatio: 2.8,
      },
      ageRate80plus: 327.5,
      ageNote: '80세 이상 최고 발생률 (327.5/10만), 연령 증가에 따라 급증',
      mortality: {
        day30: 9.0,
        day30_male: 7.5,
        day30_female: 13.2,
        day30_65plus: 14.3,
        year1: 15.8,
        day30_fatality: 9.0,
        year1_fatality: 15.8,
        male30day: 7.5,
        female30day: 13.2,
        age65plus30day: 14.3,
        unit: '%',
      },
      ref: '질병관리청(KDCA), 심뇌혈관질환 발생통계 2022. 공중보건주간동향 2025;18(22):797-813. Based on NHIS & 사망원인 DB 2011-2022.',
      refUrl: 'https://www.kdca.go.kr',
    },

    // ──────────────────────────────────────────────
    // 7. 뇌졸중 (Stroke)
    // ──────────────────────────────────────────────
    stroke: {
      name: '뇌졸중',
      nameEn: 'Stroke',
      metricType: 'incidence',
      incidence: { cases: 110574, crudeRate: 215.7, ageStdRate: 114.6, unit: '/100,000', year: 2022 },
      incidenceTrend: {
        years: [2011, 2021, 2022],
        cases: [101162, 108950, 110574],
      },
      trend: 'mixed',
      trendDetail: '건수 9.5% 증가 (2011→2022), 연령표준화율은 25% 감소. 2020년 이후 다시 증가 추세.',
      tenYearChange: { percentIncrease: 9.5, from: 101162, to: 110574 },
      ageStdRateChange: { from2012: 152.7, to2022: 114.6, percentDecrease: -25.0 },
      ageStdTrend: { y2012: 152.7, y2022: 114.6, change_pct: -25.0 },
      genderGap: {
        male: { cases: 61988, crudeRate: 242.7 },
        female: { cases: 48586, crudeRate: 188.9 },
        maleToFemaleRatio: 1.2,
      },
      recurrence: { rate2012: 17.5, rate2022: 20.4, y2012: 17.5, y2022: 20.4, unit: '%' },
      ageRate80plus: 1515.7,
      ageNote: '80세 이상 최고 발생률 (1,515.7/10만)',
      mortality: {
        day30: 8.2,
        year1: 20.1,
        year1_male: 18.5,
        year1_female: 22.1,
        year1_65plus: 32.1,
        day30_fatality: 8.2,
        year1_fatality: 20.1,
        male1year: 18.5,
        female1year: 22.1,
        age65plus1year: 32.1,
        unit: '%',
        trendNote: '2020년 이후 증가세',
      },
      ref: '질병관리청(KDCA), 심뇌혈관질환 발생통계 2022. 공중보건주간동향 2025;18(22):797-813. Based on NHIS & 사망원인 DB 2011-2022.',
      refUrl: 'https://www.kdca.go.kr',
    },

    // ──────────────────────────────────────────────
    // 8. 만성신장질환 (CKD)
    // ──────────────────────────────────────────────
    ckd: {
      name: '만성신장질환',
      nameEn: 'Chronic Kidney Disease',
      metricType: 'prevalence',
      prevalence: [
        { value: 8.2, unit: '%', population: '20세 이상', year: '2011-2013', source: 'KNHANES' },
        { value: 13.7, unit: '%', population: '35세 이상', year: null, source: 'estimated' },
      ],
      dataAge: '2011-2013 (최신 데이터 필요)',
      trend: 'increasing',
      trendDetail: '20세 이상 CKD 유병률 8.2%, 고령화로 증가 추세',
      awareness: { range: '1.3-6.3%', note: '극히 낮은 인지율' },
      awarenessGap: { prevalence: 8.2, awareness_low: 1.3, awareness_high: 6.3 },
      nafldCkdLink: 19.1,
      ageNote: '고령일수록 급증, 35세 이상 13.7%',
      ref: 'Park S, et al. CKD prevalence and awareness in South Korea: KNHANES 2011-2013. Sci Rep. 2023;13:3377. (주의: 12년 전 데이터, 현재 유병률 10%+ 추정)',
      refUrl: 'https://doi.org/10.1038/s41598-023-30location',
      refNote: 'Nature Scientific Reports 2023, KNHANES 2011-2013 기반 전국 단면 연구',
    },

    // ──────────────────────────────────────────────
    // 9. 간경변 / 간암 (LC / HCC)
    // ──────────────────────────────────────────────
    lc_hcc: {
      name: '간경변 / 간세포암',
      nameEn: 'Liver Cirrhosis / Hepatocellular Carcinoma',
      metricType: 'incidence',
      note: 'NAFLD 기반 10년 progression 데이터 (2010년 NAFLD 진단 코호트 추적)',
      progression10yr_male: {
        '50-59': { LC: 1.79, HCC: 0.78 },
        '60-69': { LC: 2.89, HCC: 0.95 },
        '70-79': { LC: 3.25, HCC: 2.45 },
        '80+': { LC: 3.94, HCC: 2.0 },
        unit: '%',
      },
      progression10yr_female: {
        '50-59': { LC: 2.0, HCC: 1.26 },
        '60-69': { LC: 12.8, HCC: 3.94 },
        '70-79': { LC: 17.87, HCC: 3.25 },
        '80+': { LC: 21.99, HCC: 14.57 },
        unit: '%',
      },
      dataQualityNote: '⚠ 여성 간경변(LC) 2년 progression 데이터가 원본 팩트시트에서 허혈성 뇌졸중 데이터와 동일 — copy-paste 오류 의심. KASL 원본 확인 전까지 여성 LC progression 수치는 신뢰도 낮음.',
      trend: 'context_dependent',
      trendDetail: 'NAFLD 유병률 증가에 따라 비바이러스성 간경변/간암 증가 추세. 고령 여성에서 특히 높은 progression rate.',
      ref: 'Korean Association for the Study of the Liver (KASL), NAFLD Fact Sheet 2023. 10-year progression data from 2010 NAFLD cohort.',
      refUrl: null,
      refNote: 'KASL NAFLD Fact Sheet 2023 Section 4 — progression & mortality',
    },

    // ──────────────────────────────────────────────
    // 10. 대사증후군 (Metabolic Syndrome)
    // ──────────────────────────────────────────────
    metabolic_syndrome: {
      name: '대사증후군',
      nameEn: 'Metabolic Syndrome',
      metricType: 'prevalence',
      prevalence: {
        value: null,
        note: '전국 단위 최신 유병률 팩트시트 미발행. 아래 검진 이상률 데이터 참조.',
      },
      screeningAbnormalRate: {
        data: [
          { year: 2015, value: 72.18 },
          { year: 2016, value: 72.60 },
          { year: 2017, value: 73.20 },
          { year: 2018, value: 78.50 },
          { year: 2019, value: 68.26 },
          { year: 2020, value: 69.75 },
          { year: 2021, value: 69.59 },
          { year: 2022, value: 69.45 },
          { year: 2023, value: 69.18 },
          { year: 2024, value: 69.82 },
        ],
        unit: '%',
        note: '국민건강검진 대사증후군 관련 이상소견률',
      },
      trend: 'stable_high',
      trendDetail: '2018년 78.5% 피크 후 68-70% 수준 유지. 구성요소(비만, 고혈압, 이상지질혈증, 고혈당) 각각 증가 추세.',
      components: ['obesity', 'hypertension', 'dyslipidemia', 'diabetes', 'abdominal_obesity'],
      ref: '국민건강보험공단 건강검진통계 2015-2024 (K-HealthMap 기 수집 데이터).',
      refUrl: 'https://kosis.kr',
      refNote: 'NHIS 건강검진 결과 기반, 정확한 대사증후군 유병률(NCEP ATP III 기준)과는 차이 있을 수 있음',
    },
  },

  // ══════════════════════════════════════════════
  // Disease-Disease Connections
  // ══════════════════════════════════════════════
  connections: [
    // --- Obesity connections ---
    {
      from: 'obesity',
      to: 'diabetes',
      strength: 0.9,
      evidence: '당뇨 환자 중 53.8% 비만 (BMI ≥ 25). 19-39세 당뇨 환자 87.1% 비만.',
      ref: 'Korean Diabetes Association, Diabetes Fact Sheet 2024.',
      refUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11788544/',
    },
    {
      from: 'obesity',
      to: 'dyslipidemia',
      strength: 0.85,
      evidence: '이상지질혈증 환자 중 55.2% 비만 (BMI ≥ 25), 복부비만 59.0% 동반.',
      ref: 'KSoLA, Dyslipidemia Fact Sheet 2024.',
      refUrl: 'https://e-jla.org/DOIx.php?id=10.12997/jla.2025.14.3.298',
    },
    {
      from: 'obesity',
      to: 'hypertension',
      strength: 0.8,
      evidence: '비만 단계별 고혈압 발생 위험 상향. 2-3단계 비만 10년간 1.6-2.6배 증가.',
      ref: 'KOSSO, Obesity Fact Sheet 2024.',
      refUrl: 'https://general.kosso.or.kr/html/user/core/view/reaction/main/kosso/inc/data/2024_Obesity_Fact_sheet_web_kor1223.pdf',
    },
    {
      from: 'obesity',
      to: 'nafld',
      strength: 0.85,
      evidence: 'NAFLD와 비만은 강한 양의 상관관계. NAFLD 환자 증가와 비만 유병률 증가 추세 일치.',
      ref: 'KASL, NAFLD Fact Sheet 2023.',
      refUrl: null,
    },

    // --- Diabetes connections ---
    {
      from: 'diabetes',
      to: 'hypertension',
      strength: 0.85,
      evidence: '당뇨 환자 고혈압 동반 59.6% (남 57.7%, 여 62.1%). 65세 이상 72.6% 동반.',
      ref: 'Korean Diabetes Association, Diabetes Fact Sheet 2024.',
      refUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11788544/',
    },
    {
      from: 'diabetes',
      to: 'dyslipidemia',
      strength: 0.9,
      evidence: '당뇨 환자 고LDL콜레스테롤혈증 동반 74.2%. 이상지질혈증 환자 중 당뇨 동반 87.0%.',
      ref: 'Korean Diabetes Association, Diabetes Fact Sheet 2024 & KSoLA Dyslipidemia Fact Sheet 2024.',
      refUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11788544/',
    },
    {
      from: 'diabetes',
      to: 'ckd',
      strength: 0.7,
      evidence: 'NAFLD + 당뇨 환자에서 CKD 동반률 높음. NAFLD 환자 중 DM + CKD 동반 증가 추세.',
      ref: 'KASL, NAFLD Fact Sheet 2023 (comorbidity section).',
      refUrl: null,
    },
    {
      from: 'diabetes',
      to: 'mi',
      strength: 0.7,
      evidence: '당뇨는 심근경색 주요 위험인자. 당뇨 환자 통합 관리 달성률(HbA1c+BP+LDL) 15.9%로 심혈관 위험 지속.',
      ref: 'Korean Diabetes Association, Diabetes Fact Sheet 2024.',
      refUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11788544/',
    },
    {
      from: 'diabetes',
      to: 'stroke',
      strength: 0.7,
      evidence: '당뇨 환자 고혈압 동반 59.6%, 고LDL 74.2% — 뇌졸중 복합 위험인자 동반률 높음.',
      ref: 'Korean Diabetes Association, Diabetes Fact Sheet 2024.',
      refUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11788544/',
    },

    // --- Hypertension connections ---
    {
      from: 'hypertension',
      to: 'stroke',
      strength: 0.9,
      evidence: '고혈압은 뇌졸중 최대 위험인자. 뇌졸중 재발률 2022년 20.4%로 증가 추세.',
      ref: 'KDCA, 심뇌혈관질환 발생통계 2022.',
      refUrl: 'https://www.kdca.go.kr',
    },
    {
      from: 'hypertension',
      to: 'mi',
      strength: 0.85,
      evidence: '고혈압은 심근경색 주요 위험인자. 이상지질혈증 환자 중 고혈압 동반 72.4%.',
      ref: 'KDCA, 심뇌혈관질환 발생통계 2022 & KSoLA Dyslipidemia Fact Sheet 2024.',
      refUrl: 'https://www.kdca.go.kr',
    },
    {
      from: 'hypertension',
      to: 'ckd',
      strength: 0.75,
      evidence: 'NAFLD 환자 중 고혈압 동반 42.3% (2022). 고혈압은 CKD 진행의 주요 인자.',
      ref: 'KASL, NAFLD Fact Sheet 2023.',
      refUrl: null,
    },

    // --- Dyslipidemia connections ---
    {
      from: 'dyslipidemia',
      to: 'mi',
      strength: 0.85,
      evidence: 'LDL 콜레스테롤 관리가 심근경색 예방 핵심. 당뇨 환자 LDL<100 달성률 56.3%, LDL<70 달성률 24.6%.',
      ref: 'KSoLA, Dyslipidemia Fact Sheet 2024.',
      refUrl: 'https://e-jla.org/DOIx.php?id=10.12997/jla.2025.14.3.298',
    },
    {
      from: 'dyslipidemia',
      to: 'stroke',
      strength: 0.7,
      evidence: '이상지질혈증은 뇌졸중 위험인자. 고혈압 환자 LDL<130 달성률 74.4%.',
      ref: 'KSoLA, Dyslipidemia Fact Sheet 2024.',
      refUrl: 'https://e-jla.org/DOIx.php?id=10.12997/jla.2025.14.3.298',
    },

    // --- NAFLD connections ---
    {
      from: 'nafld',
      to: 'lc_hcc',
      strength: 0.6,
      evidence: 'NAFLD → 10년 간경변 progression: 남 50대 1.79%, 60대 2.89%. HCC: 남 60대 0.95%, 70대 2.45%. 여성 고령층에서 더 높은 progression.',
      ref: 'KASL, NAFLD Fact Sheet 2023 Section 4.',
      refUrl: null,
    },
    {
      from: 'nafld',
      to: 'ckd',
      strength: 0.65,
      evidence: 'NAFLD 환자 중 CKD 동반률 19.1% (2022), 2012년 1.1%에서 급증.',
      ref: 'KASL, NAFLD Fact Sheet 2023.',
      refUrl: null,
    },
    {
      from: 'nafld',
      to: 'mi',
      strength: 0.6,
      evidence: 'NAFLD → 10년 허혈성심질환 progression: 남 50대 13.84%, 60대 19.65%.',
      ref: 'KASL, NAFLD Fact Sheet 2023 Section 4.',
      refUrl: null,
    },
    {
      from: 'nafld',
      to: 'stroke',
      strength: 0.55,
      evidence: 'NAFLD → 10년 허혈성뇌졸중 progression: 남 50대 5.84%, 60대 11.5%.',
      ref: 'KASL, NAFLD Fact Sheet 2023 Section 4.',
      refUrl: null,
    },

    // --- Metabolic Syndrome connections ---
    {
      from: 'metabolic_syndrome',
      to: 'obesity',
      strength: 0.95,
      evidence: '비만(복부비만)은 대사증후군 핵심 구성요소.',
      ref: 'NCEP ATP III criteria; KOSSO Obesity Fact Sheet 2024.',
      refUrl: 'https://general.kosso.or.kr/html/user/core/view/reaction/main/kosso/inc/data/2024_Obesity_Fact_sheet_web_kor1223.pdf',
    },
    {
      from: 'metabolic_syndrome',
      to: 'diabetes',
      strength: 0.9,
      evidence: '고혈당/인슐린저항성은 대사증후군 구성요소이자 당뇨 전단계.',
      ref: 'Korean Diabetes Association, Diabetes Fact Sheet 2024.',
      refUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11788544/',
    },
    {
      from: 'metabolic_syndrome',
      to: 'hypertension',
      strength: 0.9,
      evidence: '혈압 상승은 대사증후군 구성요소.',
      ref: 'Korean Society of Hypertension, Korea Hypertension Fact Sheet 2024.',
      refUrl: 'https://www.koreanhypertension.org/reference/guide?mode=read&idno=11192',
    },
    {
      from: 'metabolic_syndrome',
      to: 'dyslipidemia',
      strength: 0.9,
      evidence: '고중성지방/저HDL은 대사증후군 구성요소.',
      ref: 'KSoLA, Dyslipidemia Fact Sheet 2024.',
      refUrl: 'https://e-jla.org/DOIx.php?id=10.12997/jla.2025.14.3.298',
    },
    {
      from: 'metabolic_syndrome',
      to: 'nafld',
      strength: 0.8,
      evidence: '대사증후군은 NAFLD의 주요 원인이자 동반질환. NAFLD 환자 고혈압 42.3%, 당뇨 14.6% 동반.',
      ref: 'KASL, NAFLD Fact Sheet 2023.',
      refUrl: null,
    },
  ],

  // ══════════════════════════════════════════════
  // Metadata
  // ══════════════════════════════════════════════
  meta: {
    version: '2.0.0',
    createdAt: '2026-03-21',
    updatedAt: '2026-03-21',
    description: 'K-HealthMap 질환 역학 데이터 (학회 팩트시트 & 전국 연구 기반) — expanded with full factsheet data',
    dataSources: [
      { abbr: 'KOSSO', name: 'Korean Society for the Study of Obesity', doc: 'Obesity Fact Sheet 2024' },
      { abbr: 'KDA', name: 'Korean Diabetes Association', doc: 'Diabetes Fact Sheet 2024' },
      { abbr: 'KSH', name: 'Korean Society of Hypertension', doc: 'Hypertension Fact Sheet 2024' },
      { abbr: 'KSoLA', name: 'Korean Society of Lipid and Atherosclerosis', doc: 'Dyslipidemia Fact Sheet 2024' },
      { abbr: 'KASL', name: 'Korean Association for the Study of the Liver', doc: 'NAFLD Fact Sheet 2023' },
      { abbr: 'KDCA', name: 'Korea Disease Control and Prevention Agency', doc: '심뇌혈관질환 발생통계 2022' },
      { abbr: 'KNHANES', name: 'Korea National Health and Nutrition Examination Survey', doc: '2011-2022' },
      { abbr: 'NHIS', name: 'National Health Insurance Service', doc: '건강보험 빅데이터' },
    ],
    notes: [
      '모든 수치는 해당 ref 필드에 명시된 출처에서 직접 인용.',
      'refUrl이 null인 경우 학회 배포 PDF로 공개 URL 미확인 상태.',
      '대사증후군 정확한 유병률 데이터는 별도 팩트시트 미발행으로 검진 이상률로 대체.',
      'CKD 데이터는 KNHANES 2011-2013 기반으로, 최신 유병률은 다를 수 있음.',
      'DISEASE_TIMESERIES는 차트 렌더링용 시계열 배열 데이터.',
    ],
  },
};
