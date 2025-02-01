import { useRef, useState, useEffect } from 'react';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { drawHandSkeleton } from './handUtils';
import GestureOverlay from './GestureOverlay';

function getBoundingBox(keypoints) {
    const xs = keypoints.map((point) => point.x);
    const ys = keypoints.map((point) => point.y);
    return {
        minX: Math.min(...xs),
        maxX: Math.max(...xs),
        minY: Math.min(...ys),
        maxY: Math.max(...ys),
        centerX: (Math.min(...xs) + Math.max(...xs)) / 2,
        centerY: (Math.min(...ys) + Math.max(...ys)) / 2,
    };
}

function CameraFeed({ onGestureDetected, currentStep, steps }) {
    // Create refs for the (hidden) video element, canvas, detector, and animation frame id.
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectorRef = useRef(null);
    const animationFrameIdRef = useRef(null);

    const [loadingMessage, setLoadingMessage] = useState(null);
    const [error, setError] = useState(null);
    const [cooldown, setCooldown] = useState(false);

    // ---- Improved gesture detection functions using thresholds
    const detectOpenHandGesture = (keypoints) => {
        const threshold = 20; // pixels
        // For an open hand, we require that index, middle, ring, and pinky tips are significantly higher (i.e. smaller y) than their PIP joints.
        return (
            keypoints[8].y < keypoints[6].y - threshold &&
            keypoints[12].y < keypoints[10].y - threshold &&
            keypoints[16].y < keypoints[14].y - threshold &&
            keypoints[20].y < keypoints[18].y - threshold
        );
    };

    const detectThumbsUpGesture = (keypoints) => {
        const threshold = 20;
        // Thumb tip above the thumb IP and the other fingers roughly folded (not extended)
        return (
            keypoints[4].y < keypoints[3].y - threshold &&
            keypoints[8].y > keypoints[6].y - 10 &&
            keypoints[12].y > keypoints[10].y - 10 &&
            keypoints[16].y > keypoints[14].y - 10 &&
            keypoints[20].y > keypoints[18].y - 10
        );
    };

    const detectVictoryGesture = (keypoints) => {
        const threshold = 20;
        // Index and middle fingers extended, ring and pinky folded.
        return (
            keypoints[8].y < keypoints[6].y - threshold &&
            keypoints[12].y < keypoints[10].y - threshold &&
            keypoints[16].y > keypoints[14].y - 10 &&
            keypoints[20].y > keypoints[18].y - 10
        );
    };

    const detectCallMeGesture = (keypoints) => {
        const threshold = 20;
        // Thumb and pinky extended while index, middle, and ring fingers are folded.
        return (
            keypoints[4].y < keypoints[3].y - threshold &&
            keypoints[20].y < keypoints[19].y - threshold &&
            keypoints[8].y > keypoints[6].y - 10 &&
            keypoints[12].y > keypoints[10].y - 10 &&
            keypoints[16].y > keypoints[14].y - 10
        );
    };

    const detectGesture = (gesture, keypoints) => {
        switch (gesture) {
            case 'open_hand':
                return detectOpenHandGesture(keypoints);
            case 'thumbs_up':
                return detectThumbsUpGesture(keypoints);
            case 'victory':
                return detectVictoryGesture(keypoints);
            case 'call_me':
                return detectCallMeGesture(keypoints);
            default:
                return false;
        }
    };

    useEffect(() => {
        let isMounted = true;
        // This async function loads the hand-pose detector and gets the camera stream.
        const runHandPoseDetection = async () => {
            try {
                setLoadingMessage('Loading models...');
                const model = handPoseDetection.SupportedModels.MediaPipeHands;
                const detectorConfig = {
                    runtime: 'mediapipe',
                    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
                    modelType: 'full',
                    maxHands: 1,
                };
                detectorRef.current = await handPoseDetection.createDetector(
                    model,
                    detectorConfig
                );

                if (!isMounted) return;

                setLoadingMessage('Switching on camera...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: { width: 640, height: 480, facingMode: 'user' },
                });

                if (!isMounted) return;

                // Use the hidden video element rendered in our JSX.
                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute('playsinline', '');
                    videoRef.current.setAttribute('autoplay', '');
                    videoRef.current.onloadeddata = () => {
                        videoRef.current
                            .play()
                            .catch((err) => console.error('Play error:', err));
                    };
                }

                setLoadingMessage(null); // Models and camera are ready

                const detectGestures = async () => {
                    if (
                        videoRef.current &&
                        videoRef.current.readyState === 4 &&
                        detectorRef.current
                    ) {
                        const hands = await detectorRef.current.estimateHands(
                            videoRef.current
                        );
                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');
                        // Set canvas size to the video's dimensions:
                        canvas.width = videoRef.current.videoWidth;
                        canvas.height = videoRef.current.videoHeight;
                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

                        if (hands.length > 0) {
                            const keypoints = hands[0].keypoints;
                            const handBox = getBoundingBox(keypoints);
                            ctx.save();
                            // (Optional) perform a simple zoom/translate so the hand is centered.
                            ctx.translate(canvas.width / 2, canvas.height / 2);
                            ctx.translate(-handBox.centerX, -handBox.centerY);
                            ctx.drawImage(
                                videoRef.current,
                                0,
                                0,
                                canvas.width,
                                canvas.height
                            );
                            ctx.restore();

                            drawHandSkeleton(keypoints, ctx);

                            const requiredGesture = steps[currentStep]?.gesture;
                            if (requiredGesture && detectGesture(requiredGesture, keypoints) && !cooldown) {
                                setCooldown(true);
                                onGestureDetected();
                                setTimeout(() => setCooldown(false), 5000); // 5-second cooldown
                            }
                        }
                    }
                    animationFrameIdRef.current = requestAnimationFrame(detectGestures);
                };

                detectGestures();
            } catch (err) {
                console.error('Error initializing camera:', err);
                setError(
                    'Could not access camera. Please ensure you have granted camera permissions.'
                );
            }
        };

        runHandPoseDetection();

        return () => {
            isMounted = false;
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
            if (detectorRef.current) {
                detectorRef.current.dispose();
            }
            if (videoRef.current?.srcObject) {
                videoRef.current.srcObject
                    .getTracks()
                    .forEach((track) => track.stop());
            }
        };
    }, [onGestureDetected, currentStep, steps, cooldown]);

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="camera-container">
            {loadingMessage && (
                <div className="loading-overlay">
                    <div className="loader"></div>
                    <p>{loadingMessage}</p>
                </div>
            )}
            {/* The hidden video element so that videoRef.current is defined */}
            <video ref={videoRef} style={{ display: 'none' }} />
            <canvas ref={canvasRef} className="camera-canvas" />
            {currentStep < steps.length && (
                <GestureOverlay
                    message={`Perform the "${steps[currentStep].gesture.replace(
                        '_',
                        ' '
                    )}" gesture to proceed`}
                    stepContent={steps[currentStep].content}
                    key={currentStep}
                />
            )}
        </div>
    );
}

export default CameraFeed;
