import React from 'react';
import { BarChart2, FileText, Zap, Users, Clock, Database } from 'lucide-react';
import { Link } from 'react-router-dom';

const UseCases = () => {
  const useCases = [
    {
      icon: <BarChart2 className="h-6 w-6" />,
      title: 'Customer Churn Prediction',
      description: 'Identify customers at risk of leaving and take proactive measures to retain them.',
      color: 'bg-blue-100 text-blue-600'
    },
    {
      icon: <FileText className="h-6 w-6" />,
      title: 'Fraud Detection',
      description: 'Identify suspicious transactions and activities in real-time to prevent fraud.',
      color: 'bg-green-100 text-green-600'
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: 'Demand Forecasting',
      description: 'Predict future demand for products and services to optimize inventory and staffing.',
      color: 'bg-purple-100 text-purple-600'
    },
    {
      icon: <Users className="h-6 w-6" />,
      title: 'Customer Segmentation',
      description: 'Group customers based on behavior and characteristics for targeted marketing.',
      color: 'bg-amber-100 text-amber-600'
    },
    {
      icon: <Clock className="h-6 w-6" />,
      title: 'Predictive Maintenance',
      description: 'Predict equipment failures before they happen to reduce downtime and maintenance costs.',
      color: 'bg-red-100 text-red-600'
    },
    {
      icon: <Database className="h-6 w-6" />,
      title: 'Recommendation Systems',
      description: 'Personalize user experiences with tailored product and content recommendations.',
      color: 'bg-indigo-100 text-indigo-600'
    }
  ];

  return (
    <section className="section-padding bg-gray-50" id="use-cases">
      <div className="container-custom">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">Machine Learning Use Cases</h2>
          <p className="text-lg text-gray-600">
            Our platform enables a wide range of machine learning applications across industries.
            Here are some common use cases our customers implement.
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
          {useCases.map((useCase, index) => (
            <div 
              key={index} 
              className="card p-6 hover:translate-y-[-5px] transition-all duration-300"
            >
              <div className={`w-12 h-12 rounded-lg ${useCase.color} flex items-center justify-center mb-4`}>
                {useCase.icon}
              </div>
              <h3 className="text-xl font-semibold mb-3">{useCase.title}</h3>
              <p className="text-gray-600">{useCase.description}</p>
            </div>
          ))}
        </div>
        
        <div className="mt-16 bg-indigo-600 rounded-xl p-8 text-white">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div>
              <h3 className="text-2xl md:text-3xl font-bold mb-4">Real-World Success Stories</h3>
              <p className="mb-6">
                Companies using our AutoML platform have achieved remarkable results across various industries.
                From reducing customer churn to optimizing supply chains, our platform delivers measurable ROI.
              </p>
              <div className="flex flex-wrap gap-4">
                <div className="bg-white bg-opacity-20 rounded-lg p-4 flex-1">
                  <div className="text-3xl font-bold">85%</div>
                  <div className="text-sm">Prediction Accuracy</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 flex-1">
                  <div className="text-3xl font-bold">73%</div>
                  <div className="text-sm">Time Saved</div>
                </div>
                <div className="bg-white bg-opacity-20 rounded-lg p-4 flex-1">
                  <div className="text-3xl font-bold">3.2x</div>
                  <div className="text-sm">ROI</div>
                </div>
              </div>
            </div>
            <div className="hidden md:block">
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-indigo-600 to-transparent"></div>
                <img 
                  src="https://images.pexels.com/photos/7947541/pexels-photo-7947541.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2" 
                  alt="Data visualization" 
                  className="rounded-lg w-full h-64 object-cover"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default UseCases;