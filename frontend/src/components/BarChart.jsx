import React from 'react';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts';

const CustomBarChart = ({ data, xKey, barKey, title }) => (
  <div style={{ width: '100%', height: 300, margin: '24px 0' }}>
    <h3 style={{ textAlign: 'center' }}>{title}</h3>
    <ResponsiveContainer>
      <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 0 }}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey={xKey} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Bar dataKey={barKey} fill="#8884d8" />
      </BarChart>
    </ResponsiveContainer>
  </div>
);

export default CustomBarChart;
