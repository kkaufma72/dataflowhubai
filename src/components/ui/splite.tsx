import { Suspense, lazy } from "react";

const Spline = lazy(() => import("@splinetool/react-spline"));

export interface SplineSceneProps {
  scene: string;
  className?: string;
}

export function SplineScene({ scene, className }: SplineSceneProps) {
  return (
    <Suspense
      fallback=
        {<div className="w-full h-full flex items-center justify-center">
          <span className="loader border-2 border-white/20 border-t-white w-6 h-6 rounded-full animate-spin"></span>
        </div>}
    >
      <Spline scene={scene} className={className} />
    </Suspense>
  );
}
