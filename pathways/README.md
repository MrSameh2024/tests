# Learning Pathways (Tasks 17–24) — development branch only

Not merged, not live. Review on `dev/learning-pathways` first.

| File | What it is |
|---|---|
| `../ssh-pathways.js` | Engine. After **Check**, it adds a bilingual pathway card under every wrong answer and a **My Revision Plan · خطتي للمراجعة** box under the result. |
| `<page>.js` | Generated item → skill tags, skills and verified resources for that test page. |
| `skills.js` | All skills (for `my-revision-plan.html`). |
| `../my-revision-plan.html` | The student dashboard: gaps, lessons and worksheets, practice, completed, follow-up, improvement. |
| `curriculum-map.csv / .json` | Task 18 map: Grade → Term → Module → Lesson → Skill → Objective → Resource. |
| `tag-report.txt` | Every tagged item, for teacher review. |
| `../src/pathways/` | Sources: `catalog.py` (skills + verified module refs), `tag.py` (tagger/builder), `integrate.py` (adds the script tags), `Pathways.gs` (teacher summary tab). |

Rebuild after changing a test or the catalogue:

```
python3 src/pathways/tag.py .
python3 src/pathways/integrate.py . <version>
```

Rules kept: no invented modules, lessons, book pages or URLs. Anything not stated in Smart Students Hub's own materials shows **Not Yet Mapped · لم يُربط بعد**. Every link points to an existing file in this repo, for the same grade. No personal data in any link.
