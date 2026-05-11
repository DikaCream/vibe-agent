import { useState, useEffect, useRef } from 'react';
import { Terminal, Cpu, Shield, Send, Mic, Activity, AlertCircle } from 'lucide-react';

declare global {
  interface Window {
    solana?: any;
  }
}

export default function App() {
  const [qvacStatus, setQvacStatus] = useState<'checking' | 'online' | 'offline'>('checking');
  const [wallet, setWallet] = useState<string | null>(null);
  const [messages, setMessages] = useState<{ role: 'user' | 'agent'; text: string; intent?: any }[]>([
    { role: 'agent', text: 'Vibe-Agent Initialized.\nWaiting for QVAC Local AI Bridge...' }
  ]);
  const [input, setInput] = useState('');
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Check for QVAC Local Bridge
    fetch('http://localhost:3001/health')
      .then(res => res.json())
      .then(data => {
        if (data.status === 'online') {
          setQvacStatus('online');
          setMessages(p => [...p, { 
            role: 'agent', 
            text: 'SUCCESS: QVAC Sovereign Intelligence Bridge Connected on Localhost.\nReady for commands (e.g., "Swap 10 USDC to SOL").' 
          }]);
        }
      })
      .catch(() => {
        setQvacStatus('offline');
        setMessages(p => [...p, { 
          role: 'agent', 
          text: 'WARNING: QVAC Local Bridge not found at localhost:3001.\nAI parsing features disabled. Start your local bridge to enable Sovereign Intelligence.' 
        }]);
      });
  }, []);

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
    if (!input.trim()) return;
    const userText = input;
    setInput('');
    setMessages(p => [...p, { role: 'user', text: userText }]);

    if (qvacStatus !== 'online') {
      setMessages(p => [...p, { role: 'agent', text: 'Error: Cannot parse intent. QVAC Local AI Bridge is offline.' }]);
      return;
    }

    try {
      setMessages(p => [...p, { role: 'agent', text: '[QVAC LLM] Analyzing intent locally...' }]);
      
      const res = await fetch('http://localhost:3001/api/ai/text-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: userText })
      });
      const data = await res.json();
      
      if (data.intent) {
        setMessages(p => [...p, { 
          role: 'agent', 
          text: `Intent Parsed: ${JSON.stringify(data.intent, null, 2)}\nBuilding transaction via Jupiter...`,
          intent: data.intent
        }]);
        executeIntent(data.intent);
      } else {
        setMessages(p => [...p, { role: 'agent', text: 'Could not understand command.' }]);
      }
    } catch (err: any) {
      setMessages(p => [...p, { role: 'agent', text: `Failed to connect to local AI: ${err.message}` }]);
    }
  };

  const executeIntent = async (intent: any) => {
    if (!wallet) {
      setMessages(p => [...p, { role: 'agent', text: 'Cannot execute: Please connect wallet first.' }]);
      return;
    }
    // Mocking Jupiter Swap logic for the intent
    setTimeout(() => {
      setMessages(p => [...p, { role: 'agent', text: `Jupiter Swap V2 Transaction Built.\nPlease sign the transaction in Phantom to execute ${intent.action}.` }]);
    }, 1500);
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
            {qvacStatus === 'checking' && <Activity className="w-4 h-4 text-gray-500 animate-pulse" />}
            {qvacStatus === 'online' && <Cpu className="w-4 h-4 text-brand-cyan" />}
            {qvacStatus === 'offline' && <AlertCircle className="w-4 h-4 text-red-500" />}
            <span className={qvacStatus === 'online' ? 'text-brand-cyan' : 'text-gray-500'}>
              QVAC {qvacStatus.toUpperCase()}
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
              This dashboard is hosted on Vercel and is online 24/7. However, all AI intelligence is processed via the <strong>QVAC Local Bridge</strong>.
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">
              Your prompt is sent to <code className="text-brand-purple">localhost:3001</code> where an offline LLaMa model parses the intent. No cloud APIs. Absolute sovereignty.
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
                disabled={qvacStatus !== 'online'}
              />
              <button 
                type="submit"
                disabled={qvacStatus !== 'online' || !input.trim()}
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
