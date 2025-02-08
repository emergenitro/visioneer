import { useRef, useState, useEffect, useCallback } from 'react';
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
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectorRef = useRef(null);
    const animationFrameIdRef = useRef(null);
    const cooldownRef = useRef(false); // replaced cooldown state

    const [loadingMessage, setLoadingMessage] = useState(null);
    const [error, setError] = useState(null);

    const initCamera = useCallback(async () => {
        try {
            setError(null);
            setLoadingMessage('Loading models...');
            const model = handPoseDetection.SupportedModels.MediaPipeHands;
            const detectorConfig = {
                runtime: 'mediapipe',
                solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
                modelType: 'full',
                maxHands: 1,
            };
            detectorRef.current = await handPoseDetection.createDetector(model, detectorConfig);

            setLoadingMessage('Switching on camera...');
            const stream = await navigator.mediaDevices.getUserMedia({
                video: { width: 640, height: 480, facingMode: 'user' },
            });

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', '');
                videoRef.current.setAttribute('autoplay', '');
                videoRef.current.onloadeddata = () => {
                    videoRef.current.play().catch((err) => console.error('Play error:', err));
                };
            }
            setLoadingMessage(null);
        } catch (err) {
            console.error('Error initializing camera:', err);
            setError('Could not access camera. Please grant permissions.');
        }
    }, []);

    useEffect(() => {
        let isMounted = true;
        initCamera();
        const detectGestures = async () => {
            if (
                videoRef.current &&
                videoRef.current.readyState === 4 &&
                detectorRef.current
            ) {
                let hands = [];
                try {
                    hands = await detectorRef.current.estimateHands(videoRef.current);
                } catch (err) {
                    console.error('Error during hand detection:', err);
                }
                const canvas = canvasRef.current;
                const ctx = canvas.getContext('2d');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                // Draw the video feed once
                ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);

                if (hands.length > 0) {
                    const keypoints = hands[0].keypoints;
                    drawHandSkeleton(keypoints, ctx);

                    const requiredGesture = steps[currentStep]?.gesture;
                    if (requiredGesture && detectGesture(requiredGesture, keypoints) && !cooldownRef.current) {
                        cooldownRef.current = true;
                        new Audio('/sounds/success.mp3').play();
                        onGestureDetected();
                        setTimeout(() => {
                            cooldownRef.current = false;
                        }, 5000);
                    }
                }
            }
            if (isMounted) animationFrameIdRef.current = requestAnimationFrame(detectGestures);
        };

        detectGestures();

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
    }, [onGestureDetected, currentStep, steps, initCamera]); // removed cooldown from deps

    // Gesture detection functions
    const detectOpenHandGesture = (keypoints) => {
        const threshold = 20;
        return (
            keypoints[8].y < keypoints[6].y - threshold &&
            keypoints[12].y < keypoints[10].y - threshold &&
            keypoints[16].y < keypoints[14].y - threshold &&
            keypoints[20].y < keypoints[18].y - threshold
        );
    };

    const detectThumbsUpGesture = (keypoints) => {
        const threshold = 20;
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
        return (
            keypoints[8].y < keypoints[6].y - threshold &&
            keypoints[12].y < keypoints[10].y - threshold &&
            keypoints[16].y > keypoints[14].y - 10 &&
            keypoints[20].y > keypoints[18].y - 10
        );
    };

    const detectCallMeGesture = (keypoints) => {
        const threshold = 20;
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

    if (error) {
        return (
            <div className="camera-container">
                <div className="error-message">{error}</div>
                <button className="restart-button" onClick={initCamera}>
                    Retry
                </button>
            </div>
        );
    }

    return (
        <div className="camera-container">
            {loadingMessage && (
                <div className="loading-overlay">
                    <div className="loader"></div>
                    <p>{loadingMessage}</p>
                </div>
            )}
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
