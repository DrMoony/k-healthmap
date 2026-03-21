// 출처: 행정안전부 주민등록인구(2024.12), 통계청 GRDP(2023), 통계청 고령자통계(2024),
// 보건복지부 제5기 상급종합병원(2024~2026), KOSIS 의사수(2022),
// 질병관리청 지역사회건강조사(2023) 미충족 의료경험률,
// 건강검진통계연보(2024) 흡연·음주·운동, 기대수명: 통계청(2022)

// 전국 평균 (가중평균 기준)
export const NATIONAL_AVG = {
  grdpPerCapita: 4249,        // 만원, 통계청 2023
  agingRate: 19.2,            // %, 통계청 2024
  tertiaryHospitals: 47,      // 전국 총계, 복지부 제5기
  doctorsPerThousand: 2.13,   // KOSIS 2022
  unmetMedical: 7.3,          // %, 지역사회건강조사 2023
  smokingRate: 18.3,          // %, 현재흡연율, 건강검진통계연보
  drinkingRate: 21.5,         // %, 주2회이상 음주율
  noExerciseRate: 51.8,       // %, 고강도 운동 미실천율 (0일)
  lifeExpectancy: 83.6,       // 세, 통계청 2022
};

export const PROVINCE_INFO = {
  "서울": {
    population: 9386000, grdp: 547.6, agingRate: 19.4, tertiaryHospitals: 14, doctorsPerThousand: 3.37,
    unmetMedical: 6.2, smokingRate: 14.6, drinkingRate: 21.7, noExerciseRate: 49.7, lifeExpectancy: 84.4,
    tertiaryList: ["서울대학교병원","서울아산병원","삼성서울병원","세브란스병원","가톨릭대 서울성모병원","강남세브란스병원","강북삼성병원","건국대학교병원","경희대학교병원","고려대 구로병원","고려대 안암병원","이화여대 목동병원","중앙대학교병원","한양대학교병원"],
  },
  "부산": {
    population: 3260000, grdp: 114.2, agingRate: 23.9, tertiaryHospitals: 4, doctorsPerThousand: 2.42,
    unmetMedical: 7.8, smokingRate: 16.8, drinkingRate: 20.3, noExerciseRate: 51.6, lifeExpectancy: 82.3,
    tertiaryList: ["부산대학교병원","고신대 복음병원","동아대학교병원","인제대 부산백병원"],
  },
  "대구": {
    population: 2354000, grdp: 73.1, agingRate: 20.9, tertiaryHospitals: 5, doctorsPerThousand: 2.55,
    unmetMedical: 5.9, smokingRate: 17.8, drinkingRate: 19.1, noExerciseRate: 56.2, lifeExpectancy: 83.5,
    tertiaryList: ["경북대학교병원","계명대 동산병원","대구가톨릭대병원","영남대학교병원","칠곡경북대병원"],
  },
  "인천": {
    population: 2980000, grdp: 116.9, agingRate: 17.7, tertiaryHospitals: 3, doctorsPerThousand: 1.78,
    unmetMedical: 7.5, smokingRate: 20.0, drinkingRate: 22.6, noExerciseRate: 50.2, lifeExpectancy: 83.0,
    tertiaryList: ["가천대 길병원","가톨릭대 인천성모병원","인하대학교병원"],
  },
  "광주": {
    population: 1416000, grdp: 51.9, agingRate: 17.5, tertiaryHospitals: 2, doctorsPerThousand: 2.62,
    unmetMedical: 5.4, smokingRate: 16.6, drinkingRate: 20.0, noExerciseRate: 51.7, lifeExpectancy: 83.3,
    tertiaryList: ["전남대학교병원","조선대학교병원"],
  },
  "대전": {
    population: 1443000, grdp: 54.0, agingRate: 18.0, tertiaryHospitals: 2, doctorsPerThousand: 2.56,
    unmetMedical: 5.7, smokingRate: 17.2, drinkingRate: 20.7, noExerciseRate: 50.2, lifeExpectancy: 83.8,
    tertiaryList: ["충남대학교병원","건양대학교병원"],
  },
  "울산": {
    population: 1106000, grdp: 89.9, agingRate: 17.2, tertiaryHospitals: 1, doctorsPerThousand: 1.62,
    unmetMedical: 7.1, smokingRate: 21.0, drinkingRate: 22.1, noExerciseRate: 45.4, lifeExpectancy: 83.1,
    tertiaryList: ["울산대학교병원"],
  },
  "세종": {
    population: 394000, grdp: 16.7, agingRate: 11.6, tertiaryHospitals: 0, doctorsPerThousand: 1.23,
    unmetMedical: 8.9, smokingRate: 14.4, drinkingRate: 20.9, noExerciseRate: 46.3, lifeExpectancy: 85.2,
    tertiaryList: [],
  },
  "경기": {
    population: 13780000, grdp: 593.6, agingRate: 16.6, tertiaryHospitals: 6, doctorsPerThousand: 1.73,
    unmetMedical: 7.0, smokingRate: 18.6, drinkingRate: 22.2, noExerciseRate: 50.2, lifeExpectancy: 84.0,
    tertiaryList: ["분당서울대병원","아주대학교병원","고려대 안산병원","순천향대 부천병원","가톨릭대 성빈센트병원","한림대 성심병원"],
  },
  "강원": {
    population: 1527000, grdp: 62.1, agingRate: 24.6, tertiaryHospitals: 2, doctorsPerThousand: 1.90,
    unmetMedical: 8.3, smokingRate: 19.3, drinkingRate: 21.5, noExerciseRate: 52.2, lifeExpectancy: 82.5,
    tertiaryList: ["원주세브란스기독병원","강릉아산병원"],
  },
  "충북": {
    population: 1597000, grdp: 88.2, agingRate: 21.2, tertiaryHospitals: 1, doctorsPerThousand: 1.76,
    unmetMedical: 7.6, smokingRate: 20.9, drinkingRate: 22.3, noExerciseRate: 53.8, lifeExpectancy: 82.7,
    tertiaryList: ["충북대학교병원"],
  },
  "충남": {
    population: 2132000, grdp: 142.6, agingRate: 21.5, tertiaryHospitals: 1, doctorsPerThousand: 1.54,
    unmetMedical: 8.1, smokingRate: 21.3, drinkingRate: 22.3, noExerciseRate: 56.1, lifeExpectancy: 82.9,
    tertiaryList: ["단국대학교병원"],
  },
  "전북": {
    population: 1748000, grdp: 64.2, agingRate: 24.3, tertiaryHospitals: 2, doctorsPerThousand: 2.09,
    unmetMedical: 6.8, smokingRate: 17.3, drinkingRate: 19.3, noExerciseRate: 57.3, lifeExpectancy: 82.1,
    tertiaryList: ["전북대학교병원","원광대학교병원"],
  },
  "전남": {
    population: 1802000, grdp: 98.1, agingRate: 26.8, tertiaryHospitals: 1, doctorsPerThousand: 1.72,
    unmetMedical: 9.4, smokingRate: 17.4, drinkingRate: 20.4, noExerciseRate: 56.4, lifeExpectancy: 82.0,
    tertiaryList: ["화순전남대병원"],
  },
  "경북": {
    population: 2539000, grdp: 127.5, agingRate: 25.5, tertiaryHospitals: 0, doctorsPerThousand: 1.38,
    unmetMedical: 9.1, smokingRate: 19.4, drinkingRate: 19.9, noExerciseRate: 59.7, lifeExpectancy: 82.2,
    tertiaryList: [],
  },
  "경남": {
    population: 3240000, grdp: 137.7, agingRate: 21.2, tertiaryHospitals: 3, doctorsPerThousand: 1.63,
    unmetMedical: 7.9, smokingRate: 19.0, drinkingRate: 21.6, noExerciseRate: 52.1, lifeExpectancy: 82.6,
    tertiaryList: ["경상국립대병원","삼성창원병원","양산부산대병원"],
  },
  "제주": {
    population: 676000, grdp: 26.0, agingRate: 18.4, tertiaryHospitals: 0, doctorsPerThousand: 2.28,
    unmetMedical: 10.2, smokingRate: 18.9, drinkingRate: 25.4, noExerciseRate: 51.5, lifeExpectancy: 83.4,
    tertiaryList: [],
  },
};
