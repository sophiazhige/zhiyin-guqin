# Zhiyin Backend

`backend/` 现在提供一个隐藏画像的后端 agent 流：

1. 语音转文本和纯文本输入
2. 后端 LLM/agent 自动分析并更新隐藏画像
3. 基于隐藏画像与当次输入做诊断和音乐匹配
4. 返回可供前端播放的曲目和音频预览地址

## 目录

- `app/main.py`: FastAPI 入口
- `app/models.py`: 请求与响应模型
- `app/data/therapy_library.py`: 五音、病症、曲库数据
- `app/settings.py`: 外部模型配置
- `app/services/transcription.py`: 语音转文本服务
- `app/services/llm_agent.py`: LLM/agent 隐藏画像提炼服务
- `app/services/diagnosis.py`: 用户画像、症状诊断、曲目匹配
- `app/services/playback.py`: 曲目预览 WAV 生成
- `app/repos/agent_state_repo.py`: 隐藏画像与 agent 历史持久化
- `storage/agent_state.json`: 后端隐藏画像存储文件

## 数据架构

后端的诊断 label、五音模式、曲目归属关系，统一收敛在：

- `app/data/therapy_library.py`

这里是后端曲库映射的单一数据源，核心结构有 2 层：

- `TONE_PROFILES`
  - 定义五音模式本身的信息，例如 `角 / 徵 / 宫 / 商 / 羽`
  - 包含字段：`mode`、`element`、`title`、`label`、`description`、`anchor_tracks`
- `SYNDROME_PROFILES`
  - 定义业务层的 9 个诊断分类
  - 每一项都包含：
  - `id`: 后端内部稳定 ID
  - `title`: 诊断名称
  - `principle`: 对外展示的 label
  - `mode`: 绑定的五音模式
  - `tracks`: 该分类下可被推荐的曲目列表
  - `symptoms` / `emotion_tags`: 该分类的匹配线索

当前 9 组 label 和曲目关系已经调整为：

- `养心宁神`: `良宵引`、`平沙落雁`、`虚籁`、`春晓吟`
- `疏肝理气`: `流水`、`醉渔唱晚`、`庄周梦蝶`
- `健脾和害`: `梅花三弄`、`山居吟`、`阳春`、`泛沧浪`
- `润肺理气`: `阳关三叠`、`白雪`、`鹤鸣九皋`、`秋鸿`、`子夜吴歌`、`石上流泉`
- `补肾固本`: `乌夜啼`、`雉朝飞`、`太古引`
- `清心平肝`: `泣颜回`、`泽畔吟`、`思贤操`、`龙朔操`
- `整体疏解`: `洞庭秋思`
- `调肝养血`: `湘妃怨`、`捣衣`、`长相思`、`竹枝词`
- `五脏同调`: `普庵咒`、`羽化登仙`、`崆峒问道`、`释谈章`、`颐真`、`玄默`

## 如何调整 Label

如果后面你要改某个 label 或曲目绑定，只需要编辑 `app/data/therapy_library.py`：

- 改 label：
  - 修改对应 `SYNDROME_PROFILES` 项里的 `principle`
- 改诊断名称：
  - 修改对应项里的 `title`
- 改这个分类绑定到哪个五音：
  - 修改对应项里的 `mode`
- 改这个分类下有哪些曲目：
  - 修改对应项里的 `tracks`
- 改五音的标题、文案、锚点曲：
  - 修改 `TONE_PROFILES`

## 调整后的生效路径

当你修改 `therapy_library.py` 后，这些地方会自动跟着变：

- LLM 推荐时可选择的曲目集合
- `/api/tracks` 返回的曲库
- 诊断结果里的 `recommended_tracks`
- 页面上的曲目展示和播放入口

也就是说，后端现在是：

- `SYNDROME_PROFILES` 决定业务分类和曲目归属
- `TONE_PROFILES` 决定五音层文案
- `TRACK_LIBRARY` 会根据上面两份配置自动生成

## 快速启动

```bash
cd backend
python3 -m venv .venv
source .venv/bin/activate
pip install -e .
uvicorn app.main:app --reload --host 0.0.0.0 --port 8001
```

如果你要启用云端语音转文字，优先接入 StepFun：

```bash
export STEPFUN_API_KEY='your_stepfun_key'
export STEPFUN_BASE_URL='https://api.stepfun.ai'
export STEPFUN_ASR_MODEL='stepaudio-2.5-asr'
export STEPFUN_VERIFY_SSL='true'
```

说明：

- 页面最开始的输入区是一个共享聊天输入框，支持 `文字输入` 和 `语音输入`
- 如果上传音频，后端会优先调用 StepFun ASR 做语音转文字
- 如果 StepFun 不可用，会自动回退到本地 `faster-whisper`
- 如果本地也不可用，则返回识别错误，不再使用兜底文字

如果要启用本地离线语音转文本，可额外安装：

```bash
pip install -e ".[stt]"
```

安装后服务会优先尝试使用 `faster-whisper`。

健康检查地址：

```bash
http://127.0.0.1:8001/health
```

可直接使用的网页入口：

```bash
http://127.0.0.1:8001/
```

## 核心接口

- `GET /health`
- `POST /api/agent/run`
- `POST /api/intake/text`
- `POST /api/intake/audio`
- `POST /api/diagnosis`
- `GET /api/tracks`
- `GET /api/tracks/{track_id}`
- `GET /api/playback/preview/{track_id}.wav`

## 接入说明

- 前端只需要调用输入接口，不需要处理或展示用户画像
- 用户画像由后端 agent 从文本/语音中隐式提炼并持续更新
- 返回结果只包含诊断、推荐曲目和播放地址
