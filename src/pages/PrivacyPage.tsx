import React from 'react';
import { Shield, Lock, Eye, FileText, AlertCircle, CheckCircle } from 'lucide-react';

const PrivacyPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Shield className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-2">Privacy Policy</h1>
              <p className="text-xl text-blue-100">
                How we collect, use, and protect your data
              </p>
              <p className="text-sm text-blue-200 mt-2">
                Last updated: November 24, 2025
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-16">
        {/* Quick Summary */}
        <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 mb-12">
          <h2 className="text-2xl font-bold text-blue-900 mb-4">Privacy in Plain English</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-900">
                <strong>Your data is yours.</strong> We never sell it to third parties or use it to train our models.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-900">
                <strong>Bank-grade encryption.</strong> All data encrypted at rest (AES-256) and in transit (TLS 1.3).
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-900">
                <strong>You're in control.</strong> Export or delete your data anytime, no questions asked.
              </p>
            </div>
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
              <p className="text-blue-900">
                <strong>GDPR & CCPA compliant.</strong> We respect your privacy rights under all major regulations.
              </p>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="bg-white rounded-xl border-2 border-gray-200 overflow-hidden">
          {/* Table of Contents */}
          <div className="bg-gray-50 border-b-2 border-gray-200 p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">Table of Contents</h3>
            <ul className="space-y-2 text-sm">
              {[
                '1. Information We Collect',
                '2. How We Use Your Information',
                '3. Data Storage & Security',
                '4. Data Sharing & Third Parties',
                '5. Your Privacy Rights',
                '6. Cookies & Tracking',
                '7. Data Retention',
                '8. International Transfers',
                '9. Children\'s Privacy',
                '10. Changes to This Policy',
                '11. Contact Us'
              ].map((item, idx) => (
                <li key={idx}>
                  <a href={`#section-${idx + 1}`} className="text-blue-600 hover:text-blue-700 hover:underline">
                    {item}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Sections */}
          <div className="p-8 space-y-12">
            {/* Section 1 */}
            <section id="section-1">
              <div className="flex items-center gap-3 mb-4">
                <Eye className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">1. Information We Collect</h2>
              </div>
              
              <h3 className="text-lg font-bold text-gray-900 mb-3">Information you provide to us:</h3>
              <ul className="space-y-2 mb-6 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Account information:</strong> Name, email address, password (encrypted)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Payment information:</strong> Processed securely by Stripe (we don't store credit card numbers)</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Datasets you upload:</strong> Your data files, model configurations, and analysis results</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Support communications:</strong> Messages you send to our support team</span>
                </li>
              </ul>

              <h3 className="text-lg font-bold text-gray-900 mb-3">Information we collect automatically:</h3>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Usage data:</strong> Features you use, models you train, pages you visit</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Device information:</strong> Browser type, IP address, operating system</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Cookies:</strong> Session tokens, preferences (see Cookies section)</span>
                </li>
              </ul>
            </section>

            {/* Section 2 */}
            <section id="section-2">
              <div className="flex items-center gap-3 mb-4">
                <FileText className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">2. How We Use Your Information</h2>
              </div>
              
              <div className="space-y-4 text-gray-700">
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Provide our service:</strong> Process your datasets, train models, generate predictions
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Improve our platform:</strong> Analyze usage patterns to enhance features and performance
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Customer support:</strong> Respond to your questions and troubleshoot issues
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Security:</strong> Detect fraud, abuse, and security threats
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <strong className="text-gray-900">Communications:</strong> Send product updates, security alerts (you can opt out of marketing)
                  </div>
                </div>
              </div>

              <div className="mt-6 bg-red-50 border-2 border-red-200 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <div className="text-red-900">
                    <strong>What we DON'T do:</strong> We never sell your data to third parties, use your datasets to train our AI models, or share your data with advertisers.
                  </div>
                </div>
              </div>
            </section>

            {/* Section 3 */}
            <section id="section-3">
              <div className="flex items-center gap-3 mb-4">
                <Lock className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">3. Data Storage & Security</h2>
              </div>
              
              <div className="space-y-4 text-gray-700">
                <p>We implement industry-standard security measures to protect your data:</p>
                
                <div className="grid md:grid-cols-2 gap-4">
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">Encryption</h4>
                    <ul className="text-sm space-y-1">
                      <li>• AES-256 encryption at rest</li>
                      <li>• TLS 1.3 for data in transit</li>
                      <li>• Encrypted database backups</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">Access Control</h4>
                    <ul className="text-sm space-y-1">
                      <li>• Row-Level Security (RLS)</li>
                      <li>• OAuth 2.0 authentication</li>
                      <li>• Multi-factor authentication</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">Infrastructure</h4>
                    <ul className="text-sm space-y-1">
                      <li>• SOC 2 Type II (in progress)</li>
                      <li>• Multi-region redundancy</li>
                      <li>• DDoS protection</li>
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                    <h4 className="font-bold text-gray-900 mb-2">Monitoring</h4>
                    <ul className="text-sm space-y-1">
                      <li>• 24/7 security monitoring</li>
                      <li>• Intrusion detection</li>
                      <li>• Regular security audits</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Section 4 */}
            <section id="section-4">
              <div className="flex items-center gap-3 mb-4">
                <Shield className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">4. Data Sharing & Third Parties</h2>
              </div>
              
              <p className="text-gray-700 mb-4">We only share your data in these limited circumstances:</p>
              
              <div className="space-y-4">
                <div className="border-l-4 border-blue-600 pl-4">
                  <h4 className="font-bold text-gray-900 mb-1">Service Providers</h4>
                  <p className="text-gray-700 text-sm mb-2">
                    We use trusted third-party services that help us operate our platform:
                  </p>
                  <ul className="text-sm text-gray-600 space-y-1">
                    <li>• <strong>Supabase:</strong> Database hosting and authentication</li>
                    <li>• <strong>Stripe:</strong> Payment processing (PCI DSS compliant)</li>
                    <li>• <strong>OpenAI:</strong> AI model inference (data not used for training)</li>
                    <li>• <strong>Vercel:</strong> Application hosting</li>
                  </ul>
                  <p className="text-xs text-gray-500 mt-2">
                    All service providers are bound by strict data protection agreements.
                  </p>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <h4 className="font-bold text-gray-900 mb-1">Legal Requirements</h4>
                  <p className="text-gray-700 text-sm">
                    We may disclose your data if required by law, court order, or government request.
                  </p>
                </div>

                <div className="border-l-4 border-blue-600 pl-4">
                  <h4 className="font-bold text-gray-900 mb-1">Business Transfers</h4>
                  <p className="text-gray-700 text-sm">
                    If we're acquired or merge with another company, your data may be transferred (you'll be notified).
                  </p>
                </div>
              </div>
            </section>

            {/* Section 5 */}
            <section id="section-5">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-blue-600" />
                <h2 className="text-2xl font-bold text-gray-900">5. Your Privacy Rights</h2>
              </div>
              
              <p className="text-gray-700 mb-4">You have the following rights regarding your data:</p>
              
              <div className="grid md:grid-cols-2 gap-4">
                {[
                  {
                    title: 'Access',
                    description: 'Request a copy of all data we have about you'
                  },
                  {
                    title: 'Correction',
                    description: 'Update or correct inaccurate information'
                  },
                  {
                    title: 'Deletion',
                    description: 'Request permanent deletion of your account and data'
                  },
                  {
                    title: 'Export',
                    description: 'Download your datasets and models in portable format'
                  },
                  {
                    title: 'Opt-Out',
                    description: 'Unsubscribe from marketing emails anytime'
                  },
                  {
                    title: 'Object',
                    description: 'Object to processing for specific purposes'
                  }
                ].map((right, idx) => (
                  <div key={idx} className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <h4 className="font-bold text-green-900 mb-1">{right.title}</h4>
                    <p className="text-sm text-green-700">{right.description}</p>
                  </div>
                ))}
              </div>

              <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                <p className="text-blue-900">
                  <strong>To exercise your rights:</strong> Email{' '}
                  <a href="mailto:privacy@dataflowhub.ai" className="underline font-bold">
                    privacy@dataflowhub.ai
                  </a>
                  {' '}or manage settings in your account dashboard.
                </p>
              </div>
            </section>

            {/* Section 6 */}
            <section id="section-6">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">6. Cookies & Tracking</h2>
              <p className="text-gray-700 mb-4">
                We use cookies to improve your experience. You can control cookie preferences in your browser settings.
              </p>
              <div className="space-y-3 text-sm text-gray-700">
                <div>
                  <strong>Essential cookies:</strong> Required for authentication and basic functionality (cannot be disabled)
                </div>
                <div>
                  <strong>Analytics cookies:</strong> Help us understand how you use our platform (Google Analytics)
                </div>
                <div>
                  <strong>Preference cookies:</strong> Remember your settings and choices
                </div>
              </div>
            </section>

            {/* Section 7 */}
            <section id="section-7">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">7. Data Retention</h2>
              <ul className="space-y-2 text-gray-700">
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Active accounts:</strong> Data retained as long as your account is active</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Deleted accounts:</strong> Soft deleted immediately, permanently deleted within 30 days</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Backups:</strong> Purged from backups within 90 days of deletion</span>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-blue-600 font-bold">•</span>
                  <span><strong>Legal holds:</strong> We may retain data longer if required by law</span>
                </li>
              </ul>
            </section>

            {/* Section 8 */}
            <section id="section-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">8. International Transfers</h2>
              <p className="text-gray-700">
                Your data may be processed in the United States and other countries where our service providers operate. 
                We use Standard Contractual Clauses (SCCs) approved by the European Commission to protect data transferred 
                outside the EU/EEA.
              </p>
            </section>

            {/* Section 9 */}
            <section id="section-9">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">9. Children's Privacy</h2>
              <p className="text-gray-700">
                DataFlowHub AI is not intended for users under 18. We don't knowingly collect information from children. 
                If you believe a child has provided us with personal data, please contact us immediately.
              </p>
            </section>

            {/* Section 10 */}
            <section id="section-10">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">10. Changes to This Policy</h2>
              <p className="text-gray-700">
                We may update this Privacy Policy from time to time. We'll notify you of material changes via email or 
                prominent notice in our application. Continued use of our service after changes constitutes acceptance.
              </p>
            </section>

            {/* Section 11 */}
            <section id="section-11">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">11. Contact Us</h2>
              <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
                <p className="text-gray-700 mb-4">
                  If you have questions about this Privacy Policy or how we handle your data:
                </p>
                <div className="space-y-2 text-gray-700">
                  <p>
                    <strong>Email:</strong>{' '}
                    <a href="mailto:privacy@dataflowhub.ai" className="text-blue-600 hover:underline">
                      privacy@dataflowhub.ai
                    </a>
                  </p>
                  <p>
                    <strong>Data Protection Officer:</strong>{' '}
                    <a href="mailto:dpo@dataflowhub.ai" className="text-blue-600 hover:underline">
                      dpo@dataflowhub.ai
                    </a>
                  </p>
                  <p>
                    <strong>Mailing Address:</strong><br />
                    DataFlowHub AI, Inc.<br />
                    Privacy Team<br />
                    [Your Address]<br />
                    [City, State ZIP]
                  </p>
                </div>
              </div>
            </section>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-12 text-center">
          <p className="text-gray-600 mb-4">Questions about how we protect your data?</p>
          <a
            href="/security"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 transition-colors"
          >
            <Shield className="w-5 h-5" />
            View Security Details
          </a>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPage;
