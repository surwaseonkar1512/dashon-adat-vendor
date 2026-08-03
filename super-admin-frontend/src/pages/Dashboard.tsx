import React from 'react';

const Dashboard = () => {
  return (
    <div>
      <h1 className="text-2xl font-semibold text-gray-900 mb-6">Dashboard</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Placeholder KPI Cards */}
        {[
          { label: 'Total Vendors', value: '124' },
          { label: 'Active Vendors', value: '98' },
          { label: 'Revenue This Month', value: '₹4,50,000' },
          { label: 'Pending Verification', value: '12' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white rounded-lg shadow p-6">
            <h3 className="text-sm font-medium text-gray-500">{kpi.label}</h3>
            <p className="mt-2 text-3xl font-bold text-gray-900">{kpi.value}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Dashboard;
