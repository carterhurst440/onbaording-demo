import { useState } from 'react';
import OnboardingModal from './components/OnboardingModal';
import { resetClient } from './services/claude';

const ENV_KEY = import.meta.env.VITE_ANTHROPIC_API_KEY as string | undefined;
const STORAGE_KEY = 'onboarding_anthropic_key';

function ApiKeySetup({ onSubmit }: { onSubmit: (key: string) => void }) {
  const [value, setValue] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const key = value.trim();
    if (!key) return;
    localStorage.setItem(STORAGE_KEY, key);
    onSubmit(key);
  };

  return (
    <div className="api-key-screen">
      <div className="brand">
        <div className="brand-icon">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <rect x="2" y="3" width="20" height="14" rx="2" />
            <path d="M8 21h8M12 17v4" />
          </svg>
        </div>
        <h1>HandbookAI</h1>
      </div>
      <p>
        Enter your Anthropic API key to start the AI-guided onboarding experience.
        Your key is stored locally and never sent anywhere except directly to Anthropic.
      </p>
      <form onSubmit={handleSubmit}>
        <input
          type="password"
          placeholder="sk-ant-api03-..."
          value={value}
          onChange={(e) => setValue(e.target.value)}
          autoFocus
        />
        <button type="submit" disabled={!value.trim()}>
          Start Onboarding
        </button>
      </form>
      <p className="hint">
        Or set <code>VITE_ANTHROPIC_API_KEY</code> in a <code>.env</code> file to skip this screen.
      </p>
    </div>
  );
}

export default function App() {
  const [apiKey, setApiKey] = useState<string>(() => {
    if (ENV_KEY) return ENV_KEY;
    return localStorage.getItem(STORAGE_KEY) || '';
  });

  const handleKeySubmit = (key: string) => {
    resetClient();
    setApiKey(key);
  };

  if (!apiKey) {
    return <ApiKeySetup onSubmit={handleKeySubmit} />;
  }

  return <OnboardingModal apiKey={apiKey} />;
}
