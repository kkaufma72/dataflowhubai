import React from 'react';
import { Outlet } from 'react-router-dom';
import LandingNav from '../LandingNav';
import Footer from '../Footer';

const LandingLayout: React.FC = () => {
  return (
    <div className="min-h-screen flex flex-col">
      <LandingNav />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default LandingLayout;