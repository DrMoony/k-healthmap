// 한국뇌졸중등록사업 (Korean Stroke Registry, KSR) 2024 Fact Sheet
// 출처: KSR_Stroke_2024_Fact_Sheet_240510.pdf
// 97개 병원, 171,520건 급성 뇌졸중 (2012-2022)
// 68개 지속참여병원 분석

export const STROKE_KSR = {
  registry: { hospitals: 97, coreDB: 81, totalCases: 171520, ischemicCases: 153324, period: '2012-2022' },

  // 뇌졸중 유형 (2022)
  subtypes: {
    ischemic: 89.4,  // %
    ich: 8.1,        // 뇌내출혈
    sah: 2.5,        // 지주막하출혈
  },

  // TOAST 분류 (허혈성, 2022)
  toast: {
    laa: { label: '대혈관 죽상경화', pct: 32.61, trend: 'declining' },
    svo: { label: '소혈관 폐색', pct: 20.69, trend: 'increasing' },
    ce: { label: '심인성 색전', pct: 20.11, trend: 'stable' },
    other: { label: '기타/불명', pct: 26.59 },
  },

  // 위험인자 (허혈성 뇌졸중 환자 중, 2022)
  riskFactors: {
    hypertension: { pct: 67.9, priorKnown: 91 },  // 91% 기존 진단
    dyslipidemia: { pct: 42.5, newDx: 42 },        // 42% 입원 시 첫 진단
    diabetes: { pct: 34.3, priorKnown: 87 },
    smoking: { pct: 21.7, label: '현재 흡연' },
    atrialFib: { pct: 20, newDx: 46 },             // 46% 입원 시 첫 진단!
  },

  // 중증도 (NIHSS, 2022)
  severity: {
    median: 3, iqr: [1, 7],
    minor: { label: 'NIHSS ≤3 (경증)', pct: 54.8, trend: 'improving' },
    moderate: { label: 'NIHSS 4-14', pct: 35.7 },
    severe: { label: 'NIHSS ≥15 (중증)', pct: 9.5, trend: 'declining' },
  },

  // 도착 시간 (2022)
  arrivalTime: {
    within3_5h: 26.2,     // 3.5시간 내 (tPA window)
    within24h: 67.3,
    median_hours: 12,
    trend: '10년간 개선 없음',
  },

  // 재관류 치료 (2022)
  revascularization: {
    ivTpa: { pct: 6.1, trend: 'declining from 10.2%' },
    thrombectomy: { pct: 6.5, trend: 'doubled from 3.0%' },
    combined: { pct: 3.6 },
    total: { pct: 16.3 },
    regionalRange: { min: 12.9, max: 26.1, lowest: '서울', highest: '전북' },
  },

  // 예후 (퇴원 시, 2022)
  outcomes: {
    mrs01: { label: 'mRS 0-1 (좋은 예후)', pct: 44.1, trend: 'improved from 39.7%' },
    mrs02: { label: 'mRS 0-2 (독립적)', pct: 61.2 },
    inHospitalMortality: { pct: 2.6, trend: 'increased from 1.0%' },
  },

  // 인구 특성 (2022)
  demographics: {
    meanAge: 68.8, sd: 13.0,
    maleRatio: 60,
    elderly85plus: { pct: 10.7, trend: 'doubled from 6.6%' },
    female85plus: 15.1,
  },

  // 10년 추이 핵심
  trends: {
    tpaDecline: { from: 10.2, to: 6.1, period: '2012-2022' },
    thrombectomyRise: { from: 3.0, to: 6.5, period: '2012-2022' },
    severityImprove: { nihss15plus_from: 12, nihss15plus_to: 9.5 },
    agingAccelerate: { elderly85_from: 6.6, elderly85_to: 10.7 },
    arrivalNoChange: { within3_5h_2012: 26, within3_5h_2022: 26.2 },
  },

  ref: 'KSR Stroke 2024 Fact Sheet (한국뇌졸중등록사업, 97개 병원 171,520건)',
  refUrl: 'KSR_Stroke_2024_Fact_Sheet_240510.pdf',
};
