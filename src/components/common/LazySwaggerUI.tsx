import React, { Suspense, lazy } from 'react';
import Loading from './Loading';

// Lazy load SwaggerUI to reduce initial bundle size
const SwaggerUIComponent = lazy(() =>
  import('swagger-ui-react').then(module => {
    // Also import the CSS when the component is loaded
    import('swagger-ui-react/swagger-ui.css');
    return { default: module.default };
  })
);

interface LazySwaggerUIProps {
  spec: any;
}

const LazySwaggerUI: React.FC<LazySwaggerUIProps> = ({ spec }) => {
  return (
    <Suspense fallback={<Loading size="lg" text="Loading API documentation..." />}>
      <SwaggerUIComponent spec={spec} />
    </Suspense>
  );
};

export default LazySwaggerUI;
