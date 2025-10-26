import React, { Suspense, lazy } from 'react';
import Loading from './Loading';

// Lazy load SwaggerUI to reduce initial bundle size
const SwaggerUIComponent = lazy(() =>
  import('swagger-ui-react').then(module => {
    return { default: module.default };
  }).catch(() => {
    // Fallback if Swagger UI fails to load
    return { default: () => <div>API Documentation temporarily unavailable</div> };
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
