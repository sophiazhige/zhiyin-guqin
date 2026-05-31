# 知音 (Zhiyin) - Guqin Healing App

A modern web application combining ancient Chinese guqin (琴) music with Traditional Chinese Medicine principles to provide personalized sound healing therapy.

## Features

- **Guqin Music Library**: 50+ authentic traditional guqin pieces with therapeutic effects mapped to TCM five-element system (wood/fire/earth/metal/water)
- **Personalized Diagnosis**: AI-powered intake flow analyzing emotions and physical symptoms to recommend specific guqin pieces and healing approaches
- **Voice Chat with AI**: Real-time voice conversation with an AI-powered guqin master for personalized guidance
- **Therapy Progression**: Structured multi-stage healing programs with progress tracking
- **Resonance Generation**: AI-generated poetic insights based on user's emotional state and therapy progress

## Tech Stack

### Frontend
- **React 18** + TypeScript
- **Vite** - Fast build tool
- **Tailwind CSS** - Utility-first styling
- **Web Speech API** - Speech-to-text for voice input

### Backend
- **Python FastAPI** - RESTful API server
- **LLM Agent Integration** - Multi-agent system (Claudephin AI) for diagnosis and resonance generation
- **WebSocket** - Real-time voice chat with StepFun API

## Project Structure

```
.
├── src/                           # React frontend source
│   ├── app/
│   │   ├── App.tsx               # Main app component & voice chat overlay
│   │   ├── store.ts              # Global state & API endpoints
│   │   ├── navigation.ts         # Page routing
│   │   ├── intake-context.tsx    # User intake state management
│   │   └── components/
│   │       ├── screens/          # Page screens (intake, diagnosis, etc)
│   │       └── SharedElements.tsx # Reusable UI components
│   ├── styles/                   # Global CSS & theme
│   ├── main.tsx                  # React entry point
│   └── lib/utils.ts              # Utility functions
├── backend/                       # Python FastAPI backend
│   ├── app/
│   │   ├── main.py              # FastAPI app & route definitions
│   │   ├── models.py            # Data models
│   │   ├── settings.py          # Configuration
│   │   ├── services/            # Business logic
│   │   │   ├── diagnosis.py     # TCM diagnosis logic
│   │   │   ├── llm_agent.py     # Multi-agent LLM system
│   │   │   ├── playback.py      # Audio streaming
│   │   │   └── transcription.py # Voice transcription
│   │   ├── repos/               # Data access layer
│   │   └── data/
│   │       └── therapy_library.py # Guqin piece metadata
│   ├── pyproject.toml           # Python dependencies
│   └── tests/                   # Unit tests
├── public/audio/                 # Guqin audio files (45+ pieces)
├── guidelines/                   # Design guidelines
├── .env.example                 # Environment variables template
└── package.json                 # Node.js dependencies
```

## Getting Started

### Prerequisites
- Node.js 18+
- Python 3.9+
- npm or pnpm

### Frontend Setup

```bash
npm install
npm run dev
```

The app will be available at `http://localhost:5174`

### Backend Setup

```bash
cd backend
pip install -r pyproject.toml
python -m app.main
```

Backend will run at `http://localhost:8000`

## Environment Variables

Copy `.env.example` to `.env.local` and fill in the required values:

```bash
VITE_STEPFUN_API_KEY=your_stepfun_api_key_here
VITE_BACKEND_URL=http://localhost:8000
```

**Note**: The StepFun API key is required for voice chat functionality. Get it from [StepFun](https://stepfun.com).

## Data & Datasets

The complete dataset (201MB) containing:
- User intake patterns and therapy preferences
- Guqin piece metadata and TCM mappings
- Historical therapy session data for model training

**Location**: `~/Desktop/dataset.zip`

To use the dataset:
```bash
unzip ~/Desktop/dataset.zip -d ./data/
```

Dataset is NOT included in version control due to size constraints. Request access or download from the project maintainer.

## Key Features Implementation

### 1. TCM Five-Element System
- Wood (木) - Liver, emotion: anger → Guqin tone: Jiao (角)
- Fire (火) - Heart, emotion: joy → Guqin tone: Zhi (徵)
- Earth (土) - Spleen, emotion: worry → Guqin tone: Gong (宫)
- Metal (金) - Lungs, emotion: grief → Guqin tone: Shang (商)
- Water (水) - Kidneys, emotion: fear → Guqin tone: Yu (羽)

### 2. AI-Powered Diagnosis Flow
1. User provides symptoms, emotions, and intensity levels
2. Multi-agent LLM system analyzes and determines dominant element
3. Recommends guqin pieces matching the element and current emotional state
4. Generates poetic, semi-classical Chinese resonance text

### 3. Voice Chat Integration
- Real-time WebSocket connection to StepFun API
- PCM16 audio encoding for transmission
- AI guqin master provides emotional guidance and piece recommendations

### 4. Shared Audio Context
- Persistent audio playback across app pages
- Seamless transition between player page and other screens
- Supports pause/resume from sidebar quick-play buttons

## Development

### Build for Production
```bash
npm run build
```

### Run Tests
```bash
npm run test
```

### Code Style
- Frontend: TypeScript, ESLint configured in package.json
- Backend: Python, follows PEP 8

## Troubleshooting

### Voice Chat Not Working
- Verify `VITE_STEPFUN_API_KEY` is correctly set in `.env.local`
- Check browser console for WebSocket connection errors
- Ensure microphone permissions are granted

### Diagnosis Not Loading
- Check backend is running on the configured `VITE_BACKEND_URL`
- Verify network tab in browser dev tools for `/api/diagnosis` requests
- Check backend logs for processing errors

## Contributing

For feature requests, bug reports, or contributions, please contact the maintainer.

## License

Proprietary - Zhiyin Project

## Author

Sophie Wang (@sophiazhige)
  