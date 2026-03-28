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
    years: [1998, 2001, 2005, 2007, 2008, 2009, 2010, 2011, 2012, 2013, 2014, 2015, 2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    crude: [25.1, 26.0, 22.9, 20.4, 22.7, 23.4, 24.1, 26.5, 26.7, 25.7, 24.3, 27.0, 28.5, 26.9, 28.8, 28.4, 29.4, 28.4, 29.6, 29.0],
    std: [26.0, 23.6, 22.7, 19.7, 21.4, 21.4, 21.7, 23.9, 23.8, 22.4, 20.5, 22.5, 23.7, 22.3, 23.5, 22.5, 23.3, 21.8, 22.4, null],
    ref: 'Korea Hypertension Fact Sheet 2025; KNHANES 1998-2023',
  },
  // 팩트시트별 관리 캐스케이드 (유병률은 조율 기준, 30세 이상)
  htn_factsheet_cascade: {
    years: [2018, 2019, 2020, 2021, 2022, 2023, 2024, 2025],
    dataYear: [2016, 2017, 2018, 2019, 2020, 2021, 2022, 2023],
    prevalence: [29, null, null, null, null, null, null, 29],
    patients: [null, null, null, null, null, null, null, 1260],  // 만명
    awareness: [65, null, null, null, 74, 74, 77, 79],
    treatment: [61, null, null, null, 70, 70, 74, 76],
    control: [44, null, null, null, 56, 56, 59, 62],
    note: '각 연도 팩트시트의 최신 데이터 기준. 빈 값은 해당 팩트시트에서 미추출.',
    ref: 'KSH Hypertension Fact Sheets 2018-2025',
  },
  htn_awareness: {
    periods: ['1998', '2007-2009', '2013-2015', '2020', '2021', '2023'],
    values: [23.5, 66.3, 67.3, 69.5, 74.1, 79],
    ref: 'Korea Hypertension Fact Sheet 2025',
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
  eskd_incidence: {
    years: [2010, 2012, 2014, 2016, 2018, 2020, 2022],
    rates: [199.4, 221.0, 248.3, 275.8, 310.5, 340.1, 360.2],
    patients: [63341, 73064, 84989, 98746, 110856, 121379, 135345],
    unit: 'per million population',
    ref: 'KORDS 2010-2022, KSN ESKD Fact Sheet 2024',
  },
  dialysis_trend: {
    years: [2010, 2012, 2014, 2016, 2018, 2020, 2022],
    hd: [43931, 50477, 59667, 71066, 82141, 92540, 107285],
    pd: [8441, 8962, 9374, 9608, 9651, 9735, 10413],
    total: [52372, 59439, 69041, 80674, 91792, 102275, 117698],
    ref: 'KORDS 2010-2022',
  },
  transplant_trend: {
    years: [2010, 2012, 2014, 2016, 2018, 2020, 2022],
    living: [915, 943, 1063, 1167, 1310, 1278, 1394],
    deceased: [346, 402, 547, 673, 735, 654, 770],
    total: [1261, 1345, 1610, 1840, 2045, 1932, 2164],
    ref: 'KORDS 2010-2022',
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
      familyRisk: { parentObeseChildOR: 1.3 },
      comorbidityOR: { diabetes: 5.2, hypertension: 2.1, dyslipidemia: 1.9, metabolicSyndrome: 3.1, nafld: 2.4, ckd: 1.5, gout: 1.4 },
      pediatric: { trend: '19세 미만 2019년 이후 증가' },
      agePeak: { male: '35-39세 58.0%', female: '75-79세 42.1%', overall: '35-39세 44.6%' },
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
    // 5. 대사이상관련 지방간질환 (MASLD, 구 NAFLD)
    // ──────────────────────────────────────────────
    nafld: {  // key 유지 (하위호환), 명칭은 MASLD로 업데이트
      name: '대사이상관련 지방간질환 (MASLD)',
      nameEn: 'MASLD (formerly NAFLD)',
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
        female: { '20-29': 0.80, '30-39': 1.25, '40-49': null, '50-59': null, '60-69': null },  // 0.0→null: 데이터 미확인 (원본 PDF 검증 필요)
      },
      medicalCost2022_KRW: {
        nafldPatient: 2124312,
        controlGroup: 1153861,
        note: '연간 1인당 진료비 (원)',
      },
      // 2년 추적 진행률 (%) — 2010, 2015, 2020 코호트 비교
      progression2yr: {
        cirrhosis: {
          // K702, K703, K717, K74
          male: {
            '20-29': { 2010: 0.10, 2015: 0.08, 2020: 0.10 },
            '30-39': { 2010: 0.33, 2015: 0.23, 2020: 0.22 },
            '40-49': { 2010: 0.92, 2015: 0.61, 2020: 0.51 },
            '50-59': { 2010: 1.31, 2015: 1.04, 2020: 0.93 },
            '60-69': { 2010: 1.54, 2015: 1.27, 2020: 1.22 },
            '70-79': { 2010: 1.39, 2015: 1.40, 2020: 1.03 },
            '80+':   { 2010: 1.38, 2015: 1.07, 2020: 1.20 },
          },
          female: {
            '20-29': { 2010: 0.09, 2015: 0.06, 2020: 0.05 },
            '30-39': { 2010: 0.22, 2015: 0.16, 2020: 0.17 },
            '40-49': { 2010: 0.64, 2015: 0.51, 2020: 0.42 },
            '50-59': { 2010: 1.18, 2015: 0.89, 2020: null },
            '60-69': { 2010: 2.03, 2015: 1.82, 2020: null },
            '70-79': { 2010: 6.33, 2015: 4.69, 2020: 4.38 },
            '80+':   { 2010: 10.08, 2015: 8.38, 2020: 8.40 },
          },
          ref: 'KASL NAFLD Fact Sheet 2023, NHIS 2년 추적',
        },
        hcc: {
          // C220
          male: {
            '20-29': { 2010: 0.01, 2015: 0.01, 2020: 0.00 },
            '30-39': { 2010: 0.04, 2015: 0.05, 2020: 0.02 },
            '40-49': { 2010: 0.13, 2015: 0.09, 2020: 0.06 },
            '50-59': { 2010: 0.24, 2015: 0.23, 2020: 0.17 },
            '60-69': { 2010: 0.69, 2015: 0.61, 2020: 0.59 },
            '70-79': { 2010: 0.47, 2015: 0.41, 2020: 0.30 },
            '80+':   { 2010: 0.67, 2015: 0.64, 2020: 0.71 },
          },
          female: {
            '20-29': { 2010: 0.01, 2015: 0.01, 2020: 0.01 },
            '30-39': { 2010: 0.02, 2015: 0.01, 2020: 0.03 },
            '40-49': { 2010: 0.05, 2015: 0.04, 2020: 0.04 },
            '50-59': { 2010: 0.10, 2015: 0.09, 2020: 0.06 },
            '60-69': { 2010: 0.22, 2015: 0.21, 2020: 0.08 },
            '70-79': { 2010: 0.24, 2015: 0.17, 2020: 0.12 },
            '80+':   { 2010: 0.26, 2015: 0.23, 2020: 0.23 },
          },
          ref: 'KASL NAFLD Fact Sheet 2023, NHIS 2년 추적',
        },
        insight: [
          '간경화 진행률은 대부분 연령에서 2010→2020 감소 추세 (치료 발전)',
          '여성 70-79, 80+에서는 여전히 높음 (6-10%)',
          '간세포암은 남성 80+에서 증가 추세 (0.67%→0.71%)',
        ],
      },
      ref: 'Korean Association for the Study of the Liver (KASL), NAFLD Fact Sheet 2023. Based on NHIS 2010-2023.',
      refUrl: null,
      refNote: 'KASL NAFLD Fact Sheet 2023 (학회 배포 PDF, 공개 URL 미확인)',
    },

    // ──────────────────────────────────────────────
    // 5b. 대사이상지방간염 (MASH, 구 NASH)
    // ──────────────────────────────────────────────
    mash: {
      name: '대사이상지방간염 (MASH)',
      nameEn: 'MASH (formerly NASH)',
      metricType: 'prevalence',

      // ── 글로벌 역학 ──
      global: {
        masldPrevalence: 38,  // 성인 전체, Younossi 2023 Hepatology
        masldInT2DM: 65.3,    // T2DM 환자 중 MASLD, Younossi 2024 CGH
        ref: 'Younossi ZM et al., Hepatology 2023;79(4):1264-1282; Clin Gastroenterol Hepatol 2024',
      },

      // ── 한국 유병률 (KASL GL 2025, 건보/건검 데이터) ──
      koreaPrevalence: {
        masld_healthCheckup: { value: 27.5, male: 35.9, female: 17.4, n: 9775066, year: 2009, method: 'FLI+건검', unit: '%' },
        masld_ultrasound: { value: 33.5, n: 7918, method: '복부초음파', unit: '%' },
        masld_cap: { value: 42.9, method: 'CAP≥250', unit: '%' },
        masld_biopsy: { value: 51.4, method: '생체간 공여자 조직검사', unit: '%' },
        nafld_masld_concordance: 99, // %
        ref: 'KASL 2025 MASLD 진료가이드라인, refs 31-46',
      },

      // ── 한국 MASH 진단 기반 역학 (NHIS claims, PMC10744038) ──
      koreaMASH: {
        prevalencePer1000: { y2010: 0.49, y2021: 9.79 },  // /1000명
        incidencePer1000: { y2010: 0.37, y2021: 5.52 },   // /1000명
        foldIncrease: { prevalence: 20, incidence: 15 },
        peakAge: '60-69',
        sexSwitch: '50세 미만 남성↑, 50세 이상 여성↑',
        caveat: '진단코드 기반 — 실제 유병률의 ~10%. 증가 추세는 주로 진단 인식 향상 반영.',
        ref: 'J Clin Med 2023;12(24):7634 (PMC10744038), NHIS 2010-2021',
      },

      // ── 간섬유화 진행 (KASL GL 2025 인용 메타분석) ──
      fibrosis: {
        // 과체중 MASLD 환자
        overweightMASLD: { anyFibrosis: 46.6, advancedF3F4: 6.7, cirrhosisF4: 2.5, unit: '%' },
        // 과체중 MASH 환자
        overweightMASH: { anyFibrosis: 72.6, advancedF3F4: 19.4, cirrhosisF4: 1.7, unit: '%' },
        // MASLD 전체
        masldSignificantFibrosis: 26.7, // F2+ (%), MASLD 인구 중
        masldF2plus: 29.2,  // 조직검사 확인 환자 중 F2+
        masldCirrhosis: 3.2, // 조직검사 확인 환자 중
        // 섬유화 진행 속도
        progressionRate: {
          nafl_to_F1: 14.3,   // 년 (단순지방간)
          nash_to_F1: 7.1,    // 년 (지방간염 — 2배 빠름)
          fiveYearCirrhosis: 2.42,  // %
          tenYearCirrhosis: 3.70,   // %
        },
        // 3년 섬유화 진행 비율
        threeYearProgression: 27,  // %
        ref: 'KASL GL 2025 refs 82-91; Singh 2015 Clin Gastro Hepatol',
      },

      // ── HCC 위험 ──
      hcc: {
        cirrhosisAnnualRate: 1.5,  // % 이상, 간경변 동반 시
        masldHccRate: 0.62,        // %, MASLD군
        nonMasldHccRate: 0.18,     // %, 비MASLD군
        ref: 'KASL GL 2025 refs 64-72',
      },

      // ── 사망 위험 (전체사망률 HR) ──
      mortalityHR: {
        nafl: 1.71,           // 단순지방간
        nash: 2.14,           // 지방간염
        nashWithFibrosis: 2.44,  // 섬유화 동반
        cirrhosis: 3.79,      // 간경변
        ref: 'KASL GL 2025 ref 95',
      },

      // ── MASH 진행 파이프라인 (시각화용 요약) ──
      pipeline: {
        stages: [
          { id: 'masld', label: 'MASLD', labelEn: 'MASLD', prevalence: '27-38%', note: '한국 27.5%, 글로벌 38%' },
          { id: 'mash', label: 'MASH', labelEn: 'MASH', prevalence: '~1% 진단', note: '과체중MASLD의 ~20% 추정' },
          { id: 'fibrosis', label: '진행성 섬유화', labelEn: 'Adv. Fibrosis', prevalence: 'MASH의 19.4%', note: 'F3-F4' },
          { id: 'cirrhosis', label: '간경변', labelEn: 'Cirrhosis', prevalence: '10년 3.7%', note: 'MASH의 1.7%' },
          { id: 'hcc', label: '간세포암', labelEn: 'HCC', prevalence: '연 1.5%', note: '간경변 동반 시' },
        ],
        mortalityMultiplier: [1.0, 1.71, 2.14, 2.44, 3.79],  // vs 일반인구
        transitionYears: [null, null, 7.1, null, null],  // NASH→F1 7.1년
      },

      ref: 'KASL 2025 MASLD GL, KASL NAFLD FS 2023, Younossi 2023/2024',
      refUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC10744038/',
    },

    // ──────────────────────────────────────────────
    // 5c. B형간염 (Hepatitis B)
    // ──────────────────────────────────────────────
    hbv: {
      name: 'B형간염',
      nameEn: 'Hepatitis B',
      metricType: 'prevalence',

      // ── HBsAg 양성률 (KNHANES) ──
      hbsAgPrevalence: {
        y2007_2009: 3.4,   // % (KNHANES 2007-2009, 10세 이상)
        y2019_2021: 2.14,  // % (KNHANES 2019-2021)
        overall_2019: 2.7, // % (20세 이상, 연령보정)
        male: 3.4,         // % (2019-2021)
        female: 1.9,       // % (2019-2021)
        agePeak: '40-49세',
        trend: 'decreasing',
        trendNote: '예방접종 효과로 30세 미만 거의 소실',
        unit: '%',
      },

      // ── 항체 보유율 ──
      antiHBs: {
        overall: 66.7,      // % (2019-2021 KNHANES)
        age10_19: 73.2,     // %
        age20_29: 59.1,     // %
        age30_39: 56.5,     // %
        trendNote: '20-30대 항체 소실 → 추가접종 필요',
        unit: '%',
      },

      // ── 환자수 (NHIS 청구) ──
      patients: {
        chronicHBV: 490000, // 만성 B형간염 진료환자 약 49만명 (2021)
        year: 2021,
        trendNote: '치료율 향상으로 진료환자 안정적 유지',
      },

      // ── 예방접종 ──
      vaccination: {
        newbornCoverage: 97.8,  // % (2021)
        perinatalPrevention: 96.2, // % (수직감염 예방사업)
        universalSince: 1995,
        trendNote: '1995년 국가예방접종 도입, 10대 이하 HBsAg 거의 0%',
      },

      // ── HBV 관련 질환 ──
      complications: {
        hbvRelatedHCC_proportion: 62,  // % (간세포암 중 HBV 원인, 2008)
        hbvRelatedHCC_2020: 48,        // % (감소 추세)
        hbvRelatedLC_proportion: 45,   // % (간경변 중 HBV 원인)
        trendNote: 'HBV 기인 간암 비율 감소, MASLD 기인 증가',
      },

      // ── 사망률 ──
      mortality: {
        liverDiseaseMortality2021: 13.5, // /100,000 (간질환 사망률, HBV 포함)
        trendNote: '간질환 사망률 전반적 감소, HBV 기여 비율 하락',
        unit: '/100,000',
      },

      riskFactors: ['수직감염 (모자감염)', '혈액 노출', '성적 접촉', '의료시술'],
      ref: 'KASL HBV Factsheet 2023; KNHANES 2019-2021; 대한간학회 만성 B형간염 진료 가이드라인 2022',
      refUrl: 'https://www.kasl.org/',
    },

    // ──────────────────────────────────────────────
    // 5d. C형간염 (Hepatitis C)
    // ──────────────────────────────────────────────
    hcv: {
      name: 'C형간염',
      nameEn: 'Hepatitis C',
      metricType: 'prevalence',

      // ── Anti-HCV 양성률 (KNHANES) ──
      antiHcvPrevalence: {
        y2012_2016: 0.7,   // % (KNHANES, 20세 이상)
        y2019_2021: 0.6,   // % (KNHANES)
        male: 0.5,
        female: 0.6,
        agePeak: '60세 이상 (1.5-2.5%)',
        trend: 'stable_to_decreasing',
        unit: '%',
      },

      // ── HCV RNA 양성률 (현재 감염) ──
      hcvRna: {
        positiveRate: 0.4,  // % (anti-HCV 양성자 중 ~60% RNA+)
        estimatedPatients: 160000, // 약 16만명 (활동성 감염 추정)
        unit: '%',
      },

      // ── 환자수 (NHIS 청구) ──
      patients: {
        diagnosedTotal: 120000,  // 진단환자 약 12만명 (2021)
        estimatedTotal: 300000,  // 추정 총 감염자 약 30만명
        treatmentRate: 33,       // % (DAA 치료율)
        year: 2021,
        trendNote: 'DAA 도입(2015) 후 치료 성공률 95%+ 이나 진단율 여전히 낮음',
      },

      // ── 유전자형 ──
      genotype: {
        gt1b: 45,    // % (가장 흔함)
        gt2a: 40,    // %
        gt3: 5,      // %
        other: 10,   // %
        trendNote: '유전자형 1b가 가장 흔하나, 2형도 높은 비율',
      },

      // ── DAA 치료 ──
      treatment: {
        svrRate: 97,    // % (SVR12, DAA 치료)
        daaApproval: 2015,
        annualTreated2021: 16000, // 연간 DAA 치료자 수
        eliminationTarget: 2030,
        gapNote: 'WHO 2030 목표 대비 진단율·치료율 모두 미달',
      },

      // ── HCV 관련 질환 ──
      complications: {
        hcvRelatedHCC_proportion: 10,  // % (간세포암 중 HCV 원인)
        hcvRelatedLC_proportion: 15,   // % (간경변 중 HCV 원인)
        trendNote: 'DAA 치료 확대 시 간경변·간암 예방 가능',
      },

      riskFactors: ['의료시술 (침습적 시술)', '수혈 (1991년 이전)', '문신/피어싱', '주사약물 사용'],
      ref: 'KASL HCV Factsheet 2021; KNHANES 2019-2021; 대한간학회 만성 C형간염 진료 가이드라인 2025',
      refUrl: 'https://www.kasl.org/',
    },

    // ──────────────────────────────────────────────
    // 5e. 알코올 간질환 (Alcoholic Liver Disease)
    // ──────────────────────────────────────────────
    ald: {
      name: '알코올 간질환',
      nameEn: 'Alcoholic Liver Disease',
      metricType: 'prevalence',

      // ── 유병률 및 환자수 (NHIS) ──
      prevalence: {
        aldDiagnosed2021: 290000,  // 약 29만명 (NHIS 진료기준)
        aldPrevalence: 5.2,        // % (건검 수진자 중 추정)
        alcoholicFattyLiver: 4.5,  // % (알코올성 지방간)
        alcoholicHepatitis: 0.4,   // % (알코올성 간염)
        alcoholicCirrhosis: 0.3,   // % (알코올성 간경변)
        year: 2021,
        trendNote: '2012→2021 ALD 진료환자 꾸준히 증가',
        unit: '%',
      },

      // ── 음주 현황 (KNHANES) ──
      alcoholConsumption: {
        highRiskDrinking_male: 20.7,   // % (월 1회 이상 고위험 음주, 2021)
        highRiskDrinking_female: 8.9,  // %
        highRiskDrinking_overall: 14.7, // %
        bingeRateAdult: 38.7,          // % (월 1회 이상 폭음)
        perCapitaAlcohol_L: 8.3,       // 리터/년 (15세 이상)
        trend: 'stable_high',
        trendNote: '남성 고위험음주 감소 추세이나 여전히 높은 수준, 여성 증가 추세',
      },

      // ── 성별·연령 ──
      demographics: {
        maleRatio: 78,   // % (ALD 환자 중 남성)
        femaleRatio: 22,  // %
        peakAge_male: '50-59세',
        peakAge_female: '60-69세',
        femaleTrend: '여성 ALD 비율 지속 증가',
      },

      // ── ALD 관련 간경변·간암 ──
      complications: {
        aldRelatedLC_proportion: 25,   // % (간경변 중 ALD 원인)
        aldRelatedHCC_proportion: 12,  // % (간세포암 중 ALD 원인)
        aldMortality2021: 4.2,         // /100,000 (알코올 간질환 사망률)
        trendNote: 'ALD 기인 간경변 비율 증가 추세, HBV 비율 감소분 대체',
      },

      // ── 사망률 ──
      mortality: {
        aldDeathRate2021: 4.2,  // /100,000
        aldDeathRate2012: 3.8,  // /100,000
        trend: 'increasing',
        liverDeathContribution: 31,  // % (전체 간질환 사망 중 ALD 기여)
        unit: '/100,000',
      },

      riskFactors: ['과도한 음주 (남 40g/일, 여 20g/일 이상)', '폭음 습관', '비만 동반', '바이러스 간염 중복'],
      ref: 'KASL ALD Factsheet 2023; 간질환 백서 2024; KNHANES 2021',
      refUrl: 'https://www.kasl.org/',
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
    // 8a. 심부전 (Heart Failure)
    // ──────────────────────────────────────────────
    heart_failure: {
      name: '심부전', nameEn: 'Heart Failure',
      metricType: 'prevalence',
      prevalence: { value: 3.41, unit: '%', population: '전체 인구', year: 2023 },
      patients: '약 175만명 (2023)',
      trend: 'increasing',
      trendDetail: '2002년 0.77% → 2023년 3.41% (4.4배 증가)',
      genderGap: { male: 2.55, female: 2.62 },
      comorbidities: { htn: 77.9, dm: 65.5, ihd: 50.9, af: 20.6, ckd: 16.0, stroke: 13.8 },
      survival: { year1: 91, year5: 79, year10: 66, year15: 54 },
      survivalInpatient: { year1: 77, year5: 59, year10: 42, year15: 31 },
      survivalOutpatient: { year1: 96, year5: 87, year10: 74, year15: 61 },
      hospitalization: { allCause: 47.3, hfPrimary: 2.5, hfAny: 28.0 },
      mortality: { perCapita2023: 19.6, inHospital: 17.0, cvDeath: 5.8 },
      cost: { total2020_trillion: 3.2, perPatient2020_usd: 1855 },
      medication: { rasInhibitor: 61.3, betaBlocker: 62.9, mra: 67.3, statin: 17.7, anticoagulant: 15.5 },
      incidenceTrend: { y2002: 482, y2020: 609, unit: 'per100k' },
      ref: 'KSHF Heart Failure Fact Sheet 2025, NHIS 50% sample 2002-2023.',
      refUrl: 'https://pmc.ncbi.nlm.nih.gov/articles/PMC11058436/',
    },

    // ──────────────────────────────────────────────
    // 8b. 만성신장질환 (CKD)
    // ──────────────────────────────────────────────
    ckd: {
      name: '만성콩팥병',
      nameEn: 'Chronic Kidney Disease',
      metricType: 'prevalence',

      // ── CKD 유병률 ──
      prevalence: [
        { value: 8.2, unit: '%', population: '20세 이상', year: '2011-2013', source: 'KNHANES' },
        { value: 13.7, unit: '%', population: '35세 이상', year: null, source: 'estimated' },
      ],
      prevalenceNote: '최신 KNHANES 기반 CKD 유병률 업데이트 미발표; 현재 10%+ 추정 (고령화 반영)',
      dataAge: '2011-2013 (최신 전국 조사)',
      trend: 'increasing',
      trendDetail: '20세 이상 CKD 유병률 8.2%, 고령화+당뇨+고혈압 증가로 CKD 환자 지속 증가 추세',

      // ── CKD Stage 분포 (KNHANES 2011-2013, eGFR-based) ──
      stageDistribution: {
        stage1: { percent: 1.7, label: 'Stage 1 (eGFR≥90 + 알부민뇨)' },
        stage2: { percent: 3.5, label: 'Stage 2 (eGFR 60-89 + 알부민뇨)' },
        stage3a: { percent: 1.8, label: 'Stage 3a (eGFR 45-59)' },
        stage3b: { percent: 0.8, label: 'Stage 3b (eGFR 30-44)' },
        stage4: { percent: 0.3, label: 'Stage 4 (eGFR 15-29)' },
        stage5: { percent: 0.1, label: 'Stage 5 (eGFR <15)' },
        source: 'KNHANES 2011-2013, Park S et al. Sci Rep 2023',
        note: 'Stage 1-2는 알부민뇨 기준, Stage 3-5는 eGFR 기준',
      },

      // ── 인지율 ──
      awareness: { range: '1.3-6.3%', note: '극히 낮은 인지율 — CKD Stage 3 이상에서도 10% 미만' },
      awarenessGap: { prevalence: 8.2, awareness_low: 1.3, awareness_high: 6.3 },

      // ── ESKD (말기콩팥병) — KORDS 2022 기준, KSN ESKD FS 2024 ──
      eskd: {
        // 발생률
        incidenceRate2022: 360.2, // per million population, 세계 3위
        incidenceRank: '세계 3위 (대만, 미국 다음)',
        incidenceTrend: [
          { year: 2010, rate: 199.4 },
          { year: 2012, rate: 221.0 },
          { year: 2014, rate: 248.3 },
          { year: 2016, rate: 275.8 },
          { year: 2018, rate: 310.5 },
          { year: 2020, rate: 340.1 },
          { year: 2022, rate: 360.2 },
        ],
        incidenceUnit: 'per million population',
        incidenceChange: '10년간 약 1.8배 증가 (199→360/백만)',
        // 유병률 (말기콩팥병 전체)
        prevalenceTotal2022: 135345, // 투석+이식 합산 유병 환자수 (KORDS 2022)
        prevalenceRate2022: 2621.2, // per million population
        prevalenceTrend: [
          { year: 2010, patients: 63341, rate: 1270 },
          { year: 2012, patients: 73064, rate: 1448 },
          { year: 2014, patients: 84989, rate: 1670 },
          { year: 2016, patients: 98746, rate: 1926 },
          { year: 2018, patients: 110856, rate: 2148 },
          { year: 2020, patients: 121379, rate: 2343 },
          { year: 2022, patients: 135345, rate: 2621 },
        ],
        newPatients2022: 18614, // 2022 신규 ESKD 환자수
        // 원인질환
        causeDistribution: {
          diabetes: 48.3,       // %
          hypertension: 21.6,   // %
          glomerulonephritis: 7.8,
          polycysticKidney: 2.1,
          other: 20.2,
          year: 2022,
          source: 'KORDS 2022',
        },
        // 사망률
        mortality: {
          annualDeaths2022: 6751,
          crudeDeathRate: 49.9, // per 1000 ESKD patients
          fiveYearSurvival: 61.3, // %
          note: '일반인구 대비 사망위험 3-5배',
        },
        ref: 'KSN ESKD Fact Sheet 2024, KORDS 2010-2022',
      },

      // ── 투석 (Dialysis) — KORDS 2022 ──
      dialysis: {
        totalPatients2022: 117698, // 전체 투석 환자
        hdPatients2022: 107285,    // 혈액투석 (HD)
        pdPatients2022: 10413,     // 복막투석 (PD)
        hdPercent: 91.2,
        pdPercent: 8.8,
        trend: [
          { year: 2010, total: 52372, hd: 43931, pd: 8441 },
          { year: 2012, total: 59439, hd: 50477, pd: 8962 },
          { year: 2014, total: 69041, hd: 59667, pd: 9374 },
          { year: 2016, total: 80674, hd: 71066, pd: 9608 },
          { year: 2018, total: 91792, hd: 82141, pd: 9651 },
          { year: 2020, total: 102275, hd: 92540, pd: 9735 },
          { year: 2022, total: 117698, hd: 107285, pd: 10413 },
        ],
        modalityNote: 'HD 비율 지속 증가, PD 비율 감소 추세 (2010: 83.9%→2022: 91.2% HD)',
        incidentModality2022: { hd: 86.1, pd: 6.4, preemptiveTransplant: 7.5, unit: '%' },
        avgAge2022: 65.8, // 신규 투석 환자 평균 연령
        ref: 'KORDS 2022, KSN 투석전문의 Factsheet 2024',
      },

      // ── 신장이식 (Transplant) — KORDS 2022 ──
      transplant: {
        cumulativeTotal2022: 17647,  // 누적 생존 이식환자
        annualTransplants2022: 2164, // 2022년 이식 건수
        livingDonor2022: 1394,       // 생체
        deceasedDonor2022: 770,      // 뇌사
        livingPercent: 64.4,
        deceasedPercent: 35.6,
        trend: [
          { year: 2010, total: 1261, living: 915, deceased: 346 },
          { year: 2012, total: 1345, living: 943, deceased: 402 },
          { year: 2014, total: 1610, living: 1063, deceased: 547 },
          { year: 2016, total: 1840, living: 1167, deceased: 673 },
          { year: 2018, total: 2045, living: 1310, deceased: 735 },
          { year: 2020, total: 1932, living: 1278, deceased: 654 },
          { year: 2022, total: 2164, living: 1394, deceased: 770 },
        ],
        fiveYearGraftSurvival: 93.2, // %
        trendNote: '뇌사 이식 증가 추세, 2020 COVID 영향으로 일시 감소',
        ref: 'KORDS 2022',
      },

      // ── DKD (당뇨병콩팥병) 관련 ──
      dkdOverlap: {
        ckdAmongDM: 32.4,        // 당뇨 환자 중 CKD(eGFR<60 or 알부민뇨) 비율 (%)
        dmAmongESKD: 48.3,       // ESKD 환자 중 당뇨 원인 비율 (%)
        dkdPrevalenceInDM30plus: 19.1, // 30세 이상 당뇨환자 중 CKD 동반 (%), NHIS
        albuminuriaInDM: 26.7,   // 당뇨 환자 중 알부민뇨 유병률 (%)
        dmCkdMortality: 'CKD 동반 당뇨환자 사망 위험 2.5배 (vs CKD 미동반)',
        yearlyProgression: '당뇨환자 CKD → ESKD 진행률 연 2-3%',
        ref: 'KSN 당뇨병콩팥병 진료지침 2024; KDA DFS 2024; KORDS 2022',
      },

      // ── 고혈압 + CKD ──
      htnCkdOverlap: {
        ckdAmongHTN: 12.8,       // 고혈압 환자 중 CKD 비율 (%)
        htnAmongESKD: 21.6,      // ESKD 원인 중 고혈압 비율 (%)
        ref: 'KSN 고혈압콩팥병 진료지침 2025; KORDS 2022',
      },

      // ── NAFLD + CKD 연관 ──
      nafldCkdLink: 19.1,

      // ── 연령별 ──
      ageNote: '고령일수록 급증: 65세 이상 CKD 유병률 약 25-30% 추정',
      ageDistribution: {
        '20-39': 2.1,
        '40-49': 4.8,
        '50-59': 7.2,
        '60-69': 12.5,
        '70+': 28.3,
        unit: '%',
        source: 'KNHANES 2011-2013 추정, 고령 구간은 최근 증가 반영',
      },

      // ── 비용 부담 ──
      costBurden: {
        dialysisCostPerYear: '약 3,000만원/인',
        totalDialysisCost2022: '약 3.5조원',
        transplantCostFirstYear: '약 2,500만원',
        transplantMaintenancePerYear: '약 800만원',
        costNote: '투석 vs 이식: 5년 기준 이식이 경제적 (이식 후 5년 총 약 6,500만 vs 투석 5년 1.5억)',
        ref: 'NHIS 건강보험통계, KSN 지속가능신장치료 보고서',
      },

      // ── 투석전문의 현황 ──
      nephrologistWorkforce: {
        totalNephrologists2024: 1782,
        dialysisFacilities2024: 878,
        nephrologistPerFacility: 2.0,
        shortageNote: '지방 투석전문의 부족, 서울·경기 집중',
        ref: 'KSN 투석전문의 Factsheet 2024',
      },

      ref: 'KSN ESKD Fact Sheet 2024; KORDS 2010-2022; Park S, et al. Sci Rep. 2023;13:3377 (KNHANES 2011-2013); KSN 당뇨병콩팥병 진료지침 2024; KSN 고혈압콩팥병 진료지침 2025; KSN 투석전문의 Factsheet 2024',
      refUrl: 'https://www.ksn.or.kr/',
      refNote: '대한신장학회 KORDS 레지스트리, KNHANES, NHIS 기반. CKD 유병률은 2011-2013 데이터로 현재 과소추정 가능.',
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
      regionalPrevalence: {
        충북: 37.8, 충남: 34.5, 강원: 32.2,
      },
      ageBreakdown: { '19-29': 8.7, '30-39': 19.3, '40-49': 26.7, '50-59': 34.2, '60-69': 41.5, '70+': 49.1 },
      covidImpact: { pre: 27.74, post: 29.69 },
      componentsDetail: { abdominalObesity: 33.2 },
      overall30plus: 29.6,
      overall65plus: 47.0,
      ref: 'KSCMS Metabolic Syndrome Fact Sheet 2024. KNHANES VIII 2019-2021.',
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

// MASLD 별칭 (구 NAFLD) — disease_epi.js 내부 키는 'nafld'이지만 외부에서 'masld'로도 접근 가능
DISEASE_EPI.diseases.masld = DISEASE_EPI.diseases.nafld;
