import { useMemo, useState } from 'react';
import { MessageSquare, Send, Sparkles } from 'lucide-react';

interface ChatMessage {
  role: 'user' | 'bot';
  content: string;
}

const faqEntries = [
  {
    keywords: ['price', 'pricing', 'cost', 'plan', 'tier'],
    answer:
      'We have Starter (3 datasets free), Professional (AutoML + collaboration), and Enterprise (SSO, audit logs, VPC). You can switch tiers anytime.',
  },
  {
    keywords: ['integrations', 'database', 'warehouse', 'cloud', 'snowflake', 'bigquery', 'redshift', 'postgres'],
    answer:
      'We connect to Postgres, MySQL, Snowflake, BigQuery, Redshift, S3, and GCS. OAuth + service accounts are supported, with data kept in your cloud.',
  },
  {
    keywords: ['security', 'privacy', 'soc2', 'gdpr', 'data'],
    answer:
      'Data stays in your cloud. We support SSO/SAML, row-level security, audit logs, secrets vaulting, and are SOC2-ready with least-privilege roles.',
  },
  {
    keywords: ['automl', 'model', 'train', 'ml', 'pipeline'],
    answer:
      'AutoML trains classifiers/regressors in one click. Pipelines handle cleaning, feature engineering, validation, and deployment with health monitoring.',
  },
  {
    keywords: ['demo', 'tour', 'try', 'preview', 'sample'],
    answer:
      'You can try the interactive product tour or load the sample workspace (6 datasets + guided ML). No credit card is required to explore.',
  },
  {
    keywords: ['support', 'help', 'contact', 'sales'],
    answer:
      'Need help? Chat with us in-app or email hello@dataflowhub.ai. Enterprise customers get a dedicated success manager and Slack channel.',
  },
];

const quickQuestions = [
  'Explain this chart',
  'What do the sliders do?',
  'What integrations do you support?',
  'How do I train a model?',
  'Is my data secure?',
  'What are the pricing tiers?'
];

const fallbackAnswers = [
  'I can tell you about pricing, integrations, security, AutoML, and how to get started. Ask me anything about the platform!',
  'Try loading the sample workspace, then click Train Model to see the full pipeline in under a minute.',
  'We keep everything guided: connect data, clean it with natural language, then deploy a monitored model with one click.',
];

type RobotAppQAProps = {
  context?: {
    mode?: 'classification' | 'regression';
    params?: Record<string, number>;
  };
};

export default function RobotAppQA({ context }: RobotAppQAProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: 'bot',
      content:
        'Hi! I am the robot copilot. Ask me to explain the chart, or ask about pricing, security, integrations, or how to start a model.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);

  const reply = useMemo(() => {
    return (question: string): string => {
      const normalized = question.toLowerCase();

      const wantsChartHelp =
        normalized.includes('chart') ||
        normalized.includes('plot') ||
        normalized.includes('graph') ||
        normalized.includes('explain') ||
        normalized.includes('what am i looking') ||
        normalized.includes('sliders') ||
        normalized.includes('cluster') ||
        normalized.includes('plane') ||
        normalized.includes('surface') ||
        normalized.includes('regression') ||
        normalized.includes('classification');

      if (wantsChartHelp) {
        if (context?.mode === 'classification') {
          const separation = context.params?.separation;
          const noise = context.params?.noise;
          const sepText = typeof separation === 'number' ? separation.toFixed(2) : '—';
          const noiseText = typeof noise === 'number' ? noise.toFixed(2) : '—';
          return (
            `You’re viewing a 3D classification demo: blue and green points are two classes, and the translucent plane is a simple decision boundary. ` +
            `Use the sliders to change cluster separation (currently ${sepText}) and noise (currently ${noiseText}). ` +
            `Higher noise makes the classes overlap more, which makes the boundary less clean.`
          );
        }

        if (context?.mode === 'regression') {
          const amplitude = context.params?.amplitude;
          const noise = context.params?.noise;
          const ampText = typeof amplitude === 'number' ? amplitude.toFixed(2) : '—';
          const noiseText = typeof noise === 'number' ? noise.toFixed(2) : '—';
          return (
            `You’re viewing a 3D regression demo: the surface is the model’s predicted function, and the white points are noisy observations. ` +
            `Amplitude (currently ${ampText}) scales the surface up/down, and noise (currently ${noiseText}) increases how far points deviate from the surface.`
          );
        }

        return 'This page has two modes: classification (two clusters + decision plane) and regression (surface + noisy points). Toggle modes and use the sliders to see how the data changes.';
      }

      const match = faqEntries.find((item) => item.keywords.some((k) => normalized.includes(k)));
      if (match) return match.answer;
      return fallbackAnswers[Math.floor(Math.random() * fallbackAnswers.length)];
    };
  }, [context?.mode, context?.params]);

  const handleAsk = (question?: string) => {
    const text = (question || input).trim();
    if (!text || busy) return;
    setBusy(true);
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setInput('');
    setTimeout(() => {
      const answer = reply(text);
      setMessages((prev) => [...prev, { role: 'bot', content: answer }]);
      setBusy(false);
    }, 350);
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-4 md:p-5 backdrop-blur">
      <div className="flex items-center gap-2 mb-3 text-sm text-gray-200 font-semibold">
        <MessageSquare className="w-4 h-4 text-cyan-300" />
        Robot Q&A (about this app)
      </div>

      <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
        {messages.map((message, idx) => (
          <div
            key={idx}
            className={`px-3 py-2 rounded-xl text-sm leading-relaxed ${
              message.role === 'bot'
                ? 'bg-white/5 border border-white/10 text-gray-100'
                : 'bg-blue-500/10 border border-blue-500/30 text-blue-50'
            }`}
          >
            {message.content}
          </div>
        ))}
      </div>

      <div className="mt-3 flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAsk();
            }}
            placeholder="Ask about pricing, security, integrations..."
            className="flex-1 px-3 py-2 rounded-lg bg-white/5 border border-white/10 text-sm text-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => handleAsk()}
            disabled={busy || !input.trim()}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-purple-700 disabled:opacity-50"
          >
            <Send className="w-4 h-4" />
            Ask
          </button>
        </div>

        <div className="flex flex-wrap gap-2 text-xs text-gray-200">
          {quickQuestions.map((q) => (
            <button
              key={q}
              onClick={() => handleAsk(q)}
              className="px-3 py-1 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition"
            >
              <Sparkles className="w-3 h-3 inline mr-1 text-indigo-300" />
              {q}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
