import re, json

with open("/c/Users/82104/Downloads/건강검진통계연보/index.html", "r", encoding="utf-8") as f:
    html = f.read()

# Extract JS data variables
patterns = {
    "FULL_DATA": r"const FULL_DATA\s*=\s*(\{[\s\S]*?\});\s*(?:const|var|let|//|/\*)",
    "TRENDS": r"const TRENDS\s*=\s*(\{[\s\S]*?\});\s*(?:const|var|let|//|/\*)",
    "BMI_PROV": r"const BMI_PROV\s*=\s*(\{[\s\S]*?\});\s*(?:const|var|let|//|/\*)",
    "MET_PROV": r"const MET_PROV\s*=\s*(\{[\s\S]*?\});\s*(?:const|var|let|//|/\*)",
    "LIFESTYLE_DATA": r"const LIFESTYLE_DATA\s*=\s*(\{[\s\S]*?\});\s*(?:const|var|let|//|/\*)",
    "LIFESTYLE_TRENDS": r"const LIFESTYLE_TRENDS\s*=\s*(\{[\s\S]*?\});\s*(?:const|var|let|//|/\*)",
    "KOREA_PATHS": r"const KOREA_PATHS\s*=\s*(\{[\s\S]*?\});\s*(?:const|var|let|//|/\*)",
    "PROV_LABELS": r"const PROV_LABELS\s*=\s*(\{[\s\S]*?\});\s*(?:const|var|let|//|/\*)",
}

for name, pattern in patterns.items():
    m = re.search(pattern, html)
    if m:
        # Write as JS module export
        with open(f"src/data/{name.lower()}.js", "w", encoding="utf-8") as out:
            out.write(f"export const {name} = {m.group(1)};\n")
        print(f"✓ {name}: {len(m.group(1))} chars")
    else:
        print(f"✗ {name}: NOT FOUND")
