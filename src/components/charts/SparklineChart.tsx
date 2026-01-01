import React from 'react';
import { LineChart, Line, ResponsiveContainer } from 'recharts';

interface SparklineChartProps {
    data: number[];
    color?: string;
    width?: number;
    height?: number;
}

/**
 * Tiny trend chart for displaying at-a-glance data trends
 * Used in dashboard cards to show historical context
 */
export const SparklineChart: React.FC<SparklineChartProps> = ({
    data,
    color = '#3b82f6', // blue-500 default
    width = 60,
    height = 20,
}) => {
    // Transform array to recharts format
    const chartData = data.map((value, index) => ({ value, index }));

    return (
        <ResponsiveContainer width={width} height={height}>
            <LineChart data={chartData}>
                <Line
                    type="monotone"
                    dataKey="value"
                    stroke={color}
                    strokeWidth={2}
                    dot={false}
                    isAnimationActive={false} // Disable for performance
                />
            </LineChart>
        </ResponsiveContainer>
    );
};

export default SparklineChart;
