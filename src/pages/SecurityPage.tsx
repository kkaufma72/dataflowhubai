import React from 'react';
import { Shield, Lock, Eye, Server, CheckCircle, FileText, AlertTriangle, Users } from 'lucide-react';
import { TrustBadges } from '../components/common/TrustBadges';

const SecurityPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-6 py-16">
          <div className="flex items-center gap-4 mb-4">
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <Shield className="w-12 h-12" />
            </div>
            <div>
              <h1 className="text-5xl font-bold mb-2">Security & Compliance</h1>
              <p className="text-xl text-indigo-100">
                Enterprise-grade security protecting your data and models
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-16 space-y-16">
        {/* Trust Badges */}
        <section>
          <TrustBadges variant="landing" />
        </section>

        {/* Security Overview */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-8">Security First, Always</h2>
          <div className="grid md:grid-cols-2 gap-8">
            {[
              {
                icon: Lock,
                title: 'Data Encryption',
                description: 'All data encrypted at rest (AES-256) and in transit (TLS 1.3). Your datasets, models, and API keys are protected with bank-grade encryption.',
                details: [
                  'AES-256 encryption at rest',
                  'TLS 1.3 for all connections',
                  'Encrypted database backups',
                  'Secure key management (HSM)'
                ]
              },
              {
                icon: Server,
                title: 'Infrastructure Security',
                description: 'Built on enterprise cloud infrastructure with 99.9% uptime SLA, automated backups, and disaster recovery.',
                details: [
                  'Multi-region redundancy',
                  'Automated daily backups',
                  'DDoS protection',
                  'Intrusion detection (IDS)'
                ]
              },
              {
                icon: Users,
                title: 'Access Control',
                description: 'Row-Level Security (RLS) ensures users only access their own data. OAuth, SSO, and MFA support for enterprise authentication.',
                details: [
                  'Row-Level Security (RLS)',
                  'OAuth 2.0 (Google, GitHub)',
                  'SSO ready (SAML 2.0)',
                  'Multi-Factor Authentication'
                ]
              },
              {
                icon: Eye,
                title: 'Privacy & Compliance',
                description: 'GDPR and CCPA compliant. Your data is never used to train our models or shared with third parties.',
                details: [
                  'GDPR compliant',
                  'CCPA compliant',
                  'No data sharing',
                  'Right to deletion'
                ]
              }
            ].map((item, idx) => (
              <div key={idx} className="bg-white rounded-xl border-2 border-gray-200 p-8 hover:shadow-xl transition-shadow">
                <div className="flex items-start gap-4 mb-4">
                  <div className="p-3 bg-indigo-100 rounded-lg">
                    <item.icon className="w-8 h-8 text-indigo-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-2">{item.title}</h3>
                    <p className="text-gray-600 leading-relaxed mb-4">
                      {item.description}
                    </p>
                    <ul className="space-y-2">
                      {item.details.map((detail, i) => (
                        <li key={i} className="flex items-center gap-2 text-gray-700">
                          <CheckCircle className="w-4 h-4 text-green-600 flex-shrink-0" />
                          <span className="text-sm font-medium">{detail}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Compliance Status */}
        <section className="bg-white rounded-xl border-2 border-gray-200 p-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Compliance & Certifications</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {/* In Progress */}
            <div className="border-2 border-amber-200 bg-amber-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-amber-600" />
                <h3 className="text-xl font-bold text-amber-900">In Progress</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5 rounded-full border-2 border-amber-500 flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-bold text-amber-900">SOC 2 Type II Audit</p>
                    <p className="text-sm text-amber-700">Expected completion: Q2 2025</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-5 h-5 mt-0.5 rounded-full border-2 border-amber-500 flex items-center justify-center flex-shrink-0">
                    <div className="w-2.5 h-2.5 bg-amber-500 rounded-full"></div>
                  </div>
                  <div>
                    <p className="font-bold text-amber-900">ISO 27001 Certification</p>
                    <p className="text-sm text-amber-700">Planned for 2025</p>
                  </div>
                </li>
              </ul>
            </div>

            {/* Completed */}
            <div className="border-2 border-green-200 bg-green-50 rounded-lg p-6">
              <div className="flex items-center gap-3 mb-4">
                <CheckCircle className="w-6 h-6 text-green-600" />
                <h3 className="text-xl font-bold text-green-900">Completed</h3>
              </div>
              <ul className="space-y-3">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-900">GDPR Compliance</p>
                    <p className="text-sm text-green-700">Privacy by design, right to deletion</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-900">CCPA Compliance</p>
                    <p className="text-sm text-green-700">California privacy rights protected</p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-bold text-green-900">Penetration Testing</p>
                    <p className="text-sm text-green-700">Annual third-party security audits</p>
                  </div>
                </li>
              </ul>
            </div>
          </div>
        </section>

        {/* Data Handling */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">How We Handle Your Data</h2>
          
          <div className="bg-white rounded-xl border-2 border-gray-200 p-8">
            <div className="grid md:grid-cols-3 gap-8">
              {[
                {
                  title: 'Data Storage',
                  items: [
                    'All data stored in secure PostgreSQL databases',
                    'Encrypted at rest with AES-256',
                    'Automated backups every 6 hours',
                    'Multi-region replication for disaster recovery'
                  ]
                },
                {
                  title: 'Data Access',
                  items: [
                    'Row-Level Security ensures data isolation',
                    'All API calls authenticated and logged',
                    'Zero-trust architecture',
                    'Audit logs retained for 90 days'
                  ]
                },
                {
                  title: 'Data Deletion',
                  items: [
                    'Immediate soft delete on user request',
                    'Permanent deletion within 30 days',
                    'Backup purging within 90 days',
                    'Deletion confirmation provided'
                  ]
                }
              ].map((section, idx) => (
                <div key={idx}>
                  <h3 className="text-xl font-bold text-gray-900 mb-4">{section.title}</h3>
                  <ul className="space-y-3">
                    {section.items.map((item, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-700">
                        <CheckCircle className="w-4 h-4 text-indigo-600 flex-shrink-0 mt-0.5" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Vulnerability Reporting */}
        <section className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-8 text-white">
          <div className="flex items-start gap-6">
            <div className="p-4 bg-white/10 rounded-xl backdrop-blur-sm">
              <FileText className="w-10 h-10" />
            </div>
            <div>
              <h2 className="text-3xl font-bold mb-3">Responsible Disclosure</h2>
              <p className="text-xl text-indigo-100 mb-6">
                Found a security vulnerability? We appreciate responsible disclosure and will respond within 48 hours.
              </p>
              <div className="space-y-2">
                <p className="text-indigo-100">
                  <strong>Email:</strong> <a href="mailto:security@dataflowhub.ai" className="underline hover:text-white">security@dataflowhub.ai</a>
                </p>
                <p className="text-indigo-100">
                  <strong>PGP Key:</strong> Available upon request
                </p>
                <p className="text-indigo-100">
                  <strong>Response Time:</strong> Within 48 hours
                </p>
                <p className="text-indigo-100">
                  <strong>Bug Bounty:</strong> $100-$5,000 depending on severity
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Documentation Links */}
        <section>
          <h2 className="text-3xl font-bold text-gray-900 mb-6">Security Documentation</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { title: 'Privacy Policy', href: '/privacy' },
              { title: 'Terms of Service', href: '/terms' },
              { title: 'Data Processing Agreement', href: '/dpa' },
              { title: 'Security Whitepaper', href: '/security-whitepaper.pdf' }
            ].map((doc, idx) => (
              <a
                key={idx}
                href={doc.href}
                className="flex items-center gap-3 p-4 bg-white border-2 border-gray-200 rounded-lg hover:border-indigo-400 hover:shadow-md transition-all group"
              >
                <FileText className="w-5 h-5 text-gray-400 group-hover:text-indigo-600 transition-colors" />
                <span className="font-medium text-gray-900 group-hover:text-indigo-600 transition-colors">
                  {doc.title}
                </span>
              </a>
            ))}
          </div>
        </section>

        {/* Contact CTA */}
        <section className="bg-white rounded-xl border-2 border-gray-200 p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            Questions About Security?
          </h2>
          <p className="text-lg text-gray-600 mb-6 max-w-2xl mx-auto">
            Our security team is happy to discuss our practices, answer questions, or schedule a security review call.
          </p>
          <div className="flex gap-4 justify-center">
            <a
              href="mailto:security@dataflowhub.ai"
              className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 transition-colors"
            >
              Contact Security Team
            </a>
            <a
              href="/documentation"
              className="px-6 py-3 border-2 border-gray-300 text-gray-900 font-bold rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              Read Documentation
            </a>
          </div>
        </section>
      </div>
    </div>
  );
};

export default SecurityPage;
