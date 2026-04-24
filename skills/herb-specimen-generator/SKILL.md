---
name: herb-specimen-generator
description: Generate Chinese medicine herb specimen images using AI. Use this skill when the user wants to create botanical/animal illustrations of traditional Chinese medicine ingredients (e.g., "生成人参、黄芪的植物标本图", "画一张薄荷和牛蒡子的图鉴", "绘制中药材标本"). Supports dynamic layout (single image for 1 herb, 1×2 for 2 herbs, 2×2 for 4 herbs) and automatic AI identification/naming.
---

# Chinese Medicine Herb Specimen Generator

Generate high-quality botanical/animal specimen illustrations for traditional Chinese medicine ingredients using SeedDream 4.5M model, with automatic cropping and AI-powered identification/naming.

## Workflow

1. **Collect herb names** - User provides Chinese medicine names (1-N herbs)
2. **Generate composite image** - Call SeedDream API with proper layout
3. **Crop into individual images** - Split based on layout
4. **Identify and rename** - Use Qwen VL multimodal model to name each herb image
5. **Save to output directory** - Organized files ready for use

## Layout Strategy

**Only accepts 1, 4, or 9 herbs** - ensures perfectly square output images (suitable for game UI ItemSlotComponent 60×60).

| Number of Herbs | Layout | Output Size (from 4096×4096) |
|-----------------|--------|------------------------------|
| 1 herb | 1×1 | Single 4096×4096 image |
| 4 herbs | 2×2 | Four 2048×2048 images (square) |
| 9 herbs | 3×3 | Nine 1365×1365 images (square) |

**If herb count ≠ 1, 4, or 9**: Skill asks user to adjust.

| User Request | Skill Response |
|--------------|----------------|
| 2 herbs | "请调整为1、4或9种药材。当前2种无法生成正方形切分图" |
| 3 herbs | "请调整为1、4或9种药材。当前3种无法生成正方形切分图" |
| 5-8 herbs | "请调整为4种，或增加到9种药材" |
| 10+ herbs | "请分批生成，每批使用1、4或9种药材" |

## Prompt Template

The image generation prompt follows this pattern:

```
有一定透明度玻璃质感的背景、在一个图片中生成{herb_names}这{count}种中药材的植物、动物形态的图鉴，
要求1比1还原，摄影风格，完美还原植物、动物细节，
每个植物、动物下方写明名称，名称无边框白色字体，
{layout_description}
```

**Layout descriptions:**
- 1 herb: "居中展示"
- 4 herbs: "2×2四宫格布局"
- 9 herbs: "3×3九宫格布局"

## API Configuration

Credentials are stored in `.env`:

| Service | Variable | Purpose |
|---------|----------|---------|
| SeedDream (Image Gen) | `SEED_IMAGE_URL`, `SEED_IMAGE_KEY`, `SEED_MODEL_NAME` | Generate specimen images |
| Qwen VL (Vision) | `QWEN_VL_URL`, `QWEN_VL_KEY`, `QWEN_VL_MODEL_NAME` | Identify herbs |

## Output

Generated files are saved to `tests/assets/herb_processed/` (fixed directory).

File naming format: `{herb_name}.png`
- Example: `人参.png`, `薄荷.png`, `牛蒡子.png`
- **Overwrites existing files** - ensures single standard image per herb

**Naming behavior:**
- AI identifies herb → saves as `{name}.png`
- If file exists → **overwrites without warning** (keeps game assets clean)
- No batch numbers in filename (cleaner asset management)

**Example 1: Single herb**
```
User: 生成一张人参的植物标本图
→ Generates single 4096×4096 image → No cropping → AI identifies → Saves as "人参.png"
```

**Example 2: Four herbs (standard)**
```
User: 生成葱白、薄荷叶、牛蒡子、蝉蜕这4种中药材的标本图
→ Generates 2×2 composite → Crops into 4 square images (2048×2048 each) → AI names each → Saves 4 files: 葱白.png, 薄荷叶.png, 牛蒡子.png, 蝉蜕.png
```

**Example 3: Nine herbs**
```
User: 绘制9种解表药的标本图：麻黄、桂枝、紫苏叶、生姜、荆芥、防风、白芷、细辛、苍耳子
→ Generates 3×3 composite → Crops into 9 square images (1365×1365 each) → AI names each → Saves 9 files: 麬.png, 桂枝.png, etc.
```

**Example 4: Invalid count**
```
User: 绘制6种解表药：麻黄、桂枝、紫苏叶、生姜、荆芥、防风
→ Skill responds: "请调整为4种，或增加到9种药材。6种无法生成正方形切分图"
→ User: "那就生成4种：麻黄、桂枝、紫苏叶、生姜"
→ Proceeds with 4 herbs (2×2 layout) → Saves 4 files: 麬.png, 桂枝.png, etc.
```

**Example 5: Many herbs (batch)**
```
User: 绘制13种药材的标本图
→ Skill responds: "请分批生成。建议：第1批9种，第2批4种。是否同意？"
→ User confirms → Generates 2 batches → Total 13 output files (named by herb, no batch numbers)
```

**Example 6: Overwriting existing files**
```
User: 更新薄荷的标本图
→ Generates single image → AI identifies as "薄荷" → Overwrites tests/assets/herb_processed/薄荷.png
```

## Implementation Scripts

The skill uses two Python scripts located in `scripts/`:

### 1. `generate_herb_image.py`
Generates the composite specimen image using SeedDream API.

**Key features:**
- Dynamic prompt construction based on herb count
- Proper layout specification
- API call with watermark removal
- Error handling and retry logic

### 2. `crop_and_identify.py`
Crops the composite image and identifies each herb using Qwen VL.

**Key features:**
- Layout-aware cropping (1×2, 2×2, triangle, single)
- Multimodal AI identification
- Automatic file naming
- Duplicate handling (adds position suffix if needed)

## Technical Notes

- **Image resolution**: 4096×4096 (4K square)
- **No watermark**: API configured to remove watermarks
- **Quality settings**: Photography style, photorealistic detail
- **Batch tracking**: Sequential numbering for multi-batch operations

## Error Handling

| Situation | Handling |
|-----------|----------|
| API timeout | Retry 3 times with 5s delay |
| Identification failure | Use placeholder name `herb_{position}` |
| Duplicate filename | Add position suffix (e.g., `薄荷_左上.png`) |
| Invalid herb name | Ask user to clarify |

## Advanced Options

Users can customize:
- **Output directory**: Specify save location
- **Image style**: Override default "photography style"
- **Naming convention**: Use custom naming pattern
- **Skip identification**: Manual naming instead of AI

---

To use this skill, simply provide the herb names and the skill will handle generation, cropping, and naming automatically.