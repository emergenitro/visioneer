import React, { useRef, useEffect, useState } from 'react';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import GestureOverlay from './GestureOverlay';
import { drawHandSkeleton } from './handUtils';
import '../assets/CameraFeed.css'; // Import CSS for styling

function CameraFeed({ onGestureDetected, currentStep, steps }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectorRef = useRef(null);
    const [error, setError] = useState(null);
    const [loadingMessage, setLoadingMessage] = useState('Loading models...');
    const animationFrameIdRef = useRef(null);

    // Cooldown state to prevent immediate re-triggering
    const [cooldown, setCooldown] = useState(false);

    useEffect(() => {
        let isMounted = true;

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
                detectorRef.current = await handPoseDetection.createDetector(model, detectorConfig);

                if (!isMounted) return;

                setLoadingMessage('Switching on camera...');
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: 640,
                        height: 480,
                        facingMode: 'user',
                    },
                });

                if (!isMounted) return;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute('playsinline', '');
                    videoRef.current.setAttribute('autoplay', '');
                    videoRef.current.onloadeddata = () => {
                        videoRef.current.play().catch((err) => console.error('Play error:', err));
                    };
                }

                setLoadingMessage(null); // Models and camera are ready

                const detectGestures = async () => {
                    if (
                        videoRef.current &&
                        videoRef.current.readyState === 4 &&
                        detectorRef.current
                    ) {
                        const hands = await detectorRef.current.estimateHands(videoRef.current);

                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');

                        // Match canvas size to video
                        canvas.width = videoRef.current.videoWidth;
                        canvas.height = videoRef.current.videoHeight;

                        ctx.clearRect(0, 0, canvas.width, canvas.height);

                        if (hands.length > 0) {
                            const keypoints = hands[0].keypoints;
                            console.log(keypoints);

                            // Automatic hand framing
                            const handBox = getBoundingBox(keypoints);
                            const zoomScale = 1; // Adjust zoom scale as needed

                            ctx.save();
                            ctx.translate(canvas.width / 2, canvas.height / 2);
                            ctx.scale(zoomScale, zoomScale);
                            ctx.translate(
                                -handBox.centerX,
                                -handBox.centerY
                            );
                            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                            ctx.restore();

                            drawHandSkeleton(keypoints, ctx);

                            const requiredGesture = steps[currentStep]?.gesture;
                            if (
                                requiredGesture &&
                                detectGesture(requiredGesture, keypoints) &&
                                !cooldown
                            ) {
                                // Start cooldown
                                setCooldown(true);
                                onGestureDetected();
                                setTimeout(() => setCooldown(false), 5000); // 5-second cooldown
                            }
                        } else {
                            // If no hands detected, display normal video feed
                            ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
                        }
                    }
                    // Request the next frame
                    animationFrameIdRef.current = requestAnimationFrame(detectGestures);
                };

                // Start the detection loop
                detectGestures();
            } catch (err) {
                console.error('Error initializing camera:', err);
                setError('Could not access camera. Please ensure you have granted camera permissions.');
            }
        };

        const getBoundingBox = (keypoints) => {
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
                videoRef.current.srcObject.getTracks().forEach((track) => track.stop());
            }
        };
    }, [onGestureDetected, currentStep, steps, cooldown]);

    // Gesture detection functions (adjusted for distinct gestures)
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

    const detectOpenHandGesture = (keypoints) => {
        // Check if all fingers are extended
        const fingersExtended = keypoints.slice(4).every((tip, index) => {
            const pip = keypoints[5 + index * 4];
            return tip.y < pip.y;
        });
        return fingersExtended;
    };

    const detectThumbsUpGesture = (keypoints) => {
        // Thumb up, other fingers folded
        const thumbTip = keypoints[4];
        const thumbIP = keypoints[3];
        const isThumbUp = thumbTip.y < thumbIP.y;

        const fingersFolded = [8, 12, 16, 20].every((tipIndex) => {
            const tip = keypoints[tipIndex];
            const pip = keypoints[tipIndex - 2];
            return tip.y > pip.y;
        });

        return isThumbUp && fingersFolded;
    };

    const detectVictoryGesture = (keypoints) => {
        // Index and middle fingers up, others down
        const isIndexUp = keypoints[8].y < keypoints[6].y;
        const isMiddleUp = keypoints[12].y < keypoints[10].y;
        const isRingDown = keypoints[16].y > keypoints[14].y;
        const isPinkyDown = keypoints[20].y > keypoints[18].y;

        return isIndexUp && isMiddleUp && isRingDown && isPinkyDown;
    };

    const detectCallMeGesture = (keypoints) => {
        // Thumb and pinky extended, other fingers folded
        const isThumbUp = keypoints[4].y < keypoints[3].y;
        const isPinkyUp = keypoints[20].y < keypoints[19].y;

        const fingersFolded = [8, 12, 16].every((tipIndex) => {
            const tip = keypoints[tipIndex];
            const pip = keypoints[tipIndex - 2];
            return tip.y > pip.y;
        });

        return isThumbUp && isPinkyUp && fingersFolded;
    };

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div className="camera-container">
            {loadingMessage ? (
                <div className="loading-overlay">
                    <div className="loader"></div>
                    <p>{loadingMessage}</p>
                </div>
            ) : null}
            <canvas
                ref={canvasRef}
                className="camera-canvas"
            />
            {currentStep < steps.length && (
                <GestureOverlay
                    message={`Make a "${steps[currentStep].gesture.replace('_', ' ')}" gesture to proceed`}
                    stepContent={steps[currentStep].content}
                    key={currentStep}
                />
            )}
        </div>
    );
}

export default CameraFeed;