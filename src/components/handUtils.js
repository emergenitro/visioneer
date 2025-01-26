export const drawHandSkeleton = (keypoints, ctx) => {
    const connections = [
        [0, 1], [1, 2], [2, 3], [3, 4],
        [0, 5], [5, 6], [6, 7], [7, 8],
        [5, 9], [9, 10], [10, 11], [11, 12],
        [9, 13], [13, 14], [14, 15], [15, 16],
        [13, 17], [17, 18], [18, 19], [19, 20]
    ];

    connections.forEach(([start, end]) => {
        drawPath([keypoints[start], keypoints[end]], ctx, { color: 'red', lineWidth: 2 });
    });
};

// Helper function to draw paths
const drawPath = (points, ctx, style = { color: 'black', lineWidth: 1 }) => {
    const { color, lineWidth } = style;
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    ctx.lineTo(points[1].x, points[1].y);
    ctx.strokeStyle = color;
    ctx.lineWidth = lineWidth;
    ctx.stroke();
};