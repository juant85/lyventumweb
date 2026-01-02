/**
 * Trend Calculation Utilities
 * 
 * Functions for calculating trends and generating sparkline data
 * for dashboard metric cards. Safe to use with existing data.
 */

/**
 * Calculate percentage change between two values
 * Returns rounded integer percentage (e.g., 15 for 15% increase)
 * 
 * @param current - Current value
 * @param previous - Previous value to compare against
 * @returns Percentage change as integer (positive or negative)
 */
export const calculateTrend = (current: number, previous: number): number => {
    // Handle edge cases safely
    if (previous === 0) {
        return current > 0 ? 100 : 0;
    }

    const change = ((current - previous) / previous) * 100;
    return Math.round(change);
};

/**
 * Generate realistic mock sparkline data based on current value
 * Creates a believable upward/downward trend leading to current value
 * 
 * @param currentValue - The final value to trend towards
 * @param days - Number of days of historical data to generate (default: 7)
 * @param volatility - How much the data fluctuates (0-1, default: 0.15)
 * @returns Array of values for sparkline chart
 */
export const generateMockSparklineData = (
    currentValue: number,
    days: number = 7,
    volatility: number = 0.15
): number[] => {
    if (currentValue === 0) {
        return Array(days).fill(0);
    }

    const data: number[] = [];

    // Determine if trend is upward or downward
    // 70% chance of upward trend (positive growth)
    const isUpwardTrend = Math.random() > 0.3;

    // Calculate starting value (15-25% different from current)
    const trendStrength = 0.15 + Math.random() * 0.10; // 15-25%
    const startValue = isUpwardTrend
        ? Math.round(currentValue * (1 - trendStrength))
        : Math.round(currentValue * (1 + trendStrength));

    // Generate intermediate values with realistic fluctuation
    for (let i = 0; i < days; i++) {
        const progress = i / (days - 1); // 0 to 1

        // Linear interpolation between start and current
        const baseValue = startValue + (currentValue - startValue) * progress;

        // Add random volatility (±volatility%)
        const fluctuation = baseValue * volatility * (Math.random() - 0.5) * 2;
        const value = Math.max(0, Math.round(baseValue + fluctuation));

        data.push(value);
    }

    // Ensure last value is exactly the current value
    data[data.length - 1] = currentValue;

    return data;
};

/**
 * Calculate trend direction from trend percentage
 * 
 * @param trend - Percentage change (from calculateTrend)
 * @returns 'up' | 'down' | 'neutral'
 */
export const getTrendDirection = (trend: number): 'up' | 'down' | 'neutral' => {
    if (trend > 0) return 'up';
    if (trend < 0) return 'down';
    return 'neutral';
};

/**
 * Generate complete trend data for a metric card
 * Combines trend calculation and sparkline generation
 * 
 * @param currentValue - Current metric value
 * @param simulatedGrowth - Optional: simulate specific growth % (for testing)
 * @returns Object with trend, sparklineData, and trendDirection
 */
export const generateMetricTrendData = (
    currentValue: number,
    simulatedGrowth?: number
) => {
    // Use simulatedGrowth if provided, otherwise random -10% to +25%
    const growthRate = simulatedGrowth ?? (-10 + Math.random() * 35);
    const previousValue = Math.round(currentValue / (1 + growthRate / 100));

    const trend = calculateTrend(currentValue, previousValue);
    const sparklineData = generateMockSparklineData(currentValue, 7);
    const trendDirection = getTrendDirection(trend);

    return {
        trend,
        sparklineData,
        trendDirection,
    };
};
