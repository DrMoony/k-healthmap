# K-HealthMap — React 리빌드 프로젝트

> 건강검진통계연보 10개년 + 질환 팩트시트 기반 인터랙티브 대시보드
> 키치한 데이터 시각화 · 다크 UI · RPG/게임 감성

## 프로젝트 위치
- **소스**: `D:\Google Drive\k-healthmap\`
- **원본 HTML**: `C:\Users\82104\Downloads\건강검진통계연보\index.html`
- **배포**: https://drmoony.github.io/k-healthmap (GitHub Pages)

## 기술 스택
| 역할 | 라이브러리 |
|------|-----------|
| 프레임워크 | React 19 + Vite 8 |
| 고급 시각화 | D3.js (Sankey, chord, force graph) |
| 노드/스킬트리 | @xyflow/react (React Flow) |
| 차트 | @nivo/* (sankey, chord, network, treemap, line, bar, heatmap) |
| 애니메이션 | Framer Motion |
| 디자인 | 다크 사이버펑크 테마 (커스텀 CSS, 네온 글로우) |

## 데이터 소스

### 건강검진통계연보 (추출 완료)
| 파일 | 내용 |
|------|------|
| `src/data/full_data.js` | 18개 검진항목 × 17시도 × 15연령대 × 3성별 (102KB) |
| `src/data/trends.js` | 수검률/비만율/대사증후군 10년 추이 |
| `src/data/bmi_prov.js` | 시도별 비만율 10년 추이 |
| `src/data/met_prov.js` | 시도별 대사증후군 10년 추이 |
| `src/data/lifestyle_data.js` | 흡연/음주/운동 현황 |
| `src/data/lifestyle_trends.js` | 생활습관 10년 추이 |
| `src/data/korea_paths.js` | SVG 지도 path 데이터 |
| `src/data/prov_labels.js` | 시도별 라벨 좌표 |

### 질환 팩트시트 (JSON 파싱 완료, 대시보드 미통합)
| 파일 | 출처 |
|------|------|
| `src/data/nafld_2023.json` | KASL NAFLD Fact Sheet 2023 |
| `src/data/diabetes_2024.json` | 당뇨병 팩트시트 2024 |
| `src/data/dyslipidemia_2024.json` | 이상지질혈증 팩트시트 2024 |
| `src/data/cardiovascular_2022.json` | 심혈관질환 팩트시트 2022 |
| `src/data/historical_trends.json` | 질환별 역사적 추세 |

### 사회경제 데이터 (추가 완료)
| 파일 | 내용 |
|------|------|
| `src/data/province_info.js` | 17시도별 인구, GRDP, 고령화율, 상급종합병원, 의사밀도 |

---

## 완료된 작업 (Phase 1)

### 프로젝트 세팅
- [x] React + Vite 프로젝트 초기화
- [x] 시각화 라이브러리 설치 (D3, Nivo, React Flow, Framer Motion)
- [x] 원본 HTML에서 데이터 추출 → JS 모듈로 변환
- [x] 팩트시트 JSON 복사
- [x] 다크 테마 디자인 시스템 (`theme.js`, `global.css`)

### Overview 페이지
- [x] NavBar — 탭 네비게이션 (종합현황, 대사질환, 검진항목, 생활습관, 질환네트워크)
- [x] KPI 카드 4개 — 카운팅 애니메이션, 클릭 → 상세 패널
- [x] 한국 지도 — 비만율/대사증후군 토글, 지역 호버/클릭
- [x] 색상 그라데이션 개선 — 단일 색상 계열 (밝음=건강, 어둠=비건강)
- [x] 연도 슬라이더 — 2015-2024 드래그
- [x] 지역 라벨 클릭 → 상세 패널 연동
- [x] 울릉도/독도 표기
- [x] 범례 바 추가
- [x] Detail 패널 — KPI 클릭 시 10년 추세 + 연도별 수치
- [x] Detail 패널 — 지역 클릭 시 비만율/대사증후군 추세
- [x] Detail 패널 — 지역 사회경제 데이터 6개 뱃지 (인구, GRDP, 고령화율, 상급종합, 의사밀도, 의료접근도)
- [x] 한 화면(viewport) 레이아웃 — 스크롤 없음

---

## TODO (Phase 2~)

### Phase 2: Overview 완성도
- [ ] 제주도 SVG path/viewBox 확인 — 현재 보이지 않을 수 있음
- [ ] 지도 크기 최적화 — 좌측 패널 내에서 적절한 비율
- [ ] 반응형 대응 (태블릿/모바일)
- [ ] KPI 카드 + 지도 + 상세패널 간 연동 UX 개선

### Phase 3: 대사질환 탭
- [ ] 비만율/대사증후군 전용 상세 뷰
- [ ] 연령대별 × 시도별 히트맵 (Nivo Heatmap)
- [ ] 성별 비교 차트
- [ ] 시도별 순위 바 차트 (전국 평균 기준선 포함)

### Phase 4: 검진항목 상세 탭
- [ ] 18개 검진항목 선택 드롭다운
- [ ] 시도별 스택 바 차트
- [ ] 연령대별 스택 바 차트
- [ ] 성별 토글 / 정렬 토글 / 이상소견 포커스
- [ ] 바 클릭 → 상세 패널 드릴다운

### Phase 5: 생활습관 탭
- [ ] 흡연/음주/운동 선택
- [ ] 시도별 비교 차트
- [ ] 10년 추이 (흡연율, 음주율)

### Phase 6: 질환 네트워크 탭 (핵심 키치 기능)
- [ ] **Sankey diagram** — 검진 이상소견 → 질환 발전 경로 (NAFLD → 간경변 → HCC 등)
- [ ] **Force-directed graph** — 질환-위험인자 관계 네트워크
- [ ] **스킬트리형 노드그래프** (React Flow) — 대사증후군 구성요소 간 관계
  - 비만 → 당뇨/이상지질혈증/고혈압 → NAFLD/심혈관/신장 → 사망
  - 노드 클릭 시 해당 질환 팩트시트 데이터 표시
  - RPG 스킬트리 느낌의 인터랙션 (잠금/해제, 레벨, 연결선 애니메이션)
- [ ] **Chord diagram** — 동반질환 조합 빈도 (NAFLD 팩트시트 comorbidity 데이터)
- [ ] 팩트시트 JSON 데이터 통합 (NAFLD, 당뇨, 이상지질혈증, 심혈관)

### Phase 7: 고급 시각화
- [ ] 3D 지구본 (Three.js / React Three Fiber) — 한국 하이라이트 + 국제 비교
- [ ] Treemap — 검진항목별 이상소견 비율 전체 뷰
- [ ] 레이더 차트 — 시도별 건강지표 프로파일 (비만율, 흡연율, 음주율, 운동, 수검률)
- [ ] Bump chart — 시도별 순위 변동 10년 추이

### Phase 8: 배포 & 공유
- [ ] GitHub repo (`DrMoony/k-healthmap`) 정리
- [ ] GitHub Pages 배포 (Vite build → gh-pages)
- [ ] SEO 메타 태그 (Open Graph)
- [ ] 영어 버전 토글
- [ ] 데이터 출처/방법론 페이지

---

## 디자인 원칙

### 비전
- **전서연 (Seoyeon Jun)** 스타일 참고 — Tableau 기반 키치한 인포그래픽
- 보편적이지 않은 시각화 기법을 효과적으로 차용 (Sankey, chord, force graph, skill tree)
- **RPG 게임 UI 감성** — 스킬트리, 노드 그래프, 네온 글로우
- **"대시보드"보다 "인터랙티브 아트"에 가까운 경험**

### 테마
- 다크 배경 (#0a0a0f)
- 네온 악센트 (cyan #00d4ff, magenta #ff006e, gold #ffd60a, green #00ff88)
- JetBrains Mono (숫자/데이터) + Noto Sans KR (한글)
- 글로우 이펙트, 그래디언트, 블러 글래스모피즘

### UX 원칙
- **한 화면에 다 보여라** — 스크롤 최소화
- **클릭 → 드릴다운** — 모든 요소가 클릭 가능, 상세 정보 연결
- **호버 → 컨텍스트** — 마우스오버 시 즉시 정보 제공
- **애니메이션은 의미 있게** — 장식이 아닌 데이터 전환/강조 목적

---

## 참고
- 원본 프로젝트 문서: `C:\Users\82104\Downloads\건강검진통계연보\project-documentation.md`
- 데이터 파이프라인: openpyxl → JSON → JS 모듈
- 원본 디자인: 수묵화/한지 톤 → React에서 다크 사이버펑크로 전환
