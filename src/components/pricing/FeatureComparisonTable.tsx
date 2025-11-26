import React, { useState } from 'react';
import { Check, X, HelpCircle, Crown, Sparkles } from 'lucide-react';

interface FeatureRow {
  category: string;
  features: {
    name: string;
    tooltip: string;
    isNew?: boolean;
    isPro?: boolean;
    free: boolean | string;
    starter: boolean | string;
    professional: boolean | string;
    enterprise: boolean | string;
  }[];
}

const featureData: FeatureRow[] = [
  {
    category: "Data Management",
    features: [
      {
        name: "Datasets",
        tooltip: "Maximum number of datasets you can store",
        free: "5 datasets",
        starter: "15 datasets",
        professional: "100 datasets",
        enterprise: "Unlimited"
      },
      {
        name: "File Upload Size",
        tooltip: "Maximum size per file upload",
        free: "10 MB",
        starter: "100 MB",
        professional: "1 GB",
        enterprise: "Unlimited"
      },
      {
        name: "Data Quality Scores",
        tooltip: "Instant 0-100 health score for your data",
        free: true,
        starter: true,
        professional: true,
        enterprise: true
      },
      {
        name: "Auto Data Dictionary",
        tooltip: "Automatically generated column definitions",
        free: true,
        starter: true,
        professional: true,
        enterprise: true
      },
      {
        name: "FRED Economic Data",
        tooltip: "Import Federal Reserve economic datasets",
        free: "5/month",
        starter: "25/month",
        professional: "Unlimited",
        enterprise: "Unlimited"
      }
    ]
  },
  {
    category: "AI & Analytics",
    features: [
      {
        name: "AI Chat Questions",
        tooltip: "Ask your AI assistant about your data",
        free: "10/day",
        starter: "50/day",
        professional: "500/day",
        enterprise: "Unlimited"
      },
      {
        name: "Rich Model Narratives",
        tooltip: "Comprehensive AI-powered model explanations with reasoning",
        isNew: true,
        isPro: true,
        free: "3/month",
        starter: "20/month",
        professional: "Unlimited",
        enterprise: "Unlimited"
      },
      {
        name: "Knowledge Base",
        tooltip: "Add business context, notes, and stories to datasets",
        isNew: true,
        isPro: true,
        free: false,
        starter: "10 entries",
        professional: "Unlimited",
        enterprise: "Unlimited"
      },
      {
        name: "Semantic Search",
        tooltip: "Find relevant insights using natural language",
        isNew: true,
        isPro: true,
        free: false,
        starter: true,
        professional: true,
        enterprise: true
      },
      {
        name: "Smart Recommendations",
        tooltip: "AI-powered suggestions for model training",
        isNew: true,
        isPro: true,
        free: false,
        starter: true,
        professional: true,
        enterprise: true
      }
    ]
  },
  {
    category: "Machine Learning",
    features: [
      {
        name: "ML Models",
        tooltip: "Train custom machine learning models",
        free: "2 models",
        starter: "5 models",
        professional: "50 models",
        enterprise: "Unlimited"
      },
      {
        name: "Basic Algorithms",
        tooltip: "Linear/Logistic regression, Decision trees",
        free: true,
        starter: true,
        professional: true,
        enterprise: true
      },
      {
        name: "Advanced Algorithms",
        tooltip: "Random Forest, XGBoost, Neural Networks",
        free: false,
        starter: true,
        professional: true,
        enterprise: true
      },
      {
        name: "Auto ML",
        tooltip: "Automatically find the best model",
        free: false,
        starter: false,
        professional: true,
        enterprise: true
      },
      {
        name: "Model Deployment",
        tooltip: "Deploy models to production with API endpoints",
        isPro: true,
        free: false,
        starter: false,
        professional: true,
        enterprise: true
      },
      {
        name: "Real-time Monitoring",
        tooltip: "Monitor model performance in production",
        isPro: true,
        free: false,
        starter: false,
        professional: true,
        enterprise: true
      }
    ]
  },
  {
    category: "Visualizations",
    features: [
      {
        name: "Basic Charts",
        tooltip: "Line, bar, pie, scatter plots",
        free: true,
        starter: true,
        professional: true,
        enterprise: true
      },
      {
        name: "Advanced Charts",
        tooltip: "Heatmaps, network diagrams, forecasts",
        free: false,
        starter: true,
        professional: true,
        enterprise: true
      },
      {
        name: "Custom Dashboards",
        tooltip: "Create personalized dashboards",
        free: false,
        starter: false,
        professional: true,
        enterprise: true
      },
      {
        name: "Export & Sharing",
        tooltip: "Export charts as PNG, PDF, CSV",
        free: "PNG only",
        starter: true,
        professional: true,
        enterprise: true
      }
    ]
  },
  {
    category: "Collaboration & Security",
    features: [
      {
        name: "Team Members",
        tooltip: "Number of users on your account",
        free: "1 user",
        starter: "1 user",
        professional: "5 users",
        enterprise: "Unlimited"
      },
      {
        name: "Share Reports",
        tooltip: "Share insights with team members",
        free: false,
        starter: false,
        professional: true,
        enterprise: true
      },
      {
        name: "Role-Based Access",
        tooltip: "Control who sees what data",
        free: false,
        starter: false,
        professional: false,
        enterprise: true
      },
      {
        name: "SSO / SAML",
        tooltip: "Single Sign-On with your company account",
        free: false,
        starter: false,
        professional: false,
        enterprise: true
      },
      {
        name: "API Access",
        tooltip: "Programmatic access to your data and models",
        free: false,
        starter: false,
        professional: true,
        enterprise: true
      }
    ]
  },
  {
    category: "Support",
    features: [
      {
        name: "Documentation",
        tooltip: "Access to guides and tutorials",
        free: true,
        starter: true,
        professional: true,
        enterprise: true
      },
      {
        name: "Email Support",
        tooltip: "Get help via email",
        free: "Community",
        starter: "48h response",
        professional: "24h response",
        enterprise: "4h response"
      },
      {
        name: "Live Chat",
        tooltip: "Chat with our support team",
        free: false,
        starter: false,
        professional: true,
        enterprise: true
      },
      {
        name: "Dedicated Account Manager",
        tooltip: "Personal point of contact",
        free: false,
        starter: false,
        professional: false,
        enterprise: true
      }
    ]
  }
];

export const FeatureComparisonTable: React.FC = () => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const renderCell = (value: boolean | string, isPro?: boolean) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-300 mx-auto" />
      );
    }
    return <span className="text-sm text-gray-700">{value}</span>;
  };

  return (
    <div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 bg-gradient-to-r from-gray-50 to-white">
        <h3 className="text-2xl font-bold text-gray-900">Compare Plans in Detail</h3>
        <p className="text-gray-600 mt-1">See exactly what's included in each tier</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left min-w-[200px]">
                <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Feature</span>
              </th>
              <th className="px-4 py-4 text-center min-w-[120px]">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold text-gray-700">Free</span>
                  <div className="text-2xl font-bold text-gray-900 mt-1">$0</div>
                  <span className="text-xs text-gray-500">forever</span>
                </div>
              </th>
              <th className="px-4 py-4 text-center min-w-[120px]">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold text-gray-700">Starter</span>
                  <div className="text-2xl font-bold text-indigo-600 mt-1">$29</div>
                  <span className="text-xs text-gray-500">/month</span>
                </div>
              </th>
              <th className="px-4 py-4 text-center min-w-[140px] bg-indigo-50">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold text-indigo-700 flex items-center gap-1">
                    Professional
                    <span className="px-2 py-0.5 bg-amber-400 text-amber-900 text-xs font-bold rounded-full flex items-center gap-0.5">
                      <Crown className="w-3 h-3" />
                      BEST
                    </span>
                  </span>
                  <div className="text-2xl font-bold text-indigo-600 mt-1">$49</div>
                  <span className="text-xs text-gray-500">/month</span>
                </div>
              </th>
              <th className="px-4 py-4 text-center min-w-[120px]">
                <div className="flex flex-col items-center">
                  <span className="text-sm font-semibold text-gray-700">Enterprise</span>
                  <div className="text-2xl font-bold text-gray-900 mt-1">Custom</div>
                  <span className="text-xs text-gray-500">contact us</span>
                </div>
              </th>
            </tr>
          </thead>
          <tbody>
            {featureData.map((category, catIndex) => (
              <React.Fragment key={catIndex}>
                <tr className="bg-gray-100">
                  <td colSpan={5} className="px-6 py-3">
                    <span className="text-sm font-bold text-gray-800">{category.category}</span>
                  </td>
                </tr>
                {category.features.map((feature, featureIndex) => (
                  <tr
                    key={featureIndex}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="text-gray-800">{feature.name}</span>
                        {feature.isNew && (
                          <span className="px-1.5 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded">NEW</span>
                        )}
                        {feature.isPro && (
                          <span className="px-1.5 py-0.5 bg-purple-100 text-purple-700 text-xs font-semibold rounded flex items-center gap-0.5">
                            <Sparkles className="w-3 h-3" />
                            PRO
                          </span>
                        )}
                        <button
                          className="relative"
                          onMouseEnter={() => setActiveTooltip(`${catIndex}-${featureIndex}`)}
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-indigo-600 transition" />
                          {activeTooltip === `${catIndex}-${featureIndex}` && (
                            <div className="absolute left-6 top-0 z-10 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl">
                              <div className="absolute -left-2 top-2 w-0 h-0 border-t-4 border-b-4 border-r-8 border-transparent border-r-gray-900"></div>
                              {feature.tooltip}
                            </div>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-4 py-4 text-center">
                      {renderCell(feature.free)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {renderCell(feature.starter)}
                    </td>
                    <td className="px-4 py-4 text-center bg-indigo-50/50">
                      {renderCell(feature.professional)}
                    </td>
                    <td className="px-4 py-4 text-center">
                      {renderCell(feature.enterprise)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile hint */}
      <div className="block md:hidden p-4 bg-gray-50 border-t">
        <p className="text-sm text-gray-600 text-center">
          👉 Scroll table horizontally to see all plans
        </p>
      </div>
    </div>
  );
};
