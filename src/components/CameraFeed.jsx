// src/components/CameraFeed.jsx
import React, { useRef, useEffect, useState } from 'react';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import '@tensorflow/tfjs-backend-webgl';
import GestureOverlay from './GestureOverlay';
import { drawHandSkeleton } from './handUtils'; // We'll define this utility separately

function CameraFeed({ onGestureDetected, currentStep, steps }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectorRef = useRef(null);
    const [error, setError] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const animationFrameIdRef = useRef(null);

    // Gesture-specific state (optional, for more refined control)
    const gestureStateRef = useRef({
        lastGesture: null,
    });

    useEffect(() => {
        let isMounted = true;

        const runHandPoseDetection = async () => {
            try {
                const stream = await navigator.mediaDevices.getUserMedia({
                    video: {
                        width: 640,
                        height: 480,
                        facingMode: 'user'
                    }
                });

                if (!isMounted) return;

                if (videoRef.current) {
                    videoRef.current.srcObject = stream;
                    videoRef.current.setAttribute('playsinline', '');
                    videoRef.current.setAttribute('autoplay', '');
                    videoRef.current.onloadeddata = () => {
                        videoRef.current.play()
                            .then(() => setIsLoading(false))
                            .catch(err => console.error('Play error:', err));
                    };
                }

                const model = handPoseDetection.SupportedModels.MediaPipeHands;
                const detectorConfig = {
                    runtime: 'mediapipe',
                    solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
                    modelType: 'full',
                };
                detectorRef.current = await handPoseDetection.createDetector(model, detectorConfig);

                const getBoundingBox = (keypoints) => {
                    const xs = keypoints.map(point => point.x);
                    const ys = keypoints.map(point => point.y);
                    return {
                        minX: Math.min(...xs),
                        maxX: Math.max(...xs),
                        minY: Math.min(...ys),
                        maxY: Math.max(...ys),
                    };
                };

                const detectGestures = async () => {
                    if (videoRef.current && videoRef.current.readyState === 4 && detectorRef.current) {
                        const hands = await detectorRef.current.estimateHands(videoRef.current);

                        const canvas = canvasRef.current;
                        const ctx = canvas.getContext('2d');

                        // Match canvas size to video
                        canvas.width = videoRef.current.videoWidth;
                        canvas.height = videoRef.current.videoHeight;

                        ctx.clearRect(0, 0, canvas.width, canvas.height);
                        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

                        if (hands.length > 0) {
                            const keypoints = hands[0].keypoints;
                            drawHandSkeleton(keypoints, ctx);

                            const requiredGesture = steps[currentStep]?.gesture;
                            if (requiredGesture && detectGesture(requiredGesture, keypoints)) {
                                gestureStateRef.current.lastGesture = requiredGesture;
                                onGestureDetected();
                            }
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
                setIsLoading(false);
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
                videoRef.current.srcObject.getTracks().forEach(track => track.stop());
            }
        };
    }, [onGestureDetected, currentStep, steps]);

    // Helper function to detect specific gestures
    const detectGesture = (gesture, keypoints) => {
        switch (gesture) {
            case 'wave':
                return detectWaveGesture(keypoints);
            case 'thumbs_up':
                return detectThumbsUpGesture(keypoints);
            case 'peace':
                return detectPeaceGesture(keypoints);
            case 'okay':
                return detectOkayGesture(keypoints);
            default:
                return false;
        }
    };

    // Gesture Detection Implementations

    // 1. Wave Gesture Detection
    const detectWaveGesture = (keypoints) => {
        /*
          Simple wave detection can be based on horizontal movement of the wrist (defined by keypoint 0).
          For a more accurate detection, you may track multiple points and their movement over time.
        */
        const wrist = keypoints[0];
        // For simplicity, check if wrist's y-coordinate is within a certain range (indicating movement up and down)
        // Implement a better wave detection algorithm as needed
        // Placeholder: Always return false

        const threshold = 20; // Adjust based on testing

        if (wrist.y > threshold) {
            return true;
        }

        return false;
    };

    // 2. Thumbs Up Gesture Detection
    const detectThumbsUpGesture = (keypoints) => {
        /*
          Thumbs up can be detected by checking:
          - Thumb is extended (tip is above IP joint)
          - Other fingers are folded
        */
        const thumb = keypoints[4];
        const thumbIP = keypoints[3];

        const isThumbUp = thumb.y < thumbIP.y; // Y decreases upwards

        // Check other fingers are not extended
        const fingers = [
            { tip: keypoints[8], pip: keypoints[6] }, // Index
            { tip: keypoints[12], pip: keypoints[10] }, // Middle
            { tip: keypoints[16], pip: keypoints[14] }, // Ring
            { tip: keypoints[20], pip: keypoints[18] }, // Pinky
        ];

        const areFingersFolded = fingers.every(finger => finger.tip.y > finger.pip.y);

        return isThumbUp && areFingersFolded;
    };

    // 3. Peace Gesture Detection
    const detectPeaceGesture = (keypoints) => {
        /*
          Peace sign can be detected by checking:
          - Index and middle fingers are extended.
          - Other fingers are folded.
        */

        const indexTip = keypoints[8];
        const indexPip = keypoints[6];
        const middleTip = keypoints[12];
        const middlePip = keypoints[10];
        const ringTip = keypoints[16];
        const ringPip = keypoints[14];
        const pinkyTip = keypoints[20];
        const pinkyPip = keypoints[18];

        const isIndexUp = indexTip.y < indexPip.y;
        const isMiddleUp = middleTip.y < middlePip.y;
        const isRingDown = ringTip.y > ringPip.y;
        const isPinkyDown = pinkyTip.y > pinkyPip.y;

        return isIndexUp && isMiddleUp && isRingDown && isPinkyDown;
    };

    // 4. Okay Gesture Detection
    const detectOkayGesture = (keypoints) => {
        /*
          Okay sign can be detected by checking:
          - Thumb and index finger touch forming a circle.
          - Other fingers are extended or folded as desired.
        */
        // Calculate distance between thumb tip and index tip
        const thumbTip = keypoints[4];
        const indexTip = keypoints[8];
        const distance = Math.hypot(thumbTip.x - indexTip.x, thumbTip.y - indexTip.y);

        const threshold = 30; // Adjust based on testing

        // Optionally, check other fingers
        // For simplicity, just check the distance
        return distance < threshold;
    };

    if (error) {
        return <div className="error-message">{error}</div>;
    }

    return (
        <div style={{ position: 'relative', width: '640px', height: '480px', margin: '0 auto' }}>
            <video
                ref={videoRef}
                style={{ width: '100%', height: '100%', objectFit: 'cover', transform: 'scaleX(-1)' }}
                playsInline
            />
            {isLoading && <div className="loading-message">Loading...</div>}
            <canvas
                ref={canvasRef}
                style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%' }}
            />
            {currentStep < steps.length && (
                <GestureOverlay
                    message={currentStep === 0 ? 'Hint: Try to wave' : `Make a ${steps[currentStep].gesture.replace('_', ' ')} gesture to proceed`}
                    stepContent={steps[currentStep].content}
                    key={currentStep} // To trigger re-mount and transition
                />
            )}
        </div>
    );
}

export default CameraFeed;