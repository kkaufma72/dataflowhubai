import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import UserGuide from '../components/UserGuide';
import Button from '../components/common/Button';
import { ArrowLeft } from 'lucide-react';

const UserGuideDetail: React.FC = () => {
  const { guideId } = useParams<{ guideId: string }>();
  const navigate = useNavigate();

  // This would typically come from an API or database
  const guides = {
    'getting-started': {
      title: 'Getting Started with DataFlowHub AI',
      description: 'Learn the basics of the platform and how to create your first project.',
      steps: [
        {
          title: 'Create an Account',
          description: 'Sign up for a DataFlowHub AI account using your email address or Google account. Once registered, you\'ll be directed to the dashboard where you can start creating projects.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Create Your First Project',
          description: 'Click on the "New Project" button in the dashboard. Enter a name and description for your project. Projects help you organize your datasets, models, and deployments.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Upload a Dataset',
          description: 'Navigate to the Data Management section and click "Upload Dataset". You can drag and drop your file or browse to select it. Supported formats include CSV, Excel, and JSON.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Train Your First Model',
          description: 'Go to the Model Training section, select your dataset, and choose your target variable. Configure your model settings and click "Start Training". The platform will automatically find the best model for your data.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Deploy Your Model',
          description: 'After training, navigate to the Deployment section, select your trained model, and configure deployment settings. Click "Deploy Model" to make your model available as an API endpoint.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        }
      ],
      relatedGuides: [
        { title: 'Data Preprocessing Guide', path: '/app/documentation/guides/data-preprocessing' },
        { title: 'Model Training Deep Dive', path: '/app/documentation/guides/model-training' },
        { title: 'Deployment Best Practices', path: '/app/documentation/guides/deployment' }
      ]
    },
    'data-preprocessing': {
      title: 'Data Preprocessing Guide',
      description: 'Learn how to clean, transform, and prepare your data for machine learning.',
      steps: [
        {
          title: 'Upload Your Dataset',
          description: 'Start by uploading your dataset in the Data Management section. The platform supports various formats including CSV, Excel, and JSON.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Analyze Data Quality',
          description: 'Use the Data Profiler to analyze your dataset. This will identify missing values, outliers, and other data quality issues that need to be addressed.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Handle Missing Values',
          description: 'Select a strategy for handling missing values, such as imputation with mean/median values or dropping rows/columns with too many missing values.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Deal with Outliers',
          description: 'Identify and handle outliers using methods like capping, removing, or transforming extreme values that could negatively impact your model.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Feature Scaling',
          description: 'Apply scaling techniques like standardization or normalization to ensure all features contribute equally to the model training process.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Feature Engineering',
          description: 'Create new features or transform existing ones to improve model performance. This might include encoding categorical variables or creating interaction terms.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        }
      ],
      relatedGuides: [
        { title: 'Getting Started Guide', path: '/app/documentation/guides/getting-started' },
        { title: 'Feature Engineering Deep Dive', path: '/app/documentation/guides/feature-engineering' },
        { title: 'Data Quality Best Practices', path: '/app/documentation/guides/data-quality' }
      ]
    },
    'model-training': {
      title: 'Model Training Deep Dive',
      description: 'Learn advanced techniques for training and optimizing machine learning models.',
      steps: [
        {
          title: 'Select Your Dataset',
          description: 'Choose a preprocessed dataset from your project. Ensure your data is clean and properly prepared for training.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Choose Model Type',
          description: 'Select between classification (for categorical predictions) or regression (for numerical predictions) based on your target variable.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Select Algorithms',
          description: 'Choose one or more algorithms to train. The platform supports Random Forest, XGBoost, Neural Networks, SVM, and ensemble methods.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Configure Training Parameters',
          description: 'Set the train/test split ratio, enable hyperparameter tuning, and select the optimization metric (e.g., accuracy, F1 score).',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Enable Cross-Validation',
          description: 'Use cross-validation to ensure your model generalizes well to new data. Configure the number of folds and whether to use stratified sampling.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Start Training',
          description: 'Click "Start Training" to begin the model training process. The platform will automatically find the best model for your data.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        },
        {
          title: 'Evaluate Results',
          description: 'Once training is complete, review the model performance metrics and compare different models to select the best one.',
          image: 'https://images.pexels.com/photos/3861969/pexels-photo-3861969.jpeg?auto=compress&cs=tinysrgb&w=1260&h=750&dpr=2'
        }
      ],
      relatedGuides: [
        { title: 'Getting Started Guide', path: '/app/documentation/guides/getting-started' },
        { title: 'Model Evaluation Guide', path: '/app/documentation/guides/model-evaluation' },
        { title: 'Hyperparameter Tuning', path: '/app/documentation/guides/hyperparameter-tuning' }
      ]
    }
  };

  const guide = guideId ? guides[guideId as keyof typeof guides] : null;

  if (!guide) {
    return (
      <div className="max-w-4xl mx-auto py-8">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900">Guide Not Found</h1>
          <p className="mt-2 text-gray-600">The guide you're looking for doesn't exist or has been moved.</p>
          <Button
            className="mt-4"
            onClick={() => navigate('/app/documentation')}
          >
            Back to Documentation
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="py-8">
      <div className="mb-6">
        <Button
          variant="outline"
          size="sm"
          icon={<ArrowLeft className="w-4 h-4" />}
          onClick={() => navigate('/app/documentation')}
        >
          Back to Documentation
        </Button>
      </div>
      
      <UserGuide
        title={guide.title}
        description={guide.description}
        steps={guide.steps}
        relatedGuides={guide.relatedGuides}
      />
    </div>
  );
};

export default UserGuideDetail;