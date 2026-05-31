Design the complete UI for "知音 / ZhiYin", a Guqin (Chinese seven-string zither) sound-healing 
mobile app. Output ALL screens below as separate iPhone frames (430×932).

========== VISUAL DESIGN SYSTEM ==========
MOOD: Chinese literati / 宣纸 rice-paper aesthetic. Warm aged-paper background with subtle fiber 
texture everywhere. Generous negative space, calm, elegant, meditative ("静雅疗愈"). 
Restraint is luxury: one accent color only (cinnabar seal red), used sparingly.

COLORS: paper background #F4F1E9 (with paper-fiber texture) · card surface #ECE3D0 · 
title/ink text #3A2A1E · body text #5E4D3A · faint text #8C7B66 · accent cinnabar #A33529 · 
hairline #CDBFA3. NEVER pure black, NEVER bright/saturated colors.
FIVE-ELEMENT TINTS (muted, used only for organ/mood meaning): 木/肝 #7C9A78 · 火/心 #B5564A · 
土/脾 #BE9A4F · 金/肺 #D8CDB5 · 水/肾 #5B6E7A.
MOOD COLORS (calendar): 开心 #D9A441 · 焦虑 #7C9A78 · 抑郁 #5B6E7A · 平和 #E6DCC6.

TYPOGRAPHY: "知音" logo in clerical/隶书 brush style; titles in a 国风 brush-serif; body in a 
refined Song serif; Latin labels small, UPPERCASE, wide letter-spacing, faint.

COMPONENTS (consistent across all screens): 
- Buttons: fully-rounded cinnabar pill, white text, soft shadow; secondary = ghost/text link. 
- Cards: warm paper #ECE3D0, 16px radius, 1px hairline border, soft shadow. 
- Chips: rounded pill, hairline border; selected = filled cinnabar with white text. 
- Dividers: 1px hairline, or dashed for list rows. 
- Icons: thin line, ink-brown. 
- Page padding 28px, generous vertical rhythm. 
- Accent flourish: small rotated red seal stamps used as decoration. 
- Motion notes: card screens slide left/right; transition screen uses ink-wash; player uses water ripples.

========== SCREENS ==========

1) WELCOME — centered. Tiny top label "ZHIYIN · 古琴疗愈". In the CENTER, a minimal 水墨 ink 
line-art illustration of a 古琴 (long slender horizontal zither). BELOW the guqin, the word 
"知音" large in CINNABAR RED (#A33529) clerical/隶书 brush, with a small rotated red seal beside it. 
Below: two-line poem "高山流水觅知音 / 一曲古琴疗身心" in brush-serif ink, plus tiny 
"GUQIN · SOUND HEALING". Bottom: cinnabar pill "开始问心" + faint ghost link "体验 · Demo 模式". 
Lots of empty space.

2) 问心 INTAKE — a CARD-STACK wizard: each step is its own centered card that slides in from the 
right (previous slides out left). Every card has a "‹ 返回" arrow top-left (except first) and a 
5-dot progress bar on top (active dot = cinnabar). A circular 琴师 avatar + one soft guidance line 
sits above each card. Generate these as separate frames:
 • CARD A 身体感受 — title "近来身体，哪里在向你求助？", subtitle "可多选"; grid of multi-select 
   chips: 入睡难/易醒 · 心悸/胸闷 · 烦躁/易怒 · 压力大/紧绷 · 情绪低落/郁闷 · 思虑过度 · 没胃口/腹胀 · 
   气短/容易累 · 易感冒/咽干 · 腰膝酸软/耳鸣 · 健忘/脱发.
 • CARD B 当下心绪 — single-select chips: 烦躁·低落·思绪放不下·担忧·惶恐不安·还算平和; below a 
   0–10 slider "它的分量" with cinnabar thumb.
 • CARD C 眠与神 — one Likert question per card (4 stacked radio options), e.g. "入睡通常需要多久？" 
   → 一刻钟内/半小时/一小时/更久 (selected = cinnabar).
 • CARD D 生辰·称呼 — date picker "出生年月日" + text field "如何称呼你", both skippable.
 • CARD E 小结 — warm summary card: rows 身体/心绪/眠神/生辰/称呼 with dashed dividers, then 
   cinnabar button "为我辨证".
 Each card bottom-right: rounded "下一步" button.

3) 辨证过渡 TRANSITION — centered 水墨 ink-wash with text "辨证中…". Below, a circular 五行/五音 
WHEEL of five arc segments in the five-element tints; the imbalanced organ segment glows brighter. 
One calm caption. Minimal, ceremonial, full-bleed paper. (Diagnosis itself appears on screen 4.)

4) 古琴处方笺 PRESCRIPTION — styled as an ornate 花笺 (decorated letter-paper). UNLIKE other 
screens the background is RICHER: a softly color-washed 花笺 sheet with delicate woodblock 
floral/cloud borders and faint gold lines; sheet tint reflects the diagnosed element 
(e.g. 肝 → soft green wash). On the 花笺: header "古琴处方笺" in brush-serif + a small rotated red 
seal "辨证"; diagnosis line "肝郁气滞 · 心神不宁" with element-tinted tags; one reasoning sentence; 
2–3 recommended track cards (君/臣/佐使) on translucent panels — track name in brush font, 调式, 
时长, one-line effect; bottom cinnabar pill "开始疗愈" + share-card icon. Elegant, collectible.

5) 疗愈播放 PLAYER — minimal, immersive on paper. CENTER: concentric WATER-RIPPLE animation — soft 
expanding circular ripples radiating outward like a drop on water, faint cinnabar/ink tones, gently 
moving while playing. Track title in brush-serif within/above the ripples; 调式 + duration small 
below. A faint horizontal 减字谱 (Guqin notation) strip that highlights with playback. Thin cinnabar 
progress line; centered play/pause. A microphone button at bottom with hint "对琴师说说此刻". A 
collapsed "为什么是这首" note and a 收藏 heart icon. Spacious, meditative (user may close eyes).

6) 我的 MY/MEMORY — top: greeting with 称呼 + a small 情绪主旋律 trend line. A MONTHLY CALENDAR where 
each day cell is tinted by that day's MOOD color (开心 amber / 焦虑 green / 抑郁 slate-blue / 平和 
beige; empty days plain), with a small legend. Below, list sections as paper cards: 每日心情(timeline) 
· 历史播放 · 收藏夹 · 音乐记录 · 疗程进度, each with brush-serif titles and hairline dividers; a 
"声音自传" entry card at the bottom. Mood colors are the only color, used softly.

7) 心理关怀 CARE (high-risk fallback) — soft full-paper, no cinnabar urgency. A warm caring sentence, 
a clear 心理援助热线 "400-161-9995", a "寻求专业帮助" button. No prescription, no music. Calm, supportive.

Generate every screen above as its own frame, consistent with the design system.