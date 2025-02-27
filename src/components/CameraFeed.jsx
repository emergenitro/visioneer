import { useRef, useState, useEffect, useCallback } from 'react';
import * as handPoseDetection from '@tensorflow-models/hand-pose-detection';
import { drawHandSkeleton } from './handUtils';
import GestureOverlay from './GestureOverlay';

// Preload the model outside component to cache it
let cachedDetector = null;
let modelLoadPromise = null;

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

function CameraFeed({ onGestureDetected, currentStep, steps, onCameraMount }) {
    const videoRef = useRef(null);
    const canvasRef = useRef(null);
    const detectorRef = useRef(null);
    const animationFrameIdRef = useRef(null);
    const cooldownRef = useRef(false);
    const streamRef = useRef(null);

    const [loadingMessage, setLoadingMessage] = useState('Initializing...');
    const [loadingProgress, setLoadingProgress] = useState(0);
    const [error, setError] = useState(null);

    // Function to properly clean up camera resources
    const cleanupCamera = useCallback(() => {
        if (animationFrameIdRef.current) {
            cancelAnimationFrame(animationFrameIdRef.current);
            animationFrameIdRef.current = null;
        }

        if (streamRef.current) {
            streamRef.current.getTracks().forEach(track => track.stop());
            streamRef.current = null;
        }
    }, []);

    // Load the model with caching
    const loadModel = useCallback(async () => {
        try {
            setLoadingProgress(10);
            setLoadingMessage('Initializing model...');

            // Use cached detector if available
            if (cachedDetector) {
                detectorRef.current = cachedDetector;
                setLoadingProgress(50);
                return;
            }

            // Use cached loading promise if one is already in progress
            if (modelLoadPromise) {
                setLoadingMessage('Waiting for model...');
                cachedDetector = await modelLoadPromise;
                detectorRef.current = cachedDetector;
                setLoadingProgress(50);
                return;
            }

            // Start new model loading
            const model = handPoseDetection.SupportedModels.MediaPipeHands;
            const detectorConfig = {
                runtime: 'mediapipe',
                solutionPath: 'https://cdn.jsdelivr.net/npm/@mediapipe/hands',
                modelType: 'lite', // Use lite model for faster loading
                maxHands: 1,
            };

            // Create and cache the loading promise
            modelLoadPromise = handPoseDetection.createDetector(model, detectorConfig);

            setLoadingMessage('Loading model...');
            cachedDetector = await modelLoadPromise;
            detectorRef.current = cachedDetector;
            setLoadingProgress(50);
        } catch (err) {
            console.error('Error loading model:', err);
            setError('Failed to initialize hand tracking. Please refresh.');
            modelLoadPromise = null;
        }
    }, []);

    // Initialize camera
    const initCamera = useCallback(async () => {
        try {
            setError(null);
            await loadModel();

            setLoadingMessage('Accessing camera...');
            setLoadingProgress(60);

            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    width: { ideal: 640 },
                    height: { ideal: 480 },
                    facingMode: 'user',
                    frameRate: { ideal: 30 }
                },
            });

            streamRef.current = stream;

            if (videoRef.current) {
                videoRef.current.srcObject = stream;
                videoRef.current.setAttribute('playsinline', '');
                videoRef.current.setAttribute('autoplay', '');

                await new Promise(resolve => {
                    videoRef.current.onloadeddata = () => {
                        resolve();
                    };
                });

                videoRef.current.play().catch((err) => console.error('Play error:', err));
            }

            setLoadingProgress(100);
            setLoadingMessage(null);

            // Notify parent component that camera is mounted and ready
            if (onCameraMount) {
                onCameraMount({
                    cleanup: cleanupCamera,
                    videoRef: videoRef.current
                });
            }
        } catch (err) {
            console.error('Error initializing camera:', err);
            setError('Could not access camera. Please grant permissions.');
        }
    }, [loadModel, cleanupCamera, onCameraMount]);

    useEffect(() => {
        let isMounted = true;
        initCamera();

        return () => {
            isMounted = false;
            cleanupCamera();
        };
    }, [initCamera, cleanupCamera]);

    useEffect(() => {
        if (!detectorRef.current || !videoRef.current || loadingMessage) return;

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
                if (!canvas) return;

                const ctx = canvas.getContext('2d');
                canvas.width = videoRef.current.videoWidth;
                canvas.height = videoRef.current.videoHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);
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
                        }, 3000); // Reduced cooldown time
                    }
                }
            }

            animationFrameIdRef.current = requestAnimationFrame(detectGestures);
        };

        detectGestures();

        return () => {
            if (animationFrameIdRef.current) {
                cancelAnimationFrame(animationFrameIdRef.current);
            }
        };
    }, [onGestureDetected, currentStep, steps, loadingMessage]);

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

    const detectRockOnGesture = (keypoints) => {
        const threshold = 15;
        const isThumbExtended = keypoints[4].y < keypoints[3].y - threshold;
        const isIndexExtended = keypoints[8].y < keypoints[6].y - threshold;
        const isPinkyExtended = keypoints[20].y < keypoints[19].y - threshold;

        const isMiddleCurled = keypoints[12].y > keypoints[10].y;
        const isRingCurled = keypoints[16].y > keypoints[14].y;

        return isThumbExtended && isIndexExtended && isPinkyExtended && isMiddleCurled && isRingCurled;
    };

    const detectGesture = (gesture, keypoints) => {
        switch (gesture) {
            case 'open_hand':
                return detectOpenHandGesture(keypoints);
            case 'thumbs_up':
                return detectThumbsUpGesture(keypoints);
            case 'peace':
                return detectVictoryGesture(keypoints);
            case 'rock_on':
                return detectRockOnGesture(keypoints);
            default:
                return false;
        }
    };

    if (error) {
        return (
            <div className="camera-container">
                <div className="error-message">
                    <span>{error}</span>
                    <a href="#" onClick={(e) => {
                        e.preventDefault();
                        initCamera();
                    }}>
                        retry
                    </a>
                </div>
            </div>
        );
    }

    return (
        <div className="camera-container">
            {loadingMessage && (
                <div className="loading-overlay">
                    <div className="loader"></div>
                    <p>{loadingMessage}</p>
                    <div className="loading-progress-bar">
                        <div
                            className="loading-progress"
                            style={{ width: `${loadingProgress}%` }}
                        ></div>
                    </div>
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