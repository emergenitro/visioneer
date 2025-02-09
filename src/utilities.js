export const drawHand = (predictions, ctx) => {
    // Check for predictions
    if (predictions.length > 0) {
        predictions.forEach((prediction) => {
            const landmarks = prediction.landmarks;

            // Loop through landmarks and draw them
            for (let i = 0; i < landmarks.length; i++) {
                const x = landmarks[i][0];
                const y = landmarks[i][1];

                // Draw points
                ctx.beginPath();
                ctx.arc(x, y, 5, 0, 3 * Math.PI);
                ctx.fillStyle = 'blue';
                ctx.fill();
            }
        });
    }
};