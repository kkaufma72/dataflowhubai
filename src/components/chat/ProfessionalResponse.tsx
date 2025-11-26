/**
 * Professional Response Renderer
 * 
 * Transforms AI responses into beautiful, context-rich visualizations
 * with clean typography, data cards, and metric displays.
 */

import React, { useMemo, useState } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Target, 
  CheckCircle2, 
  AlertTriangle,
  Lightbulb,
  BarChart3,
  Brain,
  BookOpen,
  Zap,
  ChevronDown,
  ChevronUp,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';

interface MetricCardProps {
  label: string;
  value: string | number;
  unit?: string;
  trend?: 'up' | 'down' | 'neutral';
  color?: 'blue' | 'green' | 'amber' | 'red' | 'purple';
  description?: string;
}

const MetricCard: React.FC<MetricCardProps> = ({ 
  label, 
  value, 
  unit = '', 
  trend, 
  color = 'blue',
  description 
}) => {
  const colorStyles = {
    blue: 'from-blue-500/10 to-blue-600/5 border-blue-500/20 text-blue-600',
    green: 'from-emerald-500/10 to-emerald-600/5 border-emerald-500/20 text-emerald-600',
    amber: 'from-amber-500/10 to-amber-600/5 border-amber-500/20 text-amber-600',
    red: 'from-red-500/10 to-red-600/5 border-red-500/20 text-red-600',
    purple: 'from-purple-500/10 to-purple-600/5 border-purple-500/20 text-purple-600'
  };

  return (
    <div className={`relative overflow-hidden rounded-xl border bg-gradient-to-br p-4 ${colorStyles[color]}`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider opacity-70">{label}</p>
          <div className="mt-1 flex items-baseline gap-1">
            <span className="text-2xl font-bold">{value}</span>
            {unit && <span className="text-sm font-medium opacity-70">{unit}</span>}
          </div>
          {description && (
            <p className="mt-1 text-xs opacity-60">{description}</p>
          )}
        </div>
        {trend && (
          <div className={`rounded-full p-1.5 ${trend === 'up' ? 'bg-emerald-100 text-emerald-600' : trend === 'down' ? 'bg-red-100 text-red-600' : 'bg-gray-100 text-gray-500'}`}>
            {trend === 'up' ? <TrendingUp className="w-4 h-4" /> : trend === 'down' ? <TrendingDown className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
          </div>
        )}
      </div>
      {/* Decorative gradient blob */}
      <div className={`absolute -right-4 -top-4 h-16 w-16 rounded-full bg-current opacity-5 blur-xl`} />
    </div>
  );
};

interface InsightCardProps {
  type: 'finding' | 'warning' | 'recommendation' | 'insight';
  title: string;
  content: string;
  priority?: 'high' | 'medium' | 'low';
}

const InsightCard: React.FC<InsightCardProps> = ({ type, title, content, priority }) => {
  const typeStyles = {
    finding: { icon: Lightbulb, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', iconBg: 'bg-amber-100' },
    warning: { icon: AlertTriangle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', iconBg: 'bg-red-100' },
    recommendation: { icon: CheckCircle2, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', iconBg: 'bg-emerald-100' },
    insight: { icon: Sparkles, bg: 'bg-purple-50', border: 'border-purple-200', text: 'text-purple-700', iconBg: 'bg-purple-100' }
  };

  const style = typeStyles[type];
  const Icon = style.icon;

  return (
    <div className={`${style.bg} ${style.border} border rounded-lg p-4`}>
      <div className="flex items-start gap-3">
        <div className={`${style.iconBg} rounded-lg p-2 flex-shrink-0`}>
          <Icon className={`w-4 h-4 ${style.text}`} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className={`font-semibold ${style.text}`}>{title}</h4>
            {priority && (
              <span className={`text-xs px-1.5 py-0.5 rounded-full font-medium ${
                priority === 'high' ? 'bg-red-100 text-red-700' :
                priority === 'medium' ? 'bg-amber-100 text-amber-700' :
                'bg-gray-100 text-gray-600'
              }`}>
                {priority}
              </span>
            )}
          </div>
          <p className={`mt-1 text-sm ${style.text} opacity-80`}>{content}</p>
        </div>
      </div>
    </div>
  );
};

interface SectionProps {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  collapsible?: boolean;
  defaultOpen?: boolean;
}

const Section: React.FC<SectionProps> = ({ title, icon: Icon, children, collapsible = false, defaultOpen = true }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm">
      <button
        onClick={() => collapsible && setIsOpen(!isOpen)}
        className={`w-full px-5 py-4 flex items-center gap-3 bg-gradient-to-r from-gray-50 to-white border-b border-gray-100 ${collapsible ? 'cursor-pointer hover:from-gray-100' : 'cursor-default'}`}
      >
        <div className="w-8 h-8 rounded-lg bg-primary-100 flex items-center justify-center">
          <Icon className="w-4 h-4 text-primary-600" />
        </div>
        <h3 className="font-semibold text-gray-800 flex-1 text-left">{title}</h3>
        {collapsible && (
          isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />
        )}
      </button>
      {(!collapsible || isOpen) && (
        <div className="p-5">
          {children}
        </div>
      )}
    </div>
  );
};

interface ProfessionalResponseProps {
  content: string;
  modelMetrics?: {
    accuracy?: number;
    precision?: number;
    recall?: number;
    f1Score?: number;
  };
  dataContext?: {
    rows?: number;
    columns?: number;
    datasetName?: string;
    source?: string;
  };
}

const ProfessionalResponse: React.FC<ProfessionalResponseProps> = ({ 
  content,
  modelMetrics,
  dataContext
}) => {
  // Parse markdown-like content into structured sections
  const parsedContent = useMemo(() => {
    const sections: { type: string; title: string; content: string[] }[] = [];
    let currentSection: { type: string; title: string; content: string[] } | null = null;
    
    const lines = content.split('\n');
    
    for (const line of lines) {
      // Detect section headers
      if (line.startsWith('## ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'section', title: line.replace(/^## /, '').replace(/[📊🔬💡📈⚠️✅🎯📖🧠🔮]/g, '').trim(), content: [] };
      } else if (line.startsWith('### ')) {
        if (currentSection) sections.push(currentSection);
        currentSection = { type: 'subsection', title: line.replace(/^### /, '').replace(/[📊🔬💡📈⚠️✅🎯📖🧠🔮]/g, '').trim(), content: [] };
      } else if (line.trim() && currentSection) {
        currentSection.content.push(line);
      } else if (line.trim() && !currentSection) {
        currentSection = { type: 'intro', title: 'Overview', content: [line] };
      }
    }
    
    if (currentSection) sections.push(currentSection);
    
    return sections;
  }, [content]);

  const getSectionIcon = (title: string) => {
    const lower = title.toLowerCase();
    if (lower.includes('overview') || lower.includes('summary')) return BookOpen;
    if (lower.includes('data') || lower.includes('story')) return BarChart3;
    if (lower.includes('method') || lower.includes('approach')) return Brain;
    if (lower.includes('finding') || lower.includes('insight')) return Lightbulb;
    if (lower.includes('performance') || lower.includes('accuracy')) return Target;
    if (lower.includes('limitation') || lower.includes('caveat') || lower.includes('warning')) return AlertTriangle;
    if (lower.includes('recommend') || lower.includes('action')) return CheckCircle2;
    if (lower.includes('conclusion')) return Sparkles;
    if (lower.includes('reason') || lower.includes('why')) return Info;
    return Zap;
  };

  const renderContent = (lines: string[]) => {
    return lines.map((line, i) => {
      // Bullet points
      if (line.trim().startsWith('-') || line.trim().startsWith('•')) {
        const text = line.replace(/^[-•]\s*/, '').trim();
        // Check for bold text
        const formattedText = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
        return (
          <li key={i} className="flex items-start gap-2 py-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-primary-500 mt-2 flex-shrink-0" />
            <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: formattedText }} />
          </li>
        );
      }
      
      // Numbered lists
      if (/^\d+\./.test(line.trim())) {
        const text = line.replace(/^\d+\.\s*/, '').trim();
        const num = line.match(/^(\d+)\./)?.[1];
        const formattedText = text.replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>');
        return (
          <li key={i} className="flex items-start gap-3 py-1.5">
            <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 text-xs font-bold flex items-center justify-center flex-shrink-0">{num}</span>
            <span className="text-gray-700" dangerouslySetInnerHTML={{ __html: formattedText }} />
          </li>
        );
      }
      
      // Regular paragraphs
      if (line.trim()) {
        const formattedText = line
          .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold text-gray-900">$1</strong>')
          .replace(/\*([^*]+)\*/g, '<em class="italic">$1</em>');
        return (
          <p key={i} className="text-gray-700 leading-relaxed" dangerouslySetInnerHTML={{ __html: formattedText }} />
        );
      }
      
      return null;
    });
  };

  return (
    <div className="space-y-4">
      {/* Model Metrics Cards - Show if we have metrics */}
      {modelMetrics && Object.keys(modelMetrics).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {modelMetrics.accuracy !== undefined && (
            <MetricCard
              label="Accuracy"
              value={(modelMetrics.accuracy * 100).toFixed(1)}
              unit="%"
              color={modelMetrics.accuracy >= 0.85 ? 'green' : modelMetrics.accuracy >= 0.7 ? 'amber' : 'red'}
              trend={modelMetrics.accuracy >= 0.8 ? 'up' : 'neutral'}
              description="Overall correctness"
            />
          )}
          {modelMetrics.precision !== undefined && (
            <MetricCard
              label="Precision"
              value={(modelMetrics.precision * 100).toFixed(1)}
              unit="%"
              color="blue"
              description="Positive predictions"
            />
          )}
          {modelMetrics.recall !== undefined && (
            <MetricCard
              label="Recall"
              value={(modelMetrics.recall * 100).toFixed(1)}
              unit="%"
              color="purple"
              description="Captured positives"
            />
          )}
          {modelMetrics.f1Score !== undefined && (
            <MetricCard
              label="F1 Score"
              value={(modelMetrics.f1Score * 100).toFixed(1)}
              unit="%"
              color="amber"
              description="Balanced measure"
            />
          )}
        </div>
      )}

      {/* Data Context Card */}
      {dataContext && (
        <div className="flex items-center gap-4 p-4 bg-gradient-to-r from-slate-50 to-blue-50 rounded-xl border border-slate-200 mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
            <BarChart3 className="w-6 h-6 text-white" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800">{dataContext.datasetName || 'Dataset'}</h4>
            <div className="flex items-center gap-4 text-sm text-gray-600 mt-0.5">
              {dataContext.rows && <span>{dataContext.rows.toLocaleString()} rows</span>}
              {dataContext.columns && <span>•</span>}
              {dataContext.columns && <span>{dataContext.columns} columns</span>}
              {dataContext.source && <span>•</span>}
              {dataContext.source && <span className="capitalize">{dataContext.source}</span>}
            </div>
          </div>
        </div>
      )}

      {/* Parsed Sections */}
      {parsedContent.map((section, idx) => (
        <Section
          key={idx}
          title={section.title}
          icon={getSectionIcon(section.title)}
          collapsible={idx > 0}
          defaultOpen={idx < 3}
        >
          <div className="space-y-3">
            {section.content.some(l => l.trim().startsWith('-') || l.trim().startsWith('•') || /^\d+\./.test(l.trim())) ? (
              <ul className="space-y-1">
                {renderContent(section.content)}
              </ul>
            ) : (
              renderContent(section.content)
            )}
          </div>
        </Section>
      ))}
    </div>
  );
};

export default ProfessionalResponse;
export { MetricCard, InsightCard, Section };

