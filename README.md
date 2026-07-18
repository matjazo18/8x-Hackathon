# 8x Hackathon — Monorepo

iOS mobilna aplikacija z lokalnim LLM inference + Express backend.

## Struktura

```
8x-hackathon/
├── apps/
│   ├── mobile/        # Expo (React Native, iOS-only)
│   └── backend/       # Express TypeScript API
└── packages/
    └── shared-types/  # Skupni TypeScript tipi
```

## Zahteve

- Node.js 18+
- npm 9+
- Xcode (za iOS build)
- CocoaPods (`brew install cocoapods`)

## Zaganjanje

### Mobile (frontend)

```bash
cd apps/mobile

# Dev server
npx expo start

# iOS simulator
npx expo run:ios

# Če nimaš native ios/ mape (po svežem clonu):
npx expo prebuild --platform ios
```

### Backend

```bash
cd apps/backend
npm install
npm run dev     # nodemon + ts-node, port 3000
```

## Namestitev MLC LLM

Paket `@mlc-ai/react-native-mlc-llm` ni na npm registru. Namesti ga ročno:

1. Kloniraj repo: `git clone https://github.com/mlc-ai/react-native-mlc-llm`
2. Sledi navodilom za iOS setup na: https://llm.mlc.ai/docs/deploy/react-native
3. Dodaj kot lokalni workspace paket ali direktno kot CocoaPod

LLM inference logika gre v `apps/mobile/src/services/`.

## Trenutni MVP

Frontend ima onboarding modela, seznam agentov, ustvarjanje agenta in zagon agenta. Zaenkrat llmService uporablja mock.

Za zagon:

    npm install
    npm run backend
    npm run mobile

Backend endpointi so GET /health, GET /models, GET /models/qwen3-1.7b-mlx-4bit, GET /sync/agents, POST /sync/agents in POST /sync/agents/:id/runs.

## MLX native naslednji korak

Expo Go ne more naložiti Swift paketa. Ustvari development build:

    cd apps/mobile
    npx expo prebuild --platform ios
    npx expo run:ios

V Xcode dodaj Swift Package https://github.com/ml-explore/mlx-swift-lm in izpostavi native modul, ki implementira loadModel, generate in unloadModel iz apps/mobile/src/services/llmService.ts. UI je že vezan na ta vmesnik, zato se mock lahko zamenja brez sprememb ekranov. Model repository je Qwen/Qwen3-1.7B-MLX-4bit.

## Skupni tipi

Paket `@8x/shared-types` vsebuje:
- `ModelInfo` — opis LLM modela (id, name, sizeBytes, downloadUrl, quantization)
- `User` — osnovni uporabniški tip

```bash
cd packages/shared-types
npm run build   # compile TypeScript
```

Za uporabo v mobile ali backend: `import { ModelInfo, User } from '@8x/shared-types'`

## Root workspace ukazi

```bash
npm run mobile    # zažene mobile dev server
npm run backend   # zažene backend dev server
```
