import React from 'react';
import { Line, Bar, Pie } from 'react-chartjs-2';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
} from 'chart.js';

ChartJS.register(
    CategoryScale,
    LinearScale,
    BarElement,
    PointElement,
    LineElement,
    Title,
    Tooltip,
    Legend
);

const AnalyticsCharts = ({ analytics }) => {
    // Example data structure, replace with real analytics from backend
    const salesData = {
        labels: analytics.salesTrends?.map(d => d.date) || [],
        datasets: [
            {
                label: 'Sales',
                data: analytics.salesTrends?.map(d => d.amount) || [],
                fill: false,
                backgroundColor: 'rgba(255,206,86,0.6)',
                borderColor: 'rgba(255,206,86,1)',
            },
        ],
    };

    const topItemsData = {
        labels: analytics.topItems?.map(i => i.name) || [],
        datasets: [
            {
                label: 'Top Items',
                data: analytics.topItems?.map(i => i.sales) || [],
                backgroundColor: [
                    'rgba(255,99,132,0.6)',
                    'rgba(54,162,235,0.6)',
                    'rgba(255,206,86,0.6)',
                    'rgba(75,192,192,0.6)',
                    'rgba(153,102,255,0.6)',
                ],
            },
        ],
    };

    return (
        <div className="space-y-8">
            <div>
                <h3 className="text-lg font-bold mb-2">Sales Trends</h3>
                <Line data={salesData} />
            </div>
            <div>
                <h3 className="text-lg font-bold mb-2">Top Selling Items</h3>
                <Bar data={topItemsData} />
            </div>
        </div>
    );
};

export default AnalyticsCharts;
