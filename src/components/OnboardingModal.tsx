import { useState, useCallback } from 'react';
import type { OrgProfile, ChatMessage } from '../types';
import type { ConversationMessage } from '../services/claude';
import { sendMessage } from '../services/claude';
import { EMPTY_PROFILE } from '../types';
import { INITIAL_GREETING, REQUIRED_FIELDS } from '../constants';
import ChatPanel from './ChatPanel';
import OrgProfilePanel from './OrgProfilePanel';

interface Props {
  apiKey: string;
}

function computeCompletion(profile: OrgProfile): number {
  let filled = 0;
  for (const { key } of REQUIRED_FIELDS) {
    const val = profile[key as keyof OrgProfile];
    if (Array.isArray(val) ? val.length > 0 : val !== '') filled++;
  }
  return Math.round((filled / REQUIRED_FIELDS.length) * 100);
}

export default function OnboardingModal({ apiKey }: Props) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'init',
      role: 'assistant',
      content: INITIAL_GREETING,
    },
  ]);
  const [conversationHistory, setConversationHistory] = useState<ConversationMessage[]>([]);
  const [profile, setProfile] = useState<OrgProfile>(EMPTY_PROFILE);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const completion = computeCompletion(profile);

  const handleProfileChange = useCallback((updates: Partial<OrgProfile>) => {
    setProfile((prev) => {
      const next = { ...prev };
      for (const [k, v] of Object.entries(updates)) {
        if (v !== undefined && v !== null) {
          if (k === 'physicalLocations' && Array.isArray(v)) {
            (next as Record<string, unknown>)[k] = v;
          } else if (typeof v === 'string' && v.trim() !== '') {
            (next as Record<string, unknown>)[k] = v;
          }
        }
      }
      return next;
    });
  }, []);

  const handleSend = useCallback(
    async (text: string) => {
      if (isLoading) return;

      // Add user message to display
      const userMsg: ChatMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: text,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsLoading(true);
      setError(null);

      try {
        const result = await sendMessage(text, conversationHistory, apiKey);

        // Update profile if AI extracted data
        if (result.profileUpdate) {
          handleProfileChange(result.profileUpdate);
        }

        // Add AI response to display
        if (result.text) {
          const aiMsg: ChatMessage = {
            id: `ai-${Date.now()}`,
            role: 'assistant',
            content: result.text,
          };
          setMessages((prev) => [...prev, aiMsg]);
        }

        setConversationHistory(result.updatedHistory);

        // Check if profile is now complete
        const updatedProfile = { ...profile };
        if (result.profileUpdate) {
          Object.assign(updatedProfile, result.profileUpdate);
        }
        if (computeCompletion(updatedProfile) === 100) {
          setIsComplete(true);
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
        setError(msg);
      } finally {
        setIsLoading(false);
      }
    },
    [isLoading, conversationHistory, apiKey, handleProfileChange, profile],
  );

  return (
    <div className="modal-wrapper">
      <div className="modal-card">
        {/* Header */}
        <div className="modal-header">
          <div className="modal-brand">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="2" y="3" width="20" height="14" rx="2" />
              <path d="M8 21h8M12 17v4" />
            </svg>
            <span>HandbookAI</span>
          </div>
          <div className="modal-progress-info">
            <div className="progress-label">Profile Completion</div>
            <div className="progress-track">
              <div
                className="progress-fill"
                style={{ width: `${completion}%` }}
              />
            </div>
            <div className="progress-pct">{completion}%</div>
          </div>
        </div>

        {/* Body */}
        <div className="modal-body">
          <ChatPanel
            messages={messages}
            isLoading={isLoading}
            onSend={handleSend}
            disabled={isComplete}
          />
          <OrgProfilePanel
            profile={profile}
            onChange={handleProfileChange}
            completion={completion}
          />
        </div>

        {/* Error bar */}
        {error && (
          <div className="error-bar">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            {error}
            <button className="error-close" onClick={() => setError(null)}>×</button>
          </div>
        )}

        {/* Completion footer */}
        {isComplete && (
          <div className="completion-footer">
            <div className="completion-message">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Organization profile complete!
            </div>
            <button className="complete-btn" onClick={() => alert('Proceeding to your dashboard...')}>
              Enter Your Dashboard
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <line x1="5" y1="12" x2="19" y2="12" />
                <polyline points="12 5 19 12 12 19" />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
