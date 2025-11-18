import React, { useState } from 'react';
import { Check, X, Info, HelpCircle } from 'lucide-react';

interface FeatureRow {
  category: string;
  features: {
    name: string;
    tooltip: string;
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
        name: "Dataset Storage",
        tooltip: "Maximum number of datasets you can store",
        starter: "20 datasets",
        professional: "Unlimited",
        enterprise: "Unlimited"
      },
      {
        name: "File Upload Size",
        tooltip: "Maximum size per file upload",
        starter: "100 MB",
        professional: "1 GB",
        enterprise: "Unlimited"
      },
      {
        name: "Data Retention",
        tooltip: "How long your data is stored",
        starter: "6 months",
        professional: "Unlimited",
        enterprise: "Unlimited"
      }
    ]
  },
  {
    category: "AI & ML",
    features: [
      {
        name: "AI Questions",
        tooltip: "Ask your AI assistant about your data",
        starter: "100/month",
        professional: "Unlimited",
        enterprise: "Unlimited"
      },
      {
        name: "Model Training",
        tooltip: "Train custom machine learning models",
        starter: true,
        professional: true,
        enterprise: true
      },
      {
        name: "Auto ML",
        tooltip: "Automatically find the best model",
        starter: false,
        professional: true,
        enterprise: true
      },
      {
        name: "Custom Algorithms",
        tooltip: "Bring your own ML algorithms",
        starter: false,
        professional: false,
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
        starter: true,
        professional: true,
        enterprise: true
      },
      {
        name: "Advanced Charts",
        tooltip: "Heatmaps, 3D plots, network diagrams",
        starter: false,
        professional: true,
        enterprise: true
      },
      {
        name: "Custom Dashboards",
        tooltip: "Create personalized dashboards",
        starter: false,
        professional: true,
        enterprise: true
      },
      {
        name: "White Label",
        tooltip: "Remove DataFlowHub branding",
        starter: false,
        professional: false,
        enterprise: true
      }
    ]
  },
  {
    category: "Collaboration",
    features: [
      {
        name: "Team Members",
        tooltip: "Number of users on your account",
        starter: "1 user",
        professional: "5 users",
        enterprise: "Unlimited"
      },
      {
        name: "Share Reports",
        tooltip: "Share insights with team members",
        starter: false,
        professional: true,
        enterprise: true
      },
      {
        name: "Role-Based Access",
        tooltip: "Control who sees what data",
        starter: false,
        professional: false,
        enterprise: true
      },
      {
        name: "SSO Integration",
        tooltip: "Single Sign-On with your company account",
        starter: false,
        professional: false,
        enterprise: true
      }
    ]
  },
  {
    category: "Support",
    features: [
      {
        name: "Email Support",
        tooltip: "Get help via email",
        starter: "48h response",
        professional: "24h response",
        enterprise: "4h response"
      },
      {
        name: "Live Chat",
        tooltip: "Chat with our support team",
        starter: false,
        professional: true,
        enterprise: true
      },
      {
        name: "Phone Support",
        tooltip: "Call us directly",
        starter: false,
        professional: false,
        enterprise: true
      },
      {
        name: "Dedicated Account Manager",
        tooltip: "Personal point of contact",
        starter: false,
        professional: false,
        enterprise: true
      }
    ]
  }
];

export const FeatureComparisonTable: React.FC = () => {
  const [activeTooltip, setActiveTooltip] = useState<string | null>(null);

  const renderCell = (value: boolean | string) => {
    if (typeof value === 'boolean') {
      return value ? (
        <Check className="w-5 h-5 text-green-500 mx-auto" />
      ) : (
        <X className="w-5 h-5 text-gray-300 mx-auto" />
      );
    }
    return <span className="label-text text-gray-700">{value}</span>;
  };

  return (
    <div className="card-improved overflow-hidden">
      <div className="card-header">
        <h3 className="section-title">Compare Plans in Detail</h3>
        <p className="section-subtitle">See what's included in each tier</p>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50 border-b-2 border-gray-200">
            <tr>
              <th className="px-6 py-4 text-left">
                <span className="form-label">Feature</span>
              </th>
              <th className="px-6 py-4 text-center">
                <span className="form-label">Starter</span>
                <div className="stat-value text-primary mt-1">$25</div>
                <span className="text-xs text-gray-500">/month</span>
              </th>
              <th className="px-6 py-4 text-center bg-primary/5">
                <span className="form-label flex items-center justify-center gap-2">
                  Professional
                  <span className="badge-warning text-xs">POPULAR</span>
                </span>
                <div className="stat-value text-primary mt-1">$50</div>
                <span className="text-xs text-gray-500">/month</span>
              </th>
              <th className="px-6 py-4 text-center">
                <span className="form-label">Enterprise</span>
                <div className="stat-value text-primary mt-1">Custom</div>
                <span className="text-xs text-gray-500">pricing</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {featureData.map((category, catIndex) => (
              <React.Fragment key={catIndex}>
                <tr className="bg-gray-100">
                  <td colSpan={4} className="px-6 py-3">
                    <span className="card-title text-sm">{category.category}</span>
                  </td>
                </tr>
                {category.features.map((feature, featureIndex) => (
                  <tr
                    key={featureIndex}
                    className="border-b border-gray-100 hover:bg-gray-50 transition"
                  >
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="body-text">{feature.name}</span>
                        <button
                          className="relative"
                          onMouseEnter={() => setActiveTooltip(`${catIndex}-${featureIndex}`)}
                          onMouseLeave={() => setActiveTooltip(null)}
                        >
                          <HelpCircle className="w-4 h-4 text-gray-400 hover:text-primary transition" />
                          {activeTooltip === `${catIndex}-${featureIndex}` && (
                            <div className="absolute left-6 top-0 z-10 w-64 p-3 bg-gray-900 text-white text-sm rounded-lg shadow-xl">
                              <div className="absolute -left-2 top-2 w-0 h-0 border-t-4 border-b-4 border-r-8 border-transparent border-r-gray-900"></div>
                              {feature.tooltip}
                            </div>
                          )}
                        </button>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderCell(feature.starter)}
                    </td>
                    <td className="px-6 py-4 text-center bg-primary/5">
                      {renderCell(feature.professional)}
                    </td>
                    <td className="px-6 py-4 text-center">
                      {renderCell(feature.enterprise)}
                    </td>
                  </tr>
                ))}
              </React.Fragment>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile-friendly accordion view */}
      <div className="block md:hidden p-4">
        <p className="text-sm text-gray-600 text-center mb-4">
          Scroll table horizontally to see all plans →
        </p>
      </div>
    </div>
  );
};
