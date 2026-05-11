import express from 'express';
import cors from 'cors';
import multer from 'multer';
import { LLM, Transcription } from '@qvac/sdk';

const app = express();
const upload = multer({ dest: 'uploads/' });

app.use(cors());
app.use(express.json());

// Initialize QVAC Local Models
console.log('Initializing QVAC Local Models...');
let llmModel;
let whisperModel;

async function initQVAC() {
  try {
    // These load the models locally on the user's GPU/CPU via Vulkan/GGML
    llmModel = await LLM.load({ model: 'llama3-8b-instruct.Q4_K_M.gguf' });
    whisperModel = await Transcription.load({ model: 'whisper-base.en.gguf' });
    console.log('QVAC Local Models initialized and loaded into memory.');
  } catch (error) {
    console.error('QVAC Initialization error (expected if models are not downloaded):', error);
  }
}

initQVAC();

app.get('/health', (req, res) => {
  res.json({ 
    status: 'online', 
    qvac: { llm: !!llmModel, transcription: !!whisperModel },
    message: 'QVAC Local AI Bridge is running on-device.'
  });
});

// Endpoint 1: Voice to Intent (Transcription -> LLM -> JSON)
app.post('/api/ai/voice-intent', upload.single('audio'), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: 'No audio file provided' });
    
    // 1. Local Speech-to-Text via QVAC Whisper
    console.log(`[QVAC Transcription] Processing ${req.file.path}`);
    let text = "Mock transcription: Swap 10 USDC for SOL";
    if (whisperModel) {
      const transcription = await whisperModel.transcribe(req.file.path);
      text = transcription.text;
    }

    // 2. Local LLM Intent Extraction via QVAC Llama
    console.log(`[QVAC LLM] Extracting intent from: "${text}"`);
    let intent = { action: 'swap', input: 'USDC', output: 'SOL', amount: 10 };
    
    if (llmModel) {
      const prompt = `You are a Solana transaction parser. Extract the action from the following user command and return ONLY a valid JSON object. 
      Format: {"action": "swap|send", "input": "SYMBOL", "output": "SYMBOL", "amount": Number}
      Command: ${text}`;
      
      const response = await llmModel.generate(prompt);
      intent = JSON.parse(response.text.trim());
    }

    res.json({ success: true, text, intent });
  } catch (error) {
    console.error('Voice Intent Error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Endpoint 2: Text to Intent (LLM -> JSON)
app.post('/api/ai/text-intent', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) return res.status(400).json({ error: 'No prompt provided' });

    console.log(`[QVAC LLM] Extracting intent from: "${prompt}"`);
    let intent = { action: 'swap', input: 'USDC', output: 'SOL', amount: 50 };

    if (llmModel) {
      const sysPrompt = `You are a Solana transaction parser. Extract the action from the following user command and return ONLY a valid JSON object. 
      Format: {"action": "swap|send", "input": "SYMBOL", "output": "SYMBOL", "amount": Number}
      Command: ${prompt}`;
      
      const response = await llmModel.generate(sysPrompt);
      intent = JSON.parse(response.text.trim());
    }

    // Hardcode some logic for the demo if QVAC isn't fully loaded due to lack of model files
    if (!llmModel) {
      if (prompt.toLowerCase().includes('sol')) intent.output = 'SOL';
      if (prompt.toLowerCase().includes('jup')) intent.output = 'JUP';
      if (prompt.toLowerCase().includes('send')) intent.action = 'send';
    }

    res.json({ success: true, intent, rawPrompt: prompt });
  } catch (error) {
    console.error('Text Intent Error:', error);
    res.status(500).json({ error: error.message });
  }
});

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`\n=========================================`);
  console.log(`🚀 QVAC Local AI Bridge running on port ${PORT}`);
  console.log(`🔒 Data runs locally. Zero cloud tracking.`);
  console.log(`=========================================\n`);
});
