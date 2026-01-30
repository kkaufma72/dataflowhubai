import React from 'react';
import LandingNav from '../components/LandingNav';
import Footer from '../components/Footer';
import FREDLandingDemo from '../components/landing/FREDLandingDemo';
import { Database, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const FREDDemoPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 text-white">
      <LandingNav />

      <section className="relative px-6 pt-16 pb-10">
        <div className="max-w-6xl mx-auto text-center space-y-4">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 border border-white/10 text-sm text-cyan-200">
            <Database className="w-4 h-4" />
            FRED live demo — no signup required
          </div>
          <h1 className="text-4xl md:text-5xl font-bold">Bring Federal Reserve data to life</h1>
          <p className="text-lg text-gray-200 max-w-3xl mx-auto">
            Import a free FRED dataset, ask three AI questions, and see charts appear instantly.
            No account needed.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <Link
              to="/"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-white/10 border border-white/10 text-white text-sm font-semibold hover:bg-white/15 transition"
            >
              Back to landing
            </Link>
            <Link
              to="/pricing"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 text-white text-sm font-semibold shadow-lg shadow-blue-500/30 hover:from-blue-700 hover:to-purple-700 transition"
            >
              See plans
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </section>

      <section className="px-6 pb-16">
        <div className="max-w-6xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-6 md:p-10 shadow-2xl">
          <FREDLandingDemo />
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default FREDDemoPage;
