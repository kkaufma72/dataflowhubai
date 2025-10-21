
import React from 'react';
import Pricing from '../components/Pricing';
import Header from '../components/common/Header';
import Footer from '../components/Footer';

const PricingPage: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-grow">
        <Pricing />
      </main>
      <Footer />
    </div>
  );
};

export default PricingPage;