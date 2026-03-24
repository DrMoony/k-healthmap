# NAFLD Fact Sheet 2023 - Data Extraction

## Overview
Complete numerical data extraction from the NAFLD Fact Sheet 2023 published by the Korean Association for the Study of the Liver (KASL).

## Source Document
- **Title**: NAFLD Fact Sheet 2023 (비알코올 지방간질환 팩트시트)
- **Organization**: KASL (Korean Association for the Study of the Liver)
- **URL**: https://kasl.org/eng/html/file/NAFLD%20FACT%20SHEET%202023.pdf
- **Data Source**: National Health Insurance Service (국민건강보험공단)
- **Pages**: 26
- **Extraction Date**: 2026-03-19

## Files in This Directory

### Primary Output
- **nafld_2023.json** (17 KB) - Complete structured data in JSON format
  - Machine-readable format with hierarchical organization
  - 4 main sections corresponding to document structure
  - 300+ numerical data points

### Supporting Files
- **EXTRACTION_SUMMARY.txt** - Detailed summary of extracted data by section
- **nafld_2023_text.txt** - Raw text extraction from PDF
- **nafld_2023_raw.pdf** - Original source PDF document

## JSON Structure

```
nafld_2023.json
├── document (metadata)
├── section_1_prevalence (10-year prevalence by age/gender)
├── section_2_incidence (incident cases 2010-2023)
├── section_3_comorbidities_and_costs (single, dual, triple, quad comorbidities + costs)
└── section_4_progression_and_mortality (5 conditions tracked)
    ├── malignancy_progression_2_year_followup
    ├── ischemic_heart_disease_progression_2_year_followup
    ├── ischemic_stroke_progression_2_year_followup
    ├── liver_cirrhosis_progression_2_year_followup
    ├── hepatocellular_carcinoma_progression_2_year_followup
    ├── 10_year_progression_2010_baseline
    └── mortality_10_year_followup_2010_baseline
```

## Data Coverage

### 1. Prevalence (Section 1)
- **Time Period**: 2012 vs 2022 (10-year comparison)
- **Age Groups**: 8 categories (20-29 through 80+)
- **Gender**: Male and Female separated
- **Data Points**: ~56 prevalence percentages

### 2. Incidence (Section 2)
- **Time Period**: 2010-2023 (14-year trend)
- **Incident Cases**: 733,291 to 1,978,847 patients/year
- **Incident Rates**: 5 time points × 8 age groups × 2 genders
- **Regional Data**: 16 Korean provinces with prevalence and medical costs
- **Data Points**: ~150+ incidence figures

### 3. Comorbidities & Medical Costs (Section 3)
- **Total NAFLD Patients**: 4.2M (2012) to 7.7M (2022)
- **Single Comorbidities**: 4 conditions tracked (Hypertension, Diabetes, Hyperlipidemia, CKD)
- **Multiple Comorbidities**: 11 combinations (dual, triple, quadruple)
- **Medical Costs**: NAFLD patients vs control group (KRW)
- **Data Points**: ~40 comorbidity and cost figures

### 4. Progression & Mortality (Section 4)
- **2-Year Follow-up Progression**: 5 conditions (Malignancy, Ischemic Heart Disease, Ischemic Stroke, Liver Cirrhosis, Hepatocellular Carcinoma)
- **Time Points**: 2010, 2015, 2020
- **Age Range**: 20-29 to 80+ years
- **10-Year Progression**: 14 age-gender combinations × 5 conditions = 70 data points
- **Mortality**: 10-year follow-up from 2010 baseline (ages 20-69)
- **Data Points**: ~150+ progression and mortality figures

## Key Findings Summary

### Prevalence Trends (2012→2022)
- **Male 60-69**: 14.84% → 20.67% (↑39%)
- **Female 70-79**: 18.16% → 27.45% (↑51%)
- **Overall increase across all age groups and genders**

### Comorbidity Increases
- **Hypertension**: 34.5% → 42.3% (+7.8pp)
- **Hyperlipidemia**: 1.9% → 8.1% (+6.2pp)
- **Chronic Kidney Disease**: 1.1% → 19.1% (+18.0pp)

### Medical Cost Increases
- **NAFLD Patients Medical Cost**: 787,579 KRW → 2,124,312 KRW (+170%)
- **Pharmaceutical Cost**: 349,549 KRW → 837,472 KRW (+140%)

### Disease Progression (10-year from 2010)
- **Males 80+**: 32.43% malignancy, 27.29% ischemic heart disease
- **Females 80+**: 14.57% malignancy, 23.38% ischemic heart disease
- **Liver Cirrhosis**: Higher in females 80+ (21.99%) vs males 80+ (3.94%)

## Data Quality Notes
- All percentages clearly labeled with unit markers
- Patient counts provided for major categories
- Time series data consistent from 2010-2023
- Regional variations documented for all 16 provinces
- Gender stratification available for prevalence and incidence measures
- Comprehensive comorbidity tracking with both absolute numbers and percentages

## Usage
The JSON file is structured for easy programmatic access:
- Use `section_1_prevalence` for epidemiological prevalence studies
- Use `section_2_incidence` for disease burden assessment
- Use `section_3_comorbidities_and_costs` for health economics analysis
- Use `section_4_progression_and_mortality` for prognosis and outcomes research

## Extraction Method
- Text extraction: pdftotext (from PDF Tools)
- Data parsing: Manual extraction from structured text output
- Format: JSON with UTF-8 encoding for Korean character support

## Notes
- All monetary values in Korean Won (KRW)
- Percentages represent prevalence/incidence/progression rates
- Ages 70+ excluded from mortality analysis due to natural mortality bias
- Data represents South Korean population only
- Source: National Health Insurance claims database
