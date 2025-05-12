import React from 'react';
import { Twitter, Linkedin, Facebook, Instagram, Mail, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white pt-16 pb-8 dark:bg-gray-950">
      <div className="container-custom">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 mb-12">
          <div className="lg:col-span-2">
            <div className="flex items-center mb-6">
              <div className="w-10 h-10 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-xl mr-2">D</div>
              <span className="text-xl font-bold">DataFlowHub AI</span>
            </div>
            <p className="text-gray-400 mb-6 max-w-md">
              DataFlowHub AI is the leading platform for automated machine learning, helping businesses of all sizes harness the power of AI without specialized expertise.
            </p>
            <div className="flex space-x-4">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Twitter className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Linkedin className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Facebook className="h-5 w-5" />
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <Instagram className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Product</h4>
            <ul className="space-y-3">
              <li><Link to="/#features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
              <li><Link to="/#pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
              <li><Link to="/#use-cases" className="text-gray-400 hover:text-white transition-colors">Case Studies</Link></li>
              <li><Link to="/documentation" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
              <li><Link to="/api-reference" className="text-gray-400 hover:text-white transition-colors">API Reference</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Company</h4>
            <ul className="space-y-3">
              <li><Link to="/documentation" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
              <li><Link to="/documentation" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
              <li><Link to="/documentation" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
              <li><Link to="/documentation" className="text-gray-400 hover:text-white transition-colors">Press</Link></li>
              <li><Link to="/documentation" className="text-gray-400 hover:text-white transition-colors">Partners</Link></li>
            </ul>
          </div>
          
          <div>
            <h4 className="text-lg font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center">
                <Mail className="h-5 w-5 mr-2 text-gray-400" />
                <a href="mailto:info@automl.com" className="text-gray-400 hover:text-white transition-colors">
                  info@automl.com
                </a>
              </li>
              <li className="flex items-center">
                <Phone className="h-5 w-5 mr-2 text-gray-400" />
                <a href="tel:+17349455898" className="text-gray-400 hover:text-white transition-colors">
                  +1 (734) 945-5898
                </a>
              </li>
            </ul>
            <div className="mt-6">
              <h4 className="text-lg font-semibold mb-4">Subscribe to our newsletter</h4>
              <form className="flex">
                <input 
                  type="email" 
                  placeholder="Your email" 
                  className="px-4 py-2 rounded-l-lg bg-gray-800 text-white border-0 focus:outline-none focus:ring-2 focus:ring-indigo-500 flex-grow dark:bg-gray-700"
                />
                <button 
                  type="submit" 
                  className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-r-lg transition-colors dark:bg-indigo-700 dark:hover:bg-indigo-600"
                >
                  Subscribe
                </button>
              </form>
            </div>
          </div>
        </div>
        
        <div className="pt-8 border-t border-gray-800 text-center md:flex md:justify-between md:text-left">
          <p className="text-gray-500 mb-4 md:mb-0">
            &copy; {new Date().getFullYear()} AutoML. All rights reserved.
          </p>
          <div className="flex space-x-6 justify-center md:justify-end">
            <Link to="/documentation" className="text-gray-500 hover:text-white transition-colors">Terms</Link>
            <Link to="/documentation" className="text-gray-500 hover:text-white transition-colors">Privacy</Link>
            <Link to="/documentation" className="text-gray-500 hover:text-white transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;