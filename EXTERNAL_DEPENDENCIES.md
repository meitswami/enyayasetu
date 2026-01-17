# External API Dependencies - eNyayaSetu

This document lists all external API dependencies used in the project. For offline/self-hosted deployment, you'll need to replace these with local alternatives.

---

## 🤖 AI/LLM Services

### 1. Lovable AI Gateway (Google Gemini)
- **Used In:** 
  - `supabase/functions/ai-judge/index.ts`
  - `supabase/functions/court-chat/index.ts`
  - `supabase/functions/case-intake-chat/index.ts`
  - `supabase/functions/analyze-evidence/index.ts`
  - `supabase/functions/ocr-document/index.ts`
- **API Endpoint:** `https://ai.gateway.lovable.dev/v1/chat/completions`
- **Model Used:** `google/gemini-2.5-flash`
- **Features Used:**
  - Text completion/chat
  - Vision (image analysis for OCR)
  - JSON structured output
- **Environment Variable:** `LOVABLE_API_KEY`

#### Self-Hosted Alternatives:
| Option | Pros | Cons | Setup Difficulty |
|--------|------|------|------------------|
| **Ollama + Llama 3.2 Vision** | Free, local, privacy | GPU needed, slower | Medium |
| **vLLM + Mistral/Qwen** | Fast inference, production-ready | GPU required | Hard |
| **LocalAI** | OpenAI-compatible API | Resource intensive | Medium |
| **llama.cpp** | Lightweight, CPU support | Limited vision models | Easy |

**Recommended for Offline:** Ollama with `llama3.2-vision:11b` or `qwen2.5:14b`

---

## 🎤 Speech Services

### 2. ElevenLabs TTS (Text-to-Speech)
- **Used In:** `supabase/functions/text-to-speech/index.ts`
- **API Endpoint:** `https://api.elevenlabs.io/v1/text-to-speech/{voiceId}`
- **Features Used:**
  - Multi-voice synthesis
  - Multilingual (Hindi, English)
  - Voice cloning
- **Environment Variable:** `ELEVENLABS_API_KEY`
- **Status:** ⚠️ Currently failing (Free tier disabled)

#### Self-Hosted Alternatives:
| Option | Pros | Cons | Setup Difficulty |
|--------|------|------|------------------|
| **Coqui TTS** | Open source, multilingual, voice cloning | GPU recommended | Medium |
| **Piper TTS** | Fast, lightweight, local | Limited languages | Easy |
| **Mozilla TTS** | Good quality | Discontinued | Hard |
| **Bark** | Very natural, emotions | Slow, GPU needed | Medium |
| **Browser Web Speech API** | Free, no setup | Limited quality/control | None ✅ |

**Recommended for Offline:** Coqui TTS with Hindi models + Browser fallback

---

### 3. ElevenLabs STT (Speech-to-Text)
- **Used In:** 
  - `supabase/functions/voice-transcribe/index.ts`
  - `supabase/functions/elevenlabs-scribe-token/index.ts`
- **API Endpoint:** `https://api.elevenlabs.io/v1/speech-to-text`
- **Features Used:**
  - Real-time transcription
  - Hindi/English support
- **Environment Variable:** `ELEVENLABS_API_KEY`

#### Self-Hosted Alternatives:
| Option | Pros | Cons | Setup Difficulty |
|--------|------|------|------------------|
| **Whisper (OpenAI)** | Best accuracy, multilingual | GPU for real-time | Medium |
| **Whisper.cpp** | CPU-friendly Whisper | Slower than GPU | Easy |
| **Vosk** | Offline, lightweight, Hindi support | Lower accuracy | Easy |
| **DeepSpeech** | Mozilla-backed | Limited languages | Medium |
| **Browser Web Speech API** | Free, real-time | Browser-dependent | None ✅ |

**Recommended for Offline:** Whisper.cpp or Vosk with Hindi models

---

## 📧 Email Services

### 4. Resend (Email)
- **Used In:** `supabase/functions/send-verification-email/index.ts`
- **API Endpoint:** `https://api.resend.com/emails`
- **Features Used:**
  - Transactional emails
  - Verification emails
- **Environment Variable:** `RESEND_API_KEY`

#### Self-Hosted Alternatives:
| Option | Pros | Cons | Setup Difficulty |
|--------|------|------|------------------|
| **Nodemailer + SMTP** | Standard, reliable | Need SMTP server | Easy |
| **Postal** | Self-hosted, feature-rich | Complex setup | Hard |
| **Mailcow** | Complete email solution | Heavy resources | Hard |
| **Local SMTP (Postfix)** | Standard Linux tool | Needs DNS/MX setup | Medium |

**Recommended for Offline:** Nodemailer with local SMTP relay

---

## 🗄️ Database & Auth

### 5. Supabase
- **Used In:** Throughout the application
- **Services Used:**
  - PostgreSQL database
  - Authentication
  - Storage (file uploads)
  - Edge Functions runtime
- **Environment Variables:** 
  - `SUPABASE_URL`
  - `SUPABASE_ANON_KEY`

#### Self-Hosted Alternative:
- **Self-hosted Supabase**: Official Docker setup available
- **PostgreSQL + PostgREST + GoTrue**: Component-by-component setup
- **Pocketbase**: Simpler alternative with similar features

---

## 📦 Client-Side Dependencies (Already Local)

These run entirely in the browser, no API calls:

| Library | Purpose | Status |
|---------|---------|--------|
| `face-api.js` | Face detection | ✅ Local (loads models from CDN, can be cached) |
| `jspdf` | PDF generation | ✅ Local |
| Web Speech API | Browser TTS/STT | ✅ Local |

---

## 🚀 Migration Plan for Offline Deployment

### Phase 1: Quick Wins (Already Done)
- [x] Browser TTS fallback implemented
- [x] Browser STT available via Web Speech API

### Phase 2: Replace AI Services
1. Set up Ollama server
2. Create local AI endpoint wrapper
3. Update edge functions to use local endpoint
4. Test with vision models for OCR

### Phase 3: Replace Speech Services
1. Set up Coqui TTS server for high-quality voices
2. Set up Whisper.cpp for transcription
3. Create API wrappers matching current interface
4. Keep browser fallbacks for lightweight usage

### Phase 4: Replace Email
1. Set up local SMTP server
2. Update email function to use SMTP
3. Configure DNS/mail routing for production

### Phase 5: Database
1. Deploy self-hosted Supabase or
2. Set up PostgreSQL + PostgREST + GoTrue stack
3. Migrate data and update connection strings

---

## 📊 Resource Requirements for Self-Hosting

### Minimum (Basic Functionality)
- CPU: 4 cores
- RAM: 8 GB
- Storage: 50 GB SSD
- GPU: None (uses CPU models)

### Recommended (Full Features)
- CPU: 8+ cores
- RAM: 32 GB
- Storage: 200 GB SSD
- GPU: NVIDIA RTX 3080+ (for fast AI inference)

### Production (High Load)
- CPU: 16+ cores
- RAM: 64 GB
- Storage: 500 GB NVMe
- GPU: NVIDIA A100 or multiple consumer GPUs

---

## 🔗 Useful Resources

- [Ollama](https://ollama.ai/) - Run LLMs locally
- [Coqui TTS](https://github.com/coqui-ai/TTS) - Open source TTS
- [Whisper.cpp](https://github.com/ggerganov/whisper.cpp) - Local STT
- [Self-hosted Supabase](https://supabase.com/docs/guides/self-hosting)
- [Vosk](https://alphacephei.com/vosk/) - Offline speech recognition
