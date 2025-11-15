import React from 'react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const CTA = () => {
  return (
    <section className="py-20 bg-primary-600 text-white">
      <div className="container-custom">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Ready to Transform Your Business with DataFlowHub AI?</h2>
          <p className="text-xl text-primary/10 mb-8 max-w-2xl mx-auto">
            Join thousands of companies using DataFlowHub AI to build better products, make smarter decisions, and drive business growth.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to="/signin" className="btn bg-white text-primary-600 hover:bg-gray-100">
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Link>
            <Link to="/signin" className="btn border border-white text-white hover:bg-primary-700">
              Schedule Demo
            </Link>
          </div>
          <p className="mt-8 text-primary/20">
            No credit card required. 14-day free trial.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CTA;