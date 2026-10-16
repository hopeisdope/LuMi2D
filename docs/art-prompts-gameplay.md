# Art prompts for the gameplay round (ChatGPT)

Status: all six delivered and integrated on 2026-10-16 (`public/sprites/`). Kept for regenerating.

The new elements from the 2026-10-16 gameplay round are drawn in code. These prompts produce matching sprites
in the same style as the existing cars and friends. Paste the **style prompt** from the first sprite round
first (same chat), then one prompt per message. Save the PNGs into `art-incoming/` with the names below; the
processing script (`scripts/process-sprites.py`) then needs a small extension per asset, and the code keeps the
drawn version as fallback.

Style reminder (if starting a new chat): cheerful picture-book cartoon for toddlers, flat colours, thick rounded
dark-navy outline (#1E3A6E), friendly faces, fully transparent background, no text, no ground, no shadow.

| File | Prompt |
|---|---|
| `scene-ducks.png` | Sprite sheet, transparent background: a white mother duck and a small yellow duckling, side view facing RIGHT, each in two walking frames (left foot / right foot forward). Four figures in one row, evenly spaced, same baseline: mother frame 1, mother frame 2, duckling frame 1, duckling frame 2. |
| `scene-sheep.png` | Sprite sheet, transparent background: a fluffy white sheep with a dark grey face, side view facing RIGHT, two poses in one row: standing calmly, and mid-hop with legs tucked and a happy face. Same size, same baseline. |
| `pad.png` | A small trampoline seen from the side: bright mint-green bouncy mat on short navy legs with visible silver springs, very playful, wider than tall (about 5:1). Transparent background. |
| `moment-egg.png` | Sprite sheet, transparent background, one row: (1) a cream dinosaur egg with green spots sitting in a small twig nest, (2) the same nest with a cracked open shell, (3) a tiny happy green baby dinosaur waving one hand, standing. Same scale. |
| `moment-cotton.png` | A fluffy pink cotton-candy cloud floating in the air, made of soft round puffs with a lighter highlight, cute and sweet. Transparent background. |
| `garage.png` | A small cheerful garage seen exactly from the SIDE: cream walls, red roof, round window in the gable, with a big doorway. The doorway must be completely EMPTY and transparent (no door, no interior), so a car can be shown inside it. Transparent background. |

Keep in code (sprites add little): finish arch and checkered line, dandelion fluff, space bubbles, rainbow tunnel,
signboard, reaction bubbles and icons.
