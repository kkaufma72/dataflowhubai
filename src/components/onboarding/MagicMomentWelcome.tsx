// Magic Moment Onboarding - Get users to "Aha!" in 60 seconds
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, TrendingUp, Users, DollarSign, Home, BarChart3, X, Zap } from 'lucide-react';
import { Dataset } from '../../types';
import { useMLContext } from '../../context/MLContext';
import { UserProfile } from '../../utils/personalizedPrompts';
import toast from 'react-hot-toast';

interface MagicMomentWelcomeProps {
  userProfile: UserProfile;
  onClose: () => void;
  onSampleLoaded?: () => void;
}

// Sample datasets optimized for quick "wow" moments
const SAMPLE_DATASETS = [
  {
    id: 'magic-sales-data',
    icon: <TrendingUp className="w-8 h-8" />,
    gradient: 'from-green-400 to-emerald-600',
    title: '📊 Sales Data',
    subtitle: 'E-commerce transactions',
    description: 'See revenue trends, top products, customer insights',
    datasetName: 'Sample_Sales_2024.csv',
    rows: 1000,
    columns: 12,
    preview: '1,000 sales transactions with customer data',
    useCases: ['sales-forecasting', 'business-analytics', 'retail', 'marketing-analytics'],
    magicQuestions: [
      "What are my top 5 products by revenue?",
      "Show me monthly sales trends",
      "Which customers are my biggest spenders?"
    ],
    dataset: {
      id: 'magic-sales-data',
      name: 'Sample Sales Data 2024',
      description: 'E-commerce sales transactions with product and customer information',
      rows: 1000,
      columns: 12,
      dateUploaded: new Date().toISOString(),
      fileType: 'csv',
      fileSize: '156 KB',
      projectId: '1',
      preview_data: {
        columns: ['order_id', 'date', 'customer_id', 'customer_name', 'product_category', 'product_name', 'quantity', 'unit_price', 'total_amount', 'payment_method', 'region', 'customer_segment'],
        rows: [
          ['ORD1001', '2024-01-15', 'CUST2847', 'Sarah Johnson', 'Electronics', 'Wireless Headphones', '2', '149.99', '299.98', 'Credit Card', 'West', 'Premium'],
          ['ORD1002', '2024-01-15', 'CUST1523', 'Mike Chen', 'Home & Garden', 'Coffee Maker', '1', '89.99', '89.99', 'PayPal', 'East', 'Standard'],
          ['ORD1003', '2024-01-16', 'CUST4821', 'Emily Davis', 'Electronics', 'Smart Watch', '1', '399.99', '399.99', 'Credit Card', 'South', 'VIP'],
          ['ORD1004', '2024-01-16', 'CUST3156', 'John Smith', 'Books', 'Data Science Guide', '3', '29.99', '89.97', 'Debit Card', 'North', 'Standard'],
          ['ORD1005', '2024-01-17', 'CUST2847', 'Sarah Johnson', 'Sports', 'Yoga Mat', '1', '45.00', '45.00', 'Credit Card', 'West', 'Premium'],
        ]
      }
    }
  },
  {
    id: 'magic-customer-data',
    icon: <Users className="w-8 h-8" />,
    gradient: 'from-blue-400 to-primary-600',
    title: '👥 Customer Data',
    subtitle: 'CRM database',
    description: 'Discover segments, create personas, find patterns',
    datasetName: 'Sample_Customers_2024.csv',
    rows: 500,
    columns: 10,
    preview: '500 customer profiles with demographics & behavior',
    useCases: ['customer-insights', 'marketing-analytics', 'sales-forecasting'],
    magicQuestions: [
      "Create 3 customer personas for targeted marketing",
      "Who are my most valuable customers?",
      "What patterns predict customer churn?"
    ],
    dataset: {
      id: 'magic-customer-data',
      name: 'Sample Customer Data 2024',
      description: 'Customer demographics, purchase history, and engagement data',
      rows: 500,
      columns: 10,
      dateUploaded: new Date().toISOString(),
      fileType: 'csv',
      fileSize: '82 KB',
      projectId: '1',
      preview_data: {
        columns: ['customer_id', 'name', 'email', 'age', 'city', 'signup_date', 'total_purchases', 'lifetime_value', 'last_purchase_date', 'segment'],
        rows: [
          ['CUST1234', 'John Doe', 'john@email.com', '35', 'San Francisco', '2023-06-15', '12', '1247.80', '2024-01-10', 'High-Value'],
          ['CUST5678', 'Jane Smith', 'jane@email.com', '28', 'New York', '2023-08-22', '24', '2156.40', '2024-01-12', 'VIP'],
          ['CUST9012', 'Bob Johnson', 'bob@email.com', '42', 'Chicago', '2023-05-10', '8', '542.30', '2023-12-20', 'Standard'],
          ['CUST3456', 'Alice Williams', 'alice@email.com', '31', 'Seattle', '2023-07-03', '18', '1834.20', '2024-01-14', 'High-Value'],
          ['CUST7890', 'Charlie Brown', 'charlie@email.com', '55', 'Boston', '2023-04-18', '5', '287.50', '2023-11-15', 'At-Risk'],
        ]
      }
    }
  },
  {
    id: 'magic-expense-data',
    icon: <DollarSign className="w-8 h-8" />,
    gradient: 'from-amber-400 to-orange-600',
    title: '💰 Expense Data',
    subtitle: 'Business expenses',
    description: 'Track spending, find savings, budget analysis',
    datasetName: 'Sample_Expenses_2024.csv',
    rows: 250,
    columns: 8,
    preview: '250 expense transactions for financial analysis',
    useCases: ['accounting', 'financial-management', 'budgeting', 'taxes'],
    magicQuestions: [
      "What are my top 5 expense categories?",
      "Show me monthly expense trends",
      "Where can I cut costs?"
    ],
    dataset: {
      id: 'magic-expense-data',
      name: 'Sample Business Expenses 2024',
      description: 'Monthly business expenses across all categories',
      rows: 250,
      columns: 8,
      dateUploaded: new Date().toISOString(),
      fileType: 'csv',
      fileSize: '45 KB',
      projectId: '1',
      preview_data: {
        columns: ['transaction_id', 'date', 'category', 'vendor', 'description', 'amount', 'payment_method', 'department'],
        rows: [
          ['TXN001', '2024-01-05', 'Payroll', 'ADP', 'January Salaries', '45230.00', 'ACH', 'HR'],
          ['TXN002', '2024-01-08', 'Rent', 'Property Management Co', 'Office Rent', '12000.00', 'Check', 'Operations'],
          ['TXN003', '2024-01-10', 'Software', 'Microsoft', 'Office 365 Subscription', '450.00', 'Credit Card', 'IT'],
          ['TXN004', '2024-01-12', 'Marketing', 'Google', 'Google Ads', '2500.00', 'Credit Card', 'Marketing'],
          ['TXN005', '2024-01-15', 'Travel', 'United Airlines', 'Client Meeting Flight', '680.00', 'Corporate Card', 'Sales'],
        ]
      }
    }
  },
  {
    id: 'magic-property-data',
    icon: <Home className="w-8 h-8" />,
    gradient: 'from-purple-400 to-pink-600',
    title: '🏠 Property Data',
    subtitle: 'Real estate listings',
    description: 'Analyze ROI, compare properties, market trends',
    datasetName: 'Sample_Properties_2024.csv',
    rows: 150,
    columns: 10,
    preview: '150 property listings with pricing and features',
    useCases: ['real-estate'],
    magicQuestions: [
      "Which properties have the best ROI?",
      "What's the average price per square foot?",
      "Show me rental income trends"
    ],
    dataset: {
      id: 'magic-property-data',
      name: 'Sample Real Estate Properties 2024',
      description: 'Property listings with prices, features, and rental data',
      rows: 150,
      columns: 10,
      dateUploaded: new Date().toISOString(),
      fileType: 'csv',
      fileSize: '68 KB',
      projectId: '1',
      preview_data: {
        columns: ['property_id', 'address', 'city', 'price', 'sqft', 'bedrooms', 'bathrooms', 'monthly_rent', 'year_built', 'property_type'],
        rows: [
          ['PROP001', '123 Oak Street', 'San Francisco', '850000', '1850', '3', '2', '3800', '2015', 'Condo'],
          ['PROP002', '456 Maple Ave', 'Seattle', '625000', '1600', '2', '2', '2900', '2018', 'Townhouse'],
          ['PROP003', '789 Pine Road', 'Portland', '480000', '1400', '2', '1.5', '2200', '2012', 'Condo'],
          ['PROP004', '321 Elm Court', 'Denver', '720000', '2100', '4', '3', '3200', '2020', 'Single Family'],
          ['PROP005', '654 Cedar Lane', 'Austin', '550000', '1750', '3', '2', '2650', '2017', 'Townhouse'],
        ]
      }
    }
  }
];

const MagicMomentWelcome: React.FC<MagicMomentWelcomeProps> = ({ userProfile, onClose, onSampleLoaded }) => {
  const { addDataset } = useMLContext();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedSample, setSelectedSample] = useState<string | null>(null);

  // Filter samples by user's use case for better relevance
  const relevantSamples = SAMPLE_DATASETS.filter(sample => 
    !userProfile.use_case || 
    sample.useCases.includes(userProfile.use_case) ||
    sample.id === 'magic-sales-data' // Always show sales as fallback
  );

  const displaySamples = relevantSamples.length > 0 ? relevantSamples : SAMPLE_DATASETS;

  const handleSampleClick = async (sample: typeof SAMPLE_DATASETS[0]) => {
    setSelectedSample(sample.id);
    setIsLoading(true);
    
    try {
      toast.loading('Loading sample data...', { id: 'magic-moment' });
      
      // Add dataset to context
      await addDataset(sample.dataset as Dataset);
      
      // Small delay for effect
      await new Promise(resolve => setTimeout(resolve, 800));
      
      toast.success('✨ Sample data loaded!', { id: 'magic-moment' });
      
      // Close modal
      onClose();
      
      // Navigate to insights page
      navigate('/app/insights');
      
      // Small delay then open AI chat with pre-populated question
      setTimeout(() => {
        if (onSampleLoaded) {
          onSampleLoaded();
        }
        
        // Show success message with next step
        toast.success(
          <div>
            <p className="font-semibold">🎉 Ready to explore!</p>
            <p className="text-sm">Click "Ask AI" to analyze this data</p>
          </div>,
          { duration: 5000 }
        );
      }, 1000);
      
    } catch (error) {
      console.error('Error loading sample:', error);
      toast.error('Failed to load sample data', { id: 'magic-moment' });
      setIsLoading(false);
      setSelectedSample(null);
    }
  };

  const handleSkip = () => {
    localStorage.setItem('hasSkippedMagicMoment', 'true');
    onClose();
    toast('Upload your own data anytime!', { icon: '👍' });
  };

  const firstName = userProfile.full_name?.split(' ')[0] || 'there';

  return (
    <div className="fixed inset-0 bg-gradient-to-br from-indigo-900/95 via-purple-900/95 to-pink-900/95 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
      <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-8 pb-6 bg-gradient-to-r from-primary-600 via-primary-600 to-pink-600 text-white">
          <button
            onClick={handleSkip}
            className="absolute top-4 right-4 text-white/80 hover:text-white transition-colors"
            aria-label="Skip"
          >
            <X className="w-6 h-6" />
          </button>
          
          <div className="text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 backdrop-blur rounded-2xl mb-4">
              <Sparkles className="w-10 h-10 text-white" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              Welcome{firstName && `, ${firstName}`}! 👋
            </h1>
            <p className="text-xl text-white/90">
              Let's see what DataFlowHub can do in <span className="font-bold text-yellow-300">60 seconds</span>
            </p>
          </div>
        </div>

        {/* Content */}
        <div className="p-8">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-semibold text-gray-900 mb-2">
              Choose a sample dataset to explore
            </h2>
            <p className="text-gray-600">
              We'll show you instant insights, AI analysis, and beautiful charts
            </p>
          </div>

          {/* Sample Dataset Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {displaySamples.map((sample) => (
              <button
                key={sample.id}
                onClick={() => handleSampleClick(sample)}
                disabled={isLoading}
                className={`group relative p-6 rounded-xl border-2 transition-all text-left ${
                  selectedSample === sample.id
                    ? 'border-indigo-600 bg-primary/5 shadow-lg scale-105'
                    : 'border-gray-200 hover:border-primary-400 hover:shadow-xl hover:scale-102'
                } ${isLoading && selectedSample !== sample.id ? 'opacity-50' : ''}`}
              >
                {/* Gradient accent */}
                <div className={`absolute top-0 left-0 right-0 h-1 rounded-t-xl bg-gradient-to-r ${sample.gradient}`} />
                
                {/* Icon */}
                <div className={`inline-flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br ${sample.gradient} text-white mb-4 group-hover:scale-110 transition-transform`}>
                  {sample.icon}
                </div>
                
                {/* Content */}
                <h3 className="text-lg font-bold text-gray-900 mb-1">
                  {sample.title}
                </h3>
                <p className="text-sm text-gray-600 mb-3">
                  {sample.subtitle}
                </p>
                <p className="text-sm text-gray-700 mb-4">
                  {sample.description}
                </p>
                
                {/* Preview info */}
                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                  <span className="flex items-center">
                    <BarChart3 className="w-3 h-3 mr-1" />
                    {sample.rows} rows
                  </span>
                  <span>•</span>
                  <span>{sample.columns} columns</span>
                </div>

                {/* What you'll see */}
                <div className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                  <p className="text-xs font-semibold text-gray-700 mb-2">✨ You'll instantly see:</p>
                  <ul className="text-xs text-gray-600 space-y-1">
                    {sample.magicQuestions.slice(0, 2).map((q, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="text-primary mr-1">→</span>
                        <span>{q}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Loading indicator */}
                {selectedSample === sample.id && isLoading && (
                  <div className="absolute inset-0 bg-white/90 backdrop-blur-sm rounded-xl flex items-center justify-center">
                    <div className="text-center">
                      <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-4 border-indigo-600 mb-2"></div>
                      <p className="text-sm font-semibold text-primary-600">Loading...</p>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          {/* What happens next */}
          <div className="bg-gradient-to-r from-primary/5 to-primary/5 rounded-xl p-6 mb-6 border border-primary/20">
            <h3 className="font-semibold text-gray-900 mb-4 flex items-center">
              <Zap className="w-5 h-5 text-primary-600 mr-2" />
              What happens in the next 60 seconds:
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                  1
                </div>
                <div>
                  <p className="font-medium text-gray-900">Data loads instantly</p>
                  <p className="text-sm text-gray-600">Sample dataset added to your workspace</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                  2
                </div>
                <div>
                  <p className="font-medium text-gray-900">See beautiful insights</p>
                  <p className="text-sm text-gray-600">Auto-generated charts and statistics</p>
                </div>
              </div>
              <div className="flex items-start">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold text-sm mr-3">
                  3
                </div>
                <div>
                  <p className="font-medium text-gray-900">Ask AI anything</p>
                  <p className="text-sm text-gray-600">Get personalized insights instantly</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA and skip */}
          <div className="flex items-center justify-between">
            <button
              onClick={handleSkip}
              className="text-gray-600 hover:text-gray-900 transition-colors font-medium"
            >
              Skip - I'll upload my own data
            </button>
            <p className="text-sm text-gray-500">
              Or upload your own data anytime →
            </p>
          </div>
        </div>

        {/* Footer tip */}
        <div className="bg-gray-50 px-8 py-4 border-t border-gray-200 rounded-b-2xl">
          <p className="text-sm text-gray-600 text-center">
            💡 <span className="font-medium">Pro tip:</span> Sample data is just for demo. You can upload your own CSV, Excel, or JSON files anytime!
          </p>
        </div>
      </div>
    </div>
  );
};

export default MagicMomentWelcome;

