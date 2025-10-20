import React from 'react';
import { Sparkles } from 'lucide-react';
import EnhancedAIChat from '../components/ai/EnhancedAIChat';
import PageHeader from '../components/common/PageHeader';

const AIChat: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <PageHeader
        title="AI Assistant"
        description="Chat with your data using natural language"
        icon={Sparkles}
      />
      
      <div className="flex-1 min-h-0">
        <EnhancedAIChat />
      </div>
    </div>
  );
};

export default AIChat;