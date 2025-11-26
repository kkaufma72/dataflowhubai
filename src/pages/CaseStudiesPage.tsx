import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Building2, TrendingUp, ArrowRight, Filter, Tag } from 'lucide-react';
import { caseStudies, getFeaturedCaseStudies } from '../data/caseStudies';
import type { CaseStudy } from '../data/caseStudies';

const CaseStudiesPage: React.FC = () => {
  const [selectedIndustry, setSelectedIndustry] = useState<string>('all');
  const [selectedTag, setSelectedTag] = useState<string>('all');

  const industries = ['all', ...Array.from(new Set(caseStudies.map(cs => cs.industry)))];
  const allTags = Array.from(new Set(caseStudies.flatMap(cs => cs.tags)));

  const filteredCaseStudies = caseStudies.filter(cs => {
    const industryMatch = selectedIndustry === 'all' || cs.industry === selectedIndustry;
    const tagMatch = selectedTag === 'all' || cs.tags.includes(selectedTag);
    return industryMatch && tagMatch;
  });

  const featuredStudies = getFeaturedCaseStudies();

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Building2 className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-2">Customer Success Stories</h1>
              <p className="text-xl text-indigo-100">
                Real results from businesses transforming their data workflows
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16">
        {/* Impact Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-16">
          {[
            { label: 'Combined Savings', value: '$8.2M+', color: 'green' },
            { label: 'Average Time Saved', value: '87%', color: 'blue' },
            { label: 'Customer Success Rate', value: '96%', color: 'purple' },
            { label: 'Average ROI', value: '450%', color: 'amber' }
          ].map((stat, idx) => (
            <div key={idx} className="bg-white rounded-xl border-2 border-gray-200 p-6 text-center">
              <p className={`text-3xl font-bold text-${stat.color}-600 mb-1`}>{stat.value}</p>
              <p className="text-sm text-gray-600 font-medium">{stat.label}</p>
            </div>
          ))}
        </div>

        {/* Featured Case Study */}
        {featuredStudies.length > 0 && (
          <section className="mb-16">
            <div className="flex items-center gap-2 mb-6">
              <TrendingUp className="w-6 h-6 text-indigo-600" />
              <h2 className="text-3xl font-bold text-gray-900">Featured Success Story</h2>
            </div>
            
            <FeaturedCaseStudyCard caseStudy={featuredStudies[0]} />
          </section>
        )}

        {/* Filters */}
        <div className="bg-white rounded-xl border-2 border-gray-200 p-6 mb-8">
          <div className="flex flex-col md:flex-row gap-6">
            {/* Industry Filter */}
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Filter className="w-4 h-4" />
                Filter by Industry
              </label>
              <select
                value={selectedIndustry}
                onChange={(e) => setSelectedIndustry(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              >
                {industries.map(industry => (
                  <option key={industry} value={industry}>
                    {industry === 'all' ? 'All Industries' : industry}
                  </option>
                ))}
              </select>
            </div>

            {/* Tag Filter */}
            <div className="flex-1">
              <label className="flex items-center gap-2 text-sm font-bold text-gray-700 mb-2">
                <Tag className="w-4 h-4" />
                Filter by Tag
              </label>
              <select
                value={selectedTag}
                onChange={(e) => setSelectedTag(e.target.value)}
                className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:border-indigo-500 focus:outline-none"
              >
                <option value="all">All Tags</option>
                {allTags.map(tag => (
                  <option key={tag} value={tag}>{tag}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Active Filters */}
          {(selectedIndustry !== 'all' || selectedTag !== 'all') && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm font-medium text-gray-600">Active filters:</span>
              {selectedIndustry !== 'all' && (
                <span className="px-3 py-1 bg-indigo-100 text-indigo-700 text-xs font-bold rounded-full">
                  {selectedIndustry}
                </span>
              )}
              {selectedTag !== 'all' && (
                <span className="px-3 py-1 bg-purple-100 text-purple-700 text-xs font-bold rounded-full">
                  {selectedTag}
                </span>
              )}
              <button
                onClick={() => {
                  setSelectedIndustry('all');
                  setSelectedTag('all');
                }}
                className="ml-2 text-xs text-gray-500 hover:text-gray-700 underline"
              >
                Clear all
              </button>
            </div>
          )}
        </div>

        {/* Case Studies Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredCaseStudies.map(caseStudy => (
            <CaseStudyCard key={caseStudy.id} caseStudy={caseStudy} />
          ))}
        </div>

        {filteredCaseStudies.length === 0 && (
          <div className="text-center py-16">
            <Building2 className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">No case studies found</h3>
            <p className="text-gray-600 mb-6">Try adjusting your filters</p>
            <button
              onClick={() => {
                setSelectedIndustry('all');
                setSelectedTag('all');
              }}
              className="px-6 py-2 bg-indigo-600 text-white font-medium rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* CTA Section */}
        <section className="mt-16 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-12 text-white text-center">
          <h2 className="text-4xl font-bold mb-4">Ready to Write Your Success Story?</h2>
          <p className="text-xl text-indigo-100 mb-8 max-w-2xl mx-auto">
            Join hundreds of businesses achieving measurable results with DataFlowHub AI
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/signin"
              className="px-8 py-4 bg-white text-indigo-600 font-bold rounded-lg hover:bg-gray-100 transition-colors"
            >
              Start Free Trial
            </Link>
            <Link
              to="/product-tour"
              className="px-8 py-4 border-2 border-white text-white font-bold rounded-lg hover:bg-white/10 transition-colors"
            >
              See Demo
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

// Featured Case Study Card (Large)
const FeaturedCaseStudyCard: React.FC<{ caseStudy: CaseStudy }> = ({ caseStudy }) => {
  return (
    <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200 overflow-hidden">
      <div className="grid md:grid-cols-2 gap-8 p-8">
        {/* Left Column */}
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-indigo-600 text-white text-xs font-bold rounded-full mb-4">
            <TrendingUp className="w-3 h-3" />
            FEATURED STORY
          </div>
          <h3 className="text-3xl font-bold text-gray-900 mb-4">{caseStudy.summary}</h3>
          <div className="flex items-center gap-4 mb-6 text-sm text-gray-600">
            <span className="font-bold">{caseStudy.industry}</span>
            <span>•</span>
            <span>{caseStudy.companySize}</span>
          </div>
          <p className="text-gray-700 mb-6 leading-relaxed">{caseStudy.challenge}</p>
          
          {/* Tags */}
          <div className="flex flex-wrap gap-2 mb-6">
            {caseStudy.tags.map(tag => (
              <span key={tag} className="px-3 py-1 bg-white border border-indigo-200 text-indigo-700 text-xs font-bold rounded-full">
                {tag}
              </span>
            ))}
          </div>

          <Link
            to={`/case-studies/${caseStudy.slug}`}
            className="inline-flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
          >
            Read Full Story
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Right Column - Results */}
        <div className="bg-white/60 backdrop-blur-sm rounded-xl p-6 border border-indigo-200">
          <h4 className="text-lg font-bold text-gray-900 mb-4">Key Results</h4>
          <div className="space-y-4">
            {caseStudy.results.slice(0, 3).map((result, idx) => (
              <div key={idx} className="border-b border-gray-200 pb-3 last:border-0">
                <p className="text-sm font-semibold text-gray-600 mb-1">{result.metric}</p>
                <div className="flex items-center gap-3">
                  <span className="text-sm text-gray-500 line-through">{result.before}</span>
                  <ArrowRight className="w-4 h-4 text-green-600" />
                  <span className="text-lg font-bold text-gray-900">{result.after}</span>
                </div>
                <p className="text-xs font-bold text-green-600 mt-1">{result.improvement}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Testimonial */}
      <div className="bg-white/80 backdrop-blur-sm border-t-2 border-indigo-200 p-6">
        <p className="text-lg font-medium text-gray-900 italic mb-4">"{caseStudy.testimonial.quote}"</p>
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-bold">
              {caseStudy.testimonial.author.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-bold text-gray-900">{caseStudy.testimonial.author}</p>
            <p className="text-sm text-gray-600">{caseStudy.testimonial.role}, {caseStudy.company}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Regular Case Study Card
const CaseStudyCard: React.FC<{ caseStudy: CaseStudy }> = ({ caseStudy }) => {
  return (
    <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden hover:shadow-xl transition-all group">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-indigo-100">{caseStudy.industry}</span>
          {caseStudy.featured && (
            <span className="px-2 py-1 bg-white/20 text-white text-xs font-bold rounded">Featured</span>
          )}
        </div>
        <h3 className="text-lg font-bold text-white line-clamp-2 group-hover:text-indigo-100 transition-colors">
          {caseStudy.company}
        </h3>
      </div>

      {/* Content */}
      <div className="p-6">
        <p className="text-gray-700 text-sm mb-4 line-clamp-3">{caseStudy.summary}</p>

        {/* Top Result */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-green-700 uppercase mb-1">
            {caseStudy.results[0].metric}
          </p>
          <p className="text-lg font-bold text-green-900">{caseStudy.results[0].improvement}</p>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-4">
          {caseStudy.tags.slice(0, 3).map(tag => (
            <span key={tag} className="px-2 py-1 bg-gray-100 text-gray-600 text-xs font-medium rounded">
              {tag}
            </span>
          ))}
        </div>

        <Link
          to={`/case-studies/${caseStudy.slug}`}
          className="inline-flex items-center gap-2 text-indigo-600 font-bold text-sm hover:text-indigo-700 transition-colors group"
        >
          Read Full Story
          <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>
    </div>
  );
};

export default CaseStudiesPage;
