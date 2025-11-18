import React, { useState } from 'react';
import { Search, ChevronDown, ChevronUp, MessageCircle } from 'lucide-react';

interface FAQ {
  question: string;
  answer: string;
  category: 'pricing' | 'features' | 'technical' | 'billing';
}

const faqs: FAQ[] = [
  {
    question: "Can I change plans later?",
    answer: "Yes! You can upgrade or downgrade your plan at any time. When upgrading, you'll be charged a prorated amount. When downgrading, the change takes effect at your next billing cycle.",
    category: "pricing"
  },
  {
    question: "What happens if I exceed my plan limits?",
    answer: "We'll send you a notification when you're approaching your limits. You can either upgrade your plan or we'll temporarily pause new operations until your next billing cycle. Your existing data is always safe.",
    category: "pricing"
  },
  {
    question: "Do you offer annual discounts?",
    answer: "Yes! Save 17% by choosing annual billing on any paid plan. That's 2 months free every year.",
    category: "pricing"
  },
  {
    question: "Is there a free trial?",
    answer: "Every paid plan comes with a 14-day free trial. No credit card required to start. Plus, there's always our Free plan to get familiar with the platform.",
    category: "pricing"
  },
  {
    question: "What AI models do you use?",
    answer: "We use GPT-4 for natural language understanding, combined with specialized ML models for data analysis. All models are continuously updated to provide the best results.",
    category: "features"
  },
  {
    question: "Can I export my data?",
    answer: "Absolutely! Export your data in CSV, Excel, JSON, or PDF formats at any time. You own your data, and we make it easy to take it with you.",
    category: "features"
  },
  {
    question: "How secure is my data?",
    answer: "Very secure. We use bank-level encryption (AES-256) for data at rest and TLS 1.3 for data in transit. We're SOC 2 certified and GDPR compliant. Your data is never used to train AI models.",
    category: "technical"
  },
  {
    question: "Do you integrate with other tools?",
    answer: "Yes! We offer integrations with Salesforce, HubSpot, Google Sheets, Slack, and more. Enterprise plans get access to our API for custom integrations.",
    category: "technical"
  },
  {
    question: "What payment methods do you accept?",
    answer: "We accept all major credit cards (Visa, Mastercard, Amex), PayPal, and ACH transfers for Enterprise plans. All payments are processed securely through Stripe.",
    category: "billing"
  },
  {
    question: "Can I get a refund?",
    answer: "Yes! We offer a 14-day money-back guarantee on all paid plans. If you're not satisfied for any reason, just contact us for a full refund.",
    category: "billing"
  }
];

export const PricingFAQ: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', label: 'All Questions' },
    { id: 'pricing', label: 'Pricing' },
    { id: 'features', label: 'Features' },
    { id: 'technical', label: 'Technical' },
    { id: 'billing', label: 'Billing' }
  ];

  const filteredFAQs = faqs.filter(faq => {
    const matchesSearch = faq.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         faq.answer.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || faq.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <h2 className="page-title mb-2">Frequently Asked Questions</h2>
        <p className="page-subtitle">Find answers to common questions about pricing and features</p>
      </div>

      {/* Search Bar */}
      <div className="relative max-w-2xl mx-auto">
        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Search questions..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="form-input-improved pl-12 pr-4"
        />
      </div>

      {/* Category Filters */}
      <div className="flex flex-wrap justify-center gap-3">
        {categories.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`px-4 py-2 rounded-lg font-medium transition ${
              selectedCategory === category.id
                ? 'bg-primary text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {category.label}
          </button>
        ))}
      </div>

      {/* FAQ List */}
      <div className="max-w-3xl mx-auto space-y-3">
        {filteredFAQs.length === 0 ? (
          <div className="text-center py-12">
            <MessageCircle className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <p className="body-text text-gray-500">No questions found. Try a different search term.</p>
          </div>
        ) : (
          filteredFAQs.map((faq, index) => (
            <div key={index} className="card-improved overflow-hidden">
              <button
                onClick={() => setExpandedIndex(expandedIndex === index ? null : index)}
                className="w-full px-6 py-4 flex items-center justify-between hover:bg-gray-50 transition"
              >
                <span className="card-title text-left">{faq.question}</span>
                {expandedIndex === index ? (
                  <ChevronUp className="w-5 h-5 text-primary flex-shrink-0 ml-4" />
                ) : (
                  <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0 ml-4" />
                )}
              </button>
              
              {expandedIndex === index && (
                <div className="px-6 pb-4 border-t border-gray-100">
                  <p className="body-text text-gray-700 pt-4">{faq.answer}</p>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Still have questions? */}
      <div className="text-center mt-12 p-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl">
        <h3 className="card-title mb-2">Still have questions?</h3>
        <p className="body-text text-gray-700 mb-4">
          Our team is here to help. Get in touch and we'll respond within 24 hours.
        </p>
        <div className="flex gap-4 justify-center flex-wrap">
          <button className="btn-primary-improved">
            <MessageCircle className="w-4 h-4 mr-2" />
            Live Chat
          </button>
          <button className="btn-secondary-improved">
            Email Support
          </button>
        </div>
      </div>
    </div>
  );
};
