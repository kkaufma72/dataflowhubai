import React from 'react';
import { Star, Award, Shield, Clock, TrendingUp, Users } from 'lucide-react';

export const TrustSignals: React.FC = () => {
  const stats = [
    { icon: Users, value: "10,000+", label: "Active Users", color: "text-blue-500" },
    { icon: TrendingUp, value: "50M+", label: "Datasets Analyzed", color: "text-green-500" },
    { icon: Clock, value: "<5min", label: "Avg. Setup Time", color: "text-purple-500" },
    { icon: Star, value: "4.9/5", label: "User Rating", color: "text-yellow-500" }
  ];

  const testimonials = [
    {
      quote: "Reduced our data analysis time from days to hours. Game changer!",
      author: "Sarah Chen",
      role: "Data Director at TechCorp",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sarah"
    },
    {
      quote: "The AI recommendations are incredibly accurate. Like having a data scientist on demand.",
      author: "Michael Rodriguez",
      role: "VP Analytics at RetailCo",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Michael"
    },
    {
      quote: "Finally, an ML platform my entire marketing team can actually use.",
      author: "Emily Watson",
      role: "CMO at Growth Labs",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Emily"
    }
  ];

  const trustBadges = [
    { icon: Shield, text: "SOC 2 Certified", description: "Enterprise-grade security" },
    { icon: Award, text: "GDPR Compliant", description: "Full data privacy" },
    { icon: Shield, text: "99.9% Uptime", description: "Reliable infrastructure" }
  ];

  return (
    <div className="space-y-12">
      {/* Stats Section */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className="stat-card text-center">
              <div className="flex justify-center mb-3">
                <Icon className={`w-8 h-8 ${stat.color}`} />
              </div>
              <div className="stat-value text-gray-900">{stat.value}</div>
              <div className="stat-label mt-1">{stat.label}</div>
            </div>
          );
        })}
      </div>

      {/* Testimonials */}
      <div>
        <h3 className="section-title text-center mb-2">Loved by Teams Worldwide</h3>
        <p className="section-subtitle text-center mb-8">See what our customers are saying</p>
        
        <div className="grid md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <div key={index} className="card-improved p-6 hover:shadow-lg transition">
              {/* Star Rating */}
              <div className="flex gap-1 mb-4">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                ))}
              </div>
              
              {/* Quote */}
              <p className="body-text text-gray-700 mb-4 italic">
                "{testimonial.quote}"
              </p>
              
              {/* Author */}
              <div className="flex items-center gap-3">
                <img
                  src={testimonial.avatar}
                  alt={testimonial.author}
                  className="w-12 h-12 rounded-full"
                />
                <div>
                  <div className="font-semibold text-gray-900">{testimonial.author}</div>
                  <div className="text-sm text-gray-600">{testimonial.role}</div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Trust Badges */}
      <div className="card-improved p-8 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="section-title text-center mb-6">Enterprise-Grade Security & Compliance</h3>
        <div className="grid md:grid-cols-3 gap-6">
          {trustBadges.map((badge, index) => {
            const Icon = badge.icon;
            return (
              <div key={index} className="flex items-start gap-4">
                <div className="icon-container-success flex-shrink-0">
                  <Icon className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h4 className="font-semibold text-gray-900 mb-1">{badge.text}</h4>
                  <p className="text-sm text-gray-600">{badge.description}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Money-Back Guarantee */}
      <div className="text-center p-8 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border-2 border-green-200">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-green-500 rounded-full mb-4">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h3 className="card-title text-gray-900 mb-2">14-Day Money-Back Guarantee</h3>
        <p className="body-text text-gray-700 max-w-2xl mx-auto">
          Not satisfied? Get a full refund within 14 days, no questions asked. 
          We're confident you'll love DataFlowHub AI.
        </p>
      </div>
    </div>
  );
};
