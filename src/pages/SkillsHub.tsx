import React, { useEffect, useState } from 'react';
import { BookOpen, Lightbulb, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import toast from 'react-hot-toast';

type SkillSummary = {
  id: string;
  name: string;
  description: string;
};

type SkillDetail = SkillSummary & {
  content: string;
  path: string;
};

const SkillsHub: React.FC = () => {
  const [skills, setSkills] = useState<SkillSummary[]>([]);
  const [selected, setSelected] = useState<SkillDetail | null>(null);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingSkill, setLoadingSkill] = useState(false);
  const [assistantPrompt, setAssistantPrompt] = useState('');
  const [assistantResponse, setAssistantResponse] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [streamError, setStreamError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSkills();
  }, []);

  const fetchSkills = async () => {
    try {
      setLoadingList(true);
      setError(null);
      const res = await fetch('/api/skills');
      if (!res.ok) throw new Error('Failed to load skills');
      const data: SkillSummary[] = await res.json();
      setSkills(data);
      if (data.length > 0) {
        await fetchSkillContent(data[0].id);
      }
    } catch (err: any) {
      setError(err.message || 'Unable to load skills');
    } finally {
      setLoadingList(false);
    }
  };

  const fetchSkillContent = async (id: string) => {
    try {
      setLoadingSkill(true);
      setError(null);
      const res = await fetch(`/api/skills/${id}`);
      if (!res.ok) throw new Error('Failed to load skill content');
      const data: SkillDetail = await res.json();
      setSelected(data);
    } catch (err: any) {
      setError(err.message || 'Unable to load skill content');
    } finally {
      setLoadingSkill(false);
    }
  };

  const handleCopy = async () => {
    if (!selected?.content) return;
    await navigator.clipboard.writeText(selected.content);
    toast.success('Skill content copied to clipboard');
  };

  const runAssistant = async () => {
    if (!assistantPrompt.trim()) {
      toast.error('Enter a prompt to send to the assistant');
      return;
    }

    setAssistantResponse('');
    setStreaming(true);
    setStreamError(null);

    try {
      const res = await fetch('/api/skills/assistant/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: assistantPrompt }),
      });

      if (!res.ok || !res.body) {
        const text = await res.text();
        throw new Error(text || 'Assistant request failed');
      }

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        setAssistantResponse((prev) => prev + chunk);
      }
    } catch (err: any) {
      const msg = err?.message || 'Assistant streaming failed';
      setStreamError(msg);
      toast.error(msg);
    } finally {
      setStreaming(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 shadow-lg">
            <BookOpen className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold text-white">Skills Hub</h1>
            <p className="text-gray-300">Route Codex skills directly into the app UI.</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-gray-200">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <span className="text-sm">Production ML playbooks at your fingertips</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 text-gray-200">
            <Lightbulb className="w-4 h-4 text-emerald-400" />
            <span className="text-sm">Content served from local skills directory</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <Card className="lg:col-span-1 bg-gray-900 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-white">Available Skills</h2>
            <Button
              type="button"
              variant="ghost"
              className="text-sm text-indigo-300 hover:text-white"
              onClick={fetchSkills}
              disabled={loadingList}
            >
              <RefreshCw className={`w-4 h-4 mr-1 ${loadingList ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
          </div>
          {loadingList && (
            <div className="text-gray-400 text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Loading skills...
            </div>
          )}
          {!loadingList && skills.length === 0 && (
            <p className="text-gray-400 text-sm">No skills discovered.</p>
          )}
          <div className="space-y-3 mt-2">
            {skills.map((skill) => {
              const isActive = selected?.id === skill.id;
              return (
                <button
                  key={skill.id}
                  onClick={() => fetchSkillContent(skill.id)}
                  className={`w-full text-left p-3 rounded-lg border transition-all ${
                    isActive
                      ? 'border-indigo-500 bg-indigo-500/10 text-white'
                      : 'border-gray-800 bg-gray-800 text-gray-200 hover:border-indigo-500/60 hover:bg-gray-800/80'
                  }`}
                >
                  <p className="text-sm font-semibold">{skill.name}</p>
                  <p className="text-xs text-gray-400 mt-1">{skill.description}</p>
                </button>
              );
            })}
          </div>
        </Card>

        <Card className="lg:col-span-2 bg-gray-900 border border-gray-800">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm text-gray-400">Skill Content</p>
              <h2 className="text-xl font-semibold text-white">{selected?.name || 'Select a skill'}</h2>
              {selected?.path && (
                <p className="text-xs text-gray-500 mt-1">Source: {selected.path}</p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="secondary"
                onClick={handleCopy}
                disabled={!selected?.content}
              >
                Copy
              </Button>
            </div>
          </div>

          {error && (
            <div className="mb-3 px-4 py-3 rounded-lg border border-red-500/50 bg-red-500/10 text-red-200 text-sm">
              {error}
            </div>
          )}

          {loadingSkill && (
            <div className="flex items-center gap-2 text-gray-300">
              <Loader2 className="w-5 h-5 animate-spin" />
              Loading skill content...
            </div>
          )}

          {!loadingSkill && selected?.content && (
            <div className="bg-gray-950 border border-gray-800 rounded-lg p-4 overflow-auto max-h-[70vh]">
              <pre className="whitespace-pre-wrap text-sm text-gray-100 leading-relaxed">
                {selected.content}
              </pre>
            </div>
          )}

          {!loadingSkill && !selected?.content && !error && (
            <p className="text-gray-400 text-sm">Select a skill to view its guidance.</p>
          )}
        </Card>
      </div>

      <Card className="bg-gray-900 border border-gray-800">
        <div className="flex items-center justify-between mb-3">
          <div>
            <p className="text-sm text-gray-400">vLLM Assistant</p>
            <h2 className="text-lg font-semibold text-white">Try the Skills Assistant</h2>
          </div>
          <Button
            type="button"
            onClick={runAssistant}
            disabled={streaming}
            className="flex items-center gap-2"
          >
            {streaming && <Loader2 className="w-4 h-4 animate-spin" />}Send
          </Button>
        </div>

        <div className="space-y-3">
          <textarea
            className="w-full rounded-md border border-gray-700 bg-gray-950 text-gray-100 p-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            rows={3}
            placeholder="Ask for a skill plan, JSON action, or ML guidance..."
            value={assistantPrompt}
            onChange={(e) => setAssistantPrompt(e.target.value)}
            disabled={streaming}
          />

          {streamError && (
            <div className="px-3 py-2 rounded-md border border-red-500/50 bg-red-500/10 text-red-200 text-sm">
              {streamError}
            </div>
          )}

          <div className="bg-gray-950 border border-gray-800 rounded-lg p-3 min-h-[120px]">
            {assistantResponse ? (
              <pre className="whitespace-pre-wrap text-sm text-gray-100">{assistantResponse}</pre>
            ) : (
              <p className="text-gray-500 text-sm">Response will appear here.</p>
            )}
          </div>
        </div>
      </Card>
    </div>
  );
};

export default SkillsHub;
