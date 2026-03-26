// Data-driven insight engine — generates commentary from province/age data
import { PROVINCE_INFO, NATIONAL_AVG } from './province_info';
import { BMI_PROV } from './bmi_prov';
import { MET_PROV } from './met_prov';
import { TRENDS } from './trends';

const PROVINCES = Object.keys(PROVINCE_INFO);

// Province name mapping for English
const PROV_EN = {
  '서울': 'Seoul', '부산': 'Busan', '대구': 'Daegu', '인천': 'Incheon',
  '광주': 'Gwangju', '대전': 'Daejeon', '울산': 'Ulsan', '세종': 'Sejong',
  '경기': 'Gyeonggi', '강원': 'Gangwon', '충북': 'Chungbuk', '충남': 'Chungnam',
  '전북': 'Jeonbuk', '전남': 'Jeonnam', '경북': 'Gyeongbuk', '경남': 'Gyeongnam',
  '제주': 'Jeju',
};

function pn(name, lang) {
  return lang === 'en' ? (PROV_EN[name] || name) : name;
}

function rank(arr, val, ascending = false) {
  const sorted = [...arr].sort((a, b) => ascending ? a - b : b - a);
  return sorted.indexOf(val) + 1 || arr.length;
}

function trendDirection(values, lang = 'ko') {
  if (!values || values.length < 3) return null;
  const recent = values.slice(-3);
  const diff = recent[recent.length - 1] - recent[0];
  if (lang === 'en') {
    if (diff > 1.5) return 'surging';
    if (diff > 0.5) return 'rising';
    if (diff < -1.5) return 'dropping';
    if (diff < -0.5) return 'declining';
    return 'stable';
  }
  if (diff > 1.5) return '급증';
  if (diff > 0.5) return '증가';
  if (diff < -1.5) return '급감';
  if (diff < -0.5) return '감소';
  return '유지';
}

function trendEmoji(dir) {
  if (dir === '급증' || dir === 'surging') return '🔺';
  if (dir === '증가' || dir === 'rising') return '📈';
  if (dir === '급감' || dir === 'dropping') return '🔻';
  if (dir === '감소' || dir === 'declining') return '📉';
  return '➡️';
}

function isTrendUp(dir) {
  return dir === '급증' || dir === '증가' || dir === 'surging' || dir === 'rising';
}
function isTrendDown(dir) {
  return dir === '급감' || dir === '감소' || dir === 'dropping' || dir === 'declining';
}

// Generate province insight for obesity/metabolic
export function getProvinceInsight(provName, metric, yearIdx, lang = 'ko') {
  const info = PROVINCE_INFO[provName];
  if (!info) return null;

  const src = metric === 'obesity' ? BMI_PROV : MET_PROV;
  const values = src[provName];
  if (!values) return null;

  const val = values[yearIdx];
  const nationalAvg = metric === 'obesity' ? TRENDS.obesity[yearIdx] : TRENDS.metabolic[yearIdx];
  const diff = val - nationalAvg;

  // Rank among provinces
  const allVals = PROVINCES.map(p => src[p]?.[yearIdx]).filter(v => v != null);
  const provRank = rank(allVals, val);
  const totalProvs = allVals.length;

  // Trend
  const trend = trendDirection(values, lang);
  const emoji = trendEmoji(trend);

  // Correlations with socioeconomic factors
  const correlations = [];

  // Aging
  if (info.agingRate > NATIONAL_AVG.agingRate + 3) {
    correlations.push(lang === 'en'
      ? `Aging rate ${info.agingRate}% (nat'l avg ${NATIONAL_AVG.agingRate}%) — contributes to higher metabolic disease prevalence`
      : `고령화율 ${info.agingRate}%로 전국 평균(${NATIONAL_AVG.agingRate}%)보다 높아, 대사질환 유병률 상승에 기여`);
  }

  // GRDP
  const perCapita = Math.round(info.grdp * 1e12 / info.population / 1e4);
  if (perCapita < NATIONAL_AVG.grdpPerCapita - 500) {
    correlations.push(lang === 'en'
      ? `GRDP/capita ${perCapita}M KRW, below national avg — limited healthcare access`
      : `1인당 GRDP ${perCapita}만원으로 전국 대비 낮아, 건강관리 접근성 제한 가능`);
  }

  // Medical access — doctors + unmet medical interpreted together
  const lowDoctors = info.doctorsPerThousand < NATIONAL_AVG.doctorsPerThousand - 0.3;
  const highUnmet = info.unmetMedical > NATIONAL_AVG.unmetMedical + 1.5;
  if (lowDoctors && highUnmet) {
    correlations.push(lang === 'en'
      ? `Doctor density ${info.doctorsPerThousand}/1k (nat'l ${NATIONAL_AVG.doctorsPerThousand}) + unmet medical rate ${info.unmetMedical}% (nat'l ${NATIONAL_AVG.unmetMedical}%) — both supply and access insufficient`
      : `의사밀도 ${info.doctorsPerThousand}명/천명(전국 ${NATIONAL_AVG.doctorsPerThousand}) + 미충족 의료율 ${info.unmetMedical}%(전국 ${NATIONAL_AVG.unmetMedical}%) — 의료 공급과 접근성 모두 부족`);
  } else if (lowDoctors && !highUnmet) {
    correlations.push(lang === 'en'
      ? `Doctor density ${info.doctorsPerThousand}/1k is low, but unmet medical rate ${info.unmetMedical}% is adequate — suggests efficient care delivery`
      : `의사밀도 ${info.doctorsPerThousand}명/천명으로 낮으나 미충족 의료율 ${info.unmetMedical}%로 접근성은 양호 — 효율적 의료 제공 시사`);
  } else if (!lowDoctors && highUnmet) {
    correlations.push(lang === 'en'
      ? `Doctor density ${info.doctorsPerThousand}/1k is adequate, but unmet medical rate ${info.unmetMedical}% is high — review access barriers (cost, time, geography)`
      : `의사밀도 ${info.doctorsPerThousand}명/천명은 충분하나 미충족 의료율 ${info.unmetMedical}%로 높아 — 의료 접근 장벽(비용, 시간, 지리적 요인) 검토 필요`);
  }

  // Health behaviors
  if (info.smokingRate > NATIONAL_AVG.smokingRate + 1.5) {
    correlations.push(lang === 'en'
      ? `Smoking rate ${info.smokingRate}% above national avg — compounding metabolic risk`
      : `흡연율 ${info.smokingRate}%로 전국 대비 높음 — 대사질환 위험 가중`);
  }
  if (info.noExerciseRate > NATIONAL_AVG.noExerciseRate + 3) {
    correlations.push(lang === 'en'
      ? `Exercise deficit rate ${info.noExerciseRate}% — insufficient physical activity`
      : `운동 미실천율 ${info.noExerciseRate}%로 신체활동 부족`);
  }
  if (info.drinkingRate > NATIONAL_AVG.drinkingRate + 2) {
    correlations.push(lang === 'en'
      ? `Heavy drinking rate ${info.drinkingRate}% above national avg`
      : `주2회이상 음주율 ${info.drinkingRate}%로 전국 대비 높음`);
  }

  // Life expectancy
  if (info.lifeExpectancy < NATIONAL_AVG.lifeExpectancy - 1) {
    correlations.push(lang === 'en'
      ? `Life expectancy ${info.lifeExpectancy}yr vs national ${NATIONAL_AVG.lifeExpectancy}yr — below average`
      : `기대수명 ${info.lifeExpectancy}세로 전국(${NATIONAL_AVG.lifeExpectancy}세) 대비 낮음`);
  }

  // Build summary
  const metricName = lang === 'en'
    ? (metric === 'obesity' ? 'Obesity Rate' : 'Metabolic Syndrome')
    : (metric === 'obesity' ? '비만율' : '대사증후군 위험군');

  const statusMap = {
    ko: diff > 3 ? '심각' : diff > 1 ? '주의' : diff > -1 ? '평균' : '양호',
    en: diff > 3 ? 'Critical' : diff > 1 ? 'Warning' : diff > -1 ? 'Average' : 'Good',
  };
  const status = statusMap[lang];
  const statusColor = diff > 3 ? '#ff4444' : diff > 1 ? '#ffd60a' : diff > -1 ? '#8888aa' : '#00ff88';
  const statusEmoji = diff > 3 ? '🚨' : diff > 1 ? '⚠️' : diff > -1 ? '📊' : '✅';

  const provLabel = pn(provName, lang);

  return {
    title: lang === 'en'
      ? `${provLabel} ${metricName} Analysis`
      : `${provName} ${metricName} 분석`,
    status,
    statusColor,
    statusEmoji,
    lines: [
      {
        icon: '📍',
        text: lang === 'en'
          ? `${metricName} ${val}% — #${provRank}/${totalProvs} provinces`
          : `${metricName} ${val}% — 전국 ${provRank}위/${totalProvs}개 시도`,
        color: provRank <= 3 ? '#ff4444' : provRank >= totalProvs - 2 ? '#00ff88' : '#e0e0ff',
      },
      {
        icon: diff > 0 ? '🔴' : '🟢',
        text: lang === 'en'
          ? `vs national avg (${nationalAvg}%): ${diff > 0 ? '+' : ''}${diff.toFixed(1)}%p`
          : `전국 평균(${nationalAvg}%) 대비 ${diff > 0 ? '+' : ''}${diff.toFixed(1)}%p`,
        color: diff > 0 ? '#ff6666' : '#66ffaa',
      },
      {
        icon: emoji,
        text: lang === 'en'
          ? `3yr trend: ${trend} (${values[values.length - 3]?.toFixed(1)}% → ${val}%)`
          : `최근 3년 추세: ${trend} (${values[values.length - 3]?.toFixed(1)}% → ${val}%)`,
        color: isTrendUp(trend) ? '#ff6666' : isTrendDown(trend) ? '#66ffaa' : '#aaa',
      },
    ],
    correlations,
    recommendation: getRecommendation(provName, metric, diff, trend, info, lang),
  };
}

function getRecommendation(provName, metric, diff, trend, info, lang = 'ko') {
  const parts = [];
  const provLabel = pn(provName, lang);

  if (diff > 3 && isTrendUp(trend)) {
    parts.push(lang === 'en'
      ? `${provLabel} has above-average ${metric === 'obesity' ? 'obesity' : 'metabolic syndrome'} rates with rising trend — targeted regional intervention is urgent.`
      : `${provName}은 ${metric === 'obesity' ? '비만율' : '대사증후군'}이 전국 대비 높고 상승 추세로, 지역 맞춤 중재 프로그램이 시급합니다.`);
  } else if (diff > 1) {
    parts.push(lang === 'en'
      ? 'Above national average — enhanced management needed.'
      : '전국 평균 이상으로 관리 강화가 필요합니다.');
  } else if (diff < -1) {
    parts.push(lang === 'en'
      ? 'Below national average — good, but continued monitoring recommended.'
      : '전국 대비 양호한 수준이나, 지속적 모니터링이 권장됩니다.');
  }

  if (info.noExerciseRate > 55) {
    parts.push(lang === 'en'
      ? 'High exercise deficit rate — consider expanding community fitness infrastructure.'
      : '운동 미실천율이 높아 생활체육 인프라 확충을 검토할 필요가 있습니다.');
  }
  if (info.unmetMedical > 9) {
    parts.push(lang === 'en'
      ? 'High unmet medical rate — primary care access improvement should be prioritized.'
      : '미충족 의료율이 높아 1차 의료 접근성 개선이 선행되어야 합니다.');
  }

  return parts.length > 0 ? parts.join(' ') : (lang === 'en'
    ? 'Regular monitoring recommended to maintain current levels.'
    : '현재 수준 유지를 위한 정기 모니터링을 권장합니다.');
}

// Generate age group insight
export function getAgeInsight(ageGroup, metric, gender, lang = 'ko') {
  const metricName = lang === 'en'
    ? (metric === 'obesity' ? 'Obesity Rate' : 'Metabolic Syndrome')
    : (metric === 'obesity' ? '비만율' : '대사증후군');
  const genderName = lang === 'en'
    ? (gender === 'male' ? 'Male' : gender === 'female' ? 'Female' : 'Total')
    : (gender === 'male' ? '남성' : gender === 'female' ? '여성' : '전체');

  // Age-specific observations
  const ageNotesKo = {
    '≤19': `소아·청소년기 비만은 성인 대사질환의 강력한 예측인자입니다. 조기 생활습관 교육이 핵심.`,
    '20-24': `청년층은 독립 생활 시작으로 식습관 변화가 크며, 건강검진 수검률이 낮아 사각지대에 놓이기 쉽습니다.`,
    '25-29': `사회활동 시작과 함께 좌식생활 증가, 식이 불규칙이 심화되는 시기입니다.`,
    '30-34': `대사증후군 유병률이 급격히 증가하기 시작하는 연령대입니다. 30대 검진 강화가 중요합니다.`,
    '35-39': `직장생활 스트레스, 음주 빈도 증가로 내장지방 축적이 가속화됩니다.`,
    '40-44': `비만 유병률이 정점에 근접합니다. 고혈압·당뇨 동반율이 급증하는 시기.`,
    '45-49': `대사증후군 구성요소(혈압·혈당·지질)의 동시 이상 빈도가 가장 높은 연령대 중 하나입니다.`,
    '50-54': `폐경(여성)/테스토스테론 감소(남성)로 인한 호르몬 변화가 체성분에 영향을 미칩니다.`,
    '55-59': `심혈관 이벤트(심근경색, 뇌졸중) 발생률이 급증합니다. 적극적 위험인자 관리 필요.`,
    '60-64': `은퇴 전후 생활패턴 변화가 크며, 약물 순응도 관리가 중요해집니다.`,
    '65-69': `근감소증(sarcopenia) 동반 비만이 증가합니다. BMI만으로 평가 시 위험도를 과소평가할 수 있습니다.`,
    '70-74': `다약제(polypharmacy) 문제가 대사지표 관리를 복잡하게 합니다.`,
    '75-79': `노쇠(frailty)와 비만의 역설적 관계 — 적정 체중 유지가 사망률 감소와 연결됩니다.`,
    '80-84': `고령에서는 BMI보다 기능적 상태(ADL)와 영양상태가 더 중요한 지표입니다.`,
    '85+': `초고령에서는 체중 감소가 오히려 위험 신호일 수 있습니다. 개별화된 접근이 필수.`,
  };

  const ageNotesEn = {
    '≤19': 'Childhood/adolescent obesity is a strong predictor of adult metabolic disease. Early lifestyle education is key.',
    '20-24': 'Young adults face major dietary changes with independent living; low screening rates create a blind spot.',
    '25-29': 'Sedentary lifestyle increases and dietary irregularity intensifies as careers begin.',
    '30-34': 'Metabolic syndrome prevalence begins rising sharply. Enhanced screening in the 30s is important.',
    '35-39': 'Work stress and increased alcohol frequency accelerate visceral fat accumulation.',
    '40-44': 'Obesity prevalence nearing its peak. Hypertension and diabetes comorbidity rates surge.',
    '45-49': 'One of the age groups with highest simultaneous abnormalities in BP, glucose, and lipids.',
    '50-54': 'Hormonal changes (menopause in women / testosterone decline in men) affect body composition.',
    '55-59': 'Cardiovascular event rates (MI, stroke) surge. Aggressive risk factor management needed.',
    '60-64': 'Major lifestyle pattern changes around retirement; medication adherence management becomes important.',
    '65-69': 'Sarcopenic obesity increases. BMI alone may underestimate risk.',
    '70-74': 'Polypharmacy complicates metabolic marker management.',
    '75-79': 'Paradoxical relationship between frailty and obesity — maintaining adequate weight is linked to reduced mortality.',
    '80-84': 'In the elderly, functional status (ADL) and nutritional state are more important indicators than BMI.',
    '85+': 'In the very elderly, weight loss can be a warning sign. Individualized approaches are essential.',
  };

  const ageNotes = lang === 'en' ? ageNotesEn : ageNotesKo;

  return {
    title: lang === 'en'
      ? `${ageGroup} ${genderName} ${metricName}`
      : `${ageGroup}세 ${genderName} ${metricName}`,
    note: ageNotes[ageGroup] || '',
  };
}
