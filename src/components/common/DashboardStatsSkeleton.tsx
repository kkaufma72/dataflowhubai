import React from 'react';

const DashboardStatsSkeleton: React.FC = () => {
  return (
    <>
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="bg-white rounded-lg shadow-sm p-6 border border-gray-200 animate-pulse">
          <div className="flex justify-between items-start">
            <div className="flex-1">
              <div className="h-4 bg-gray-200 rounded w-24 mb-3"></div>
              <div className="h-8 bg-gray-200 rounded w-16 mb-3"></div>
              <div className="h-3 bg-gray-200 rounded w-32"></div>
            </div>
            <div className="w-14 h-14 bg-gray-200 rounded-xl"></div>
          </div>
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-gray-100">
            <div className="h-3 bg-gray-200 rounded w-20"></div>
            <div className="h-3 bg-gray-200 rounded w-16"></div>
          </div>
        </div>
      ))}
    </>
  );
};

export default DashboardStatsSkeleton;