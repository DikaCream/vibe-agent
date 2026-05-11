# Vibe-Agent | Sovereign Web3 Interface

![Vibe-Agent](frontend/public/hero.png)

A fully functional Web3 Wallet Interface built for the **Tether QVAC Frontier Track Bounty ($10,000)**. Vibe-Agent merges a persistent 24/7 cloud UI (hosted on Vercel) with the raw local-first processing power of Tether's QVAC SDK.

## The Problem
Standard AI agents send your transaction intents to centralized APIs (like OpenAI), compromising the privacy of high-net-worth wallets and violating the core ethos of Web3. 

## The Solution
**Vibe-Agent** translates natural human language into fully-formed Solana transactions using Tether's `@qvac/sdk`. When running the processing pipeline, the intent extraction runs exclusively on-device via Vulkan/GGML locally loaded LLMs. 

*"Swap 10 USDC for SOL"* -> Local QVAC LLM -> `{"action": "swap", "input": "USDC", "output": "SOL", "amount": 10}` -> Phantom Signature.

## Architecture & Integration
To satisfy the requirement of a seamless live demo while maintaining the strict local-first AI requirement of QVAC:
1. **The Vercel UI:** The dashboard is a Next-gen React terminal that is always online.
2. **The QVAC Serverless Bridge (`api/intent.js`):** The backend logic imports `@qvac/sdk` and utilizes `LLM.load({ model: 'llama3-8b-instruct.Q4_K_M.gguf' })`.
3. **Graceful Cloud Fallback:** Because Vercel serverless environments enforce a 50MB limit and lack GPU (Vulkan) access, the API implements a graceful degradation parser specifically for the live cloud demo, while the underlying code retains the complete SDK integration for judges to review and run locally.

## Features
- **Natural Language Execution:** Just type what you want to do.
- **Sovereign Intelligence:** Codebase is structured to route intent through local LLM parsing via `@qvac/llm-llamacpp`.
- **Phantom Native:** Direct `window.solana` integration to avoid heavy wallet-adapter dependencies.
- **Vibecoded UI:** A dark, scan-line aesthetic built with TailwindCSS v4.

## How to Run Locally (For the Full QVAC Experience)
```bash
git clone https://github.com/DikaCream/vibe-agent.git
cd vibe-agent/frontend

# Install dependencies (including @qvac/sdk)
npm install

# Run the local development server
npm run dev
```

## Hackathon Track
Submitted exclusively for the **Tether QVAC $10k Side Track** at the Colosseum Frontier Hackathon.
