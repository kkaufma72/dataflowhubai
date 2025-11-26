import React from 'react';
import { Star, CheckCircle, ExternalLink } from 'lucide-react';
import { Testimonial } from '../../data/testimonials';

interface TestimonialCardProps {
  testimonial: Testimonial;
  variant?: 'default' | 'featured' | 'compact';
}

export const TestimonialCard: React.FC<TestimonialCardProps> = ({ 
  testimonial,
  variant = 'default'
}) => {
  const { quote, author, role, company, avatar, linkedIn, verified, metrics } = testimonial;

  if (variant === 'compact') {
    return (
      <div className="bg-white p-4 rounded-lg border border-gray-200">
        <div className="flex items-center gap-1 mb-2">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-3 h-3 fill-yellow-400 text-yellow-400" />
          ))}
        </div>
        <p className="text-sm text-gray-700 mb-3 line-clamp-3">"{quote}"</p>
        <div className="flex items-center gap-2">
          {avatar ? (
            <img src={avatar} alt={author} className="w-8 h-8 rounded-full" />
          ) : (
            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
              <span className="text-white font-semibold text-xs">
                {author.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          )}
          <div>
            <p className="text-xs font-bold text-gray-900">{author}</p>
            <p className="text-xs text-gray-500">{role}</p>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'featured') {
    return (
      <div className="bg-gradient-to-br from-indigo-50 to-purple-50 p-8 rounded-2xl border-2 border-indigo-200 shadow-lg">
        {/* Rating */}
        <div className="flex items-center gap-1 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
          ))}
          {verified && (
            <span className="ml-2 flex items-center gap-1 text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded-full">
              <CheckCircle className="w-3 h-3" />
              Verified Customer
            </span>
          )}
        </div>

        {/* Quote */}
        <blockquote className="text-xl font-medium text-gray-900 mb-6 leading-relaxed">
          "{quote}"
        </blockquote>

        {/* Metrics (if available) */}
        {metrics && (
          <div className="bg-white/60 backdrop-blur-sm border border-indigo-200 rounded-lg p-4 mb-6">
            <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wide mb-1">
              {metrics.label}
            </p>
            <p className="text-2xl font-bold text-indigo-900">{metrics.value}</p>
          </div>
        )}

        {/* Author */}
        <div className="flex items-center gap-4">
          {avatar ? (
            <img 
              src={avatar} 
              alt={author} 
              className="w-16 h-16 rounded-full border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-16 h-16 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center border-2 border-white shadow-md">
              <span className="text-white font-bold text-xl">
                {author.split(' ').map(n => n[0]).join('')}
              </span>
            </div>
          )}
          <div className="flex-1">
            <div className="flex items-center gap-2">
              <p className="font-bold text-gray-900 text-lg">{author}</p>
              {linkedIn && (
                <a 
                  href={linkedIn} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:text-indigo-700 transition-colors"
                  title="View LinkedIn Profile"
                >
                  <ExternalLink className="w-4 h-4" />
                </a>
              )}
            </div>
            <p className="text-gray-600">{role}</p>
            <p className="text-sm text-gray-500">{company}</p>
          </div>
        </div>
      </div>
    );
  }

  // Default variant
  return (
    <div className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow">
      {/* Rating */}
      <div className="flex items-center gap-1 mb-4">
        {[...Array(5)].map((_, i) => (
          <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
        ))}
        {verified && (
          <span className="ml-2 flex items-center gap-1 text-xs font-medium text-green-700">
            <CheckCircle className="w-3 h-3" />
            Verified
          </span>
        )}
      </div>

      {/* Quote */}
      <p className="text-gray-700 mb-4 text-sm leading-relaxed">
        "{quote}"
      </p>

      {/* Metrics (if available) */}
      {metrics && (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-3 mb-4">
          <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-0.5">
            {metrics.label}
          </p>
          <p className="text-lg font-bold text-gray-900">{metrics.value}</p>
        </div>
      )}

      {/* Author */}
      <div className="flex items-center gap-3">
        {avatar ? (
          <img 
            src={avatar} 
            alt={author} 
            className="w-10 h-10 rounded-full"
          />
        ) : (
          <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
            <span className="text-white font-semibold text-sm">
              {author.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <p className="font-medium text-gray-900 text-sm">{author}</p>
            {linkedIn && (
              <a 
                href={linkedIn} 
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-400 hover:text-indigo-600 transition-colors"
                title="View LinkedIn Profile"
              >
                <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
          <p className="text-gray-500 text-xs">{role}, {company}</p>
        </div>
      </div>
    </div>
  );
};

export default TestimonialCard;
