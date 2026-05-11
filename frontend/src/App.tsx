import { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Shield, Send, Mic, Activity } from 'lucide-react';

declare global {
  interface Window {
    solana?: any;
  }
}

export default function App() {
  const [wallet, setWallet] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; text: string; intent?: any }[]>([
    { role: 'agent', text: 'Vibe-Agent Initialized.\nPowered by QVAC AI Engine.\nReady for commands (e.g., "Swap 50 USDC for SOL").' }
  ]);
  const [input, setInput] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const connectWallet = async () => {
    if (!window.solana) return alert('Phantom Wallet not found!');
    try {
      const resp = await window.solana.connect();
      setWallet(resp.publicKey.toString());
    } catch (e) {
      console.error(e);
    }
  };

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isProcessing) return;
    const userText = input;
    setInput('');
    setMessages(p => [...p, { role: 'user', text: userText }]);
    setIsProcessing(true);

    try {
      setMessages(p => [...p, { role: 'agent', text: '[QVAC Engine] Analyzing intent...' }]);
      
      const res = await fetch('/api/intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
      });
      const data = await res.json();
      
      if (data.intent) {
        setMessages(p => {
          // Remove the "Analyzing intent..." message
          const newMsg = [...p];
          newMsg.pop();
          return [...newMsg, { 
            role: 'agent', 
            text: `Intent Parsed [Mode: ${data.processingMode}]:\n${JSON.stringify(data.intent, null, 2)}\n\nBuilding transaction via Jupiter...`,
            intent: data.intent
          }];
        });
        executeIntent(data.intent);
      } else {
        setMessages(p => [...p, { role: 'agent', text: 'Could not understand command.' }]);
      }
    } catch (err: any) {
      setMessages(p => [...p, { role: 'agent', text: `Engine Error: ${err.message}` }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeIntent = async (intent: any) => {
    if (!wallet) {
      setMessages(p => [...p, { role: 'agent', text: 'Cannot execute: Please connect wallet first.' }]);
      return;
    }
    
    if (intent.action !== 'swap') {
      setMessages(p => [...p, { role: 'agent', text: `Action "${intent.action}" not implemented natively in this demo.` }]);
      return;
    }

    try {
      setMessages(p => [...p, { role: 'agent', text: `Requesting optimal route from Jupiter API for ${intent.amount} ${intent.input}...` }]);
      
      const USDC_MINT = 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v';
      const SOL_MINT  = 'So11111111111111111111111111111111111111112';
      
      // Convert amount to base units (assuming 6 decimals for USDC)
      const amountInBaseUnits = Math.floor(intent.amount * 1_000_000);

      const res = await fetch(
        `https://api.jup.ag/swap/v2/order?inputMint=${USDC_MINT}&outputMint=${SOL_MINT}&amount=${amountInBaseUnits}&taker=${wallet}`
      );
      
      if (!res.ok) throw new Error('Failed to get route from Jupiter API');
      
      const data = await res.json();
      if (!data.transaction) throw new Error(data.message ?? 'No transaction data returned from Jupiter');

      setMessages(p => [...p, { role: 'agent', text: `Jupiter Swap V2 Transaction Built.\nPlease check your Phantom Wallet to sign the transaction.` }]);
      
      const result = await window.solana.signAndSendTransaction({ message: data.transaction });
      
      setMessages(p => [...p, { role: 'agent', text: `✅ SUCCESS!\nTransaction sent to network: ${result.signature.slice(0,20)}...` }]);

    } catch (err: any) {
      setMessages(p => [...p, { role: 'agent', text: `Execution Failed: ${err.message}` }]);
    }
  };

  return (
    <div className="min-h-screen flex flex-col p-4 md:p-8 max-w-6xl mx-auto">
      {/* Header */}
      <header className="flex justify-between items-center mb-8 border-b border-gray-800 pb-4">
        <div>
          <h1 className="text-2xl font-bold text-brand-green flex items-center gap-2 uppercase tracking-widest">
            <Terminal className="w-6 h-6" /> Vibe-Agent
          </h1>
          <p className="text-xs text-gray-500 mt-1 uppercase tracking-widest">Sovereign Web3 Interface</p>
        </div>
        <div className="flex gap-4">
          <div className="flex items-center gap-2 border border-gray-800 px-4 py-2 rounded bg-brand-panel text-xs">
            {isProcessing ? <Activity className="w-4 h-4 text-brand-cyan animate-spin" /> : <Cpu className="w-4 h-4 text-brand-cyan" />}
            <span className="text-brand-cyan">
              QVAC {isProcessing ? 'PROCESSING' : 'ONLINE'}
            </span>
          </div>
          <button 
            onClick={connectWallet}
            className="border border-brand-green text-brand-green px-4 py-2 rounded text-xs hover:bg-brand-green/10 transition-colors uppercase tracking-wider"
          >
            {wallet ? `${wallet.slice(0,4)}...${wallet.slice(-4)}` : 'Connect Wallet'}
          </button>
        </div>
      </header>

      {/* Main App */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Column: Info */}
        <div className="flex flex-col gap-6">
          <div className="border border-gray-800 bg-brand-panel p-6 rounded relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Shield className="w-24 h-24" />
            </div>
            <h2 className="text-brand-cyan text-sm uppercase tracking-widest mb-4">Architecture</h2>
            <p className="text-sm text-gray-400 mb-4 leading-relaxed">
              Vibe-Agent uses the <strong>QVAC SDK</strong> to process natural language into Solana transactions.
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              When run locally, it uses Vulkan/GGML via <code className="text-brand-purple">@qvac/llm-llamacpp</code>. On Vercel, it uses a gracefully degraded deterministic parser.
            </p>
          </div>

          <div className="border border-gray-800 bg-brand-panel p-6 rounded">
            <h2 className="text-brand-green text-sm uppercase tracking-widest mb-4">Supported Intents</h2>
            <ul className="text-sm text-gray-500 space-y-2">
              <li>"Swap 10 USDC to SOL"</li>
              <li>"Buy 5 JUP with USDC"</li>
              <li>"Send 0.1 SOL to Dika"</li>
            </ul>
          </div>
        </div>

        {/* Right Column: Chat Interface */}
        <div className="col-span-1 md:col-span-2 border border-gray-800 bg-brand-panel rounded flex flex-col relative overflow-hidden">
          {/* Messages */}
          <div className="flex-1 p-6 overflow-y-auto font-mono text-sm space-y-6">
            {messages.map((m, i) => (
              <div key={i} className={`flex flex-col ${m.role === 'user' ? 'items-end' : 'items-start'}`}>
                <span className="text-[10px] text-gray-600 mb-1 uppercase">
                  {m.role === 'user' ? 'You' : 'System'}
                </span>
                <div className={`p-3 max-w-[80%] whitespace-pre-wrap rounded border ${
                  m.role === 'user' 
                    ? 'border-gray-700 bg-gray-800/50 text-gray-300' 
                    : 'border-brand-green/30 bg-brand-green/5 text-brand-green'
                }`}>
                  {m.text}
                </div>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-gray-800 bg-black/50">
            <form onSubmit={handleSend} className="flex gap-3">
              <button type="button" className="p-3 text-gray-500 hover:text-brand-cyan transition-colors bg-gray-900 rounded border border-gray-800">
                <Mic className="w-5 h-5" />
              </button>
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value)}
                placeholder="Command Sovereign Agent..."
                className="flex-1 bg-gray-900 border border-gray-800 rounded px-4 focus:outline-none focus:border-brand-green text-gray-200 transition-colors placeholder-gray-600"
                disabled={isProcessing}
              />
              <button 
                type="submit"
                disabled={isProcessing || !input.trim()}
                className="p-3 bg-brand-green text-black rounded hover:bg-green-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="w-5 h-5" />
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
