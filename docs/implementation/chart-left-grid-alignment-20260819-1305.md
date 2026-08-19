# Chart left grid alignment

Aligned the chart plotting boundary with the first vertical grid line. Value labels now occupy the gutter to its left, while the horizontal guides and balance line extend fully to that boundary. Disabled ECharts 6's automatic outer-bound adjustment so it cannot silently shift the coordinate grid away from the CSS rule. Constrained the time axis to its data bounds while retaining the right inset that keeps the final point on-screen. Compact axis formatting keeps magnitudes within four characters without limiting exact values elsewhere.
