import { useState, useCallback, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import StepContent from './components/StepContent';
import Footer from './components/Footer';
import EmojiCelebration from './components/EmojiCelebration';
import EndOfContent from './components/EndOfContent';
import './index.css';

function App() {
    const [currentStep, setCurrentStep] = useState(0);
    const [useCamera, setUseCamera] = useState(!window.innerWidth <= 768);
    const [isScrolling, setIsScrolling] = useState(false);
    const [showEnding, setShowEnding] = useState(false);
    const [celebrationActive, setCelebrationActive] = useState(false);
    const [cameraCleanup, setCameraCleanup] = useState(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showMobileLogo, setShowMobileLogo] = useState(false);

    const steps = [
        {
            title: 'visioneer',
            content:
                'give your computer the gift of vision, get an esp32-s3-eye to see it through',
            gesture: 'open_hand_(🖐)',
        },
        {
            title: 'criteria',
            content:
                'projects should apply computer vision in unique or unconventional ways. be creative! have fun! and most importantly, make it your own!',
            gesture: 'thumbs_up_(👍)',
        },
        {
            title: 'what can i bag?',
            content:
                `upon successful submission and evaluation of your visioneer project, participants will receive an <a href="https://www.espressif.com/en/products/devkits/esp-eye/overview" target="_blank" rel="noopener noreferrer" style="text-decoration: underline">ESP32-S3-EYE</a>. this is a great way to get started with computer vision and embedded systems!`,
            gesture: 'peace_(✌️)',
        },
        {
            title: 'how do i submit?',
            content:
                `submit your project through the visioneer submisison which will be sent on the slack channel! after submitting, you'll need to vote on at least 5 other projects with the link that is sent to your email after submission. remember to include a detailed description of your project and how it uses computer vision. if you have any questions, feel free to reach out on <a href="https://hackclub.slack.com/archives/C082PCKJYMN" target="_blank" rel="noopener noreferrer" style="text-decoration: underline">#visioneer</a>`,
            gesture: 'rock_on_(🤘)',
        },
    ];

    const handleGestureDetected = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prevStep) => prevStep + 1);
        } else {
            // Last gesture detected - show celebration!
            setCelebrationActive(true);
            setShowEnding(true);

            // Reset celebration after a few seconds
            setTimeout(() => {
                setCelebrationActive(false);
            }, 4000);
        }
    }, [currentStep, steps.length]);

    const handleBack = () => {
        setCurrentStep((prev) => (prev > 0 ? prev - 1 : 0));
    };

    const handleSkip = () => {
        // Clean up camera if cleanup function exists
        if (cameraCleanup) {
            cameraCleanup();
        }
        setUseCamera(false);
    };

    const handleCameraMount = useCallback((cameraInterface) => {
        // Store the camera cleanup function
        if (cameraInterface && cameraInterface.cleanup) {
            setCameraCleanup(() => cameraInterface.cleanup);
        }
    }, []);

    const handleScroll = useCallback((e) => {
        if (!useCamera && !isScrolling && !isMobile) {  // Don't handle scroll events on mobile
            if (!(currentStep === 0 && e.deltaY < 0) && Math.abs(e.deltaY) > 10) {
                setIsScrolling(true);
                if (e.deltaY > 0 && currentStep < steps.length - 1) {
                    // Prevent default scrolling behavior when navigating between steps
                    e.preventDefault();
                    setCurrentStep(prev => prev + 1);
                } else if (e.deltaY < 0 && currentStep > 0) {
                    e.preventDefault();
                    setCurrentStep(prev => prev - 1);
                }
                // For last step, allow normal scrolling to see the EndOfContent component
                setTimeout(() => setIsScrolling(false), 500);
            }
        }
    }, [currentStep, useCamera, isScrolling, steps.length, isMobile]);

    useEffect(() => {
        // Use a non-passive event listener to allow preventDefault
        window.addEventListener('wheel', handleScroll, { passive: false });
        return () => window.removeEventListener('wheel', handleScroll);
    }, [handleScroll]);

    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (isMobile) {
            // Clean up camera on mobile
            if (cameraCleanup) {
                cameraCleanup();
            }
            setUseCamera(false);
            document.body.style.overflow = 'auto';
        } else if (!useCamera) {
            // In desktop text-only mode, allow scrolling
            document.body.style.overflow = 'auto';
        } else {
            // In camera mode, prevent scrolling
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'hidden';
        };
    }, [isMobile, cameraCleanup, useCamera]);

    useEffect(() => {
        const dustContainer = document.createElement('div');
        dustContainer.className = 'dust-particles';

        // Adjust particle count
        const particleCount = isMobile ? 120 : 500;

        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'dust-particle';

            // Random properties
            const size = 1 + Math.random() * 3;
            const duration = 10 + Math.random() * 20;
            const startPosition = Math.random() * 100;
            const delay = Math.random() * -duration;

            // Randomly choose between white and cyan with varying intensities
            const isCyan = Math.random() > 0.5;
            const opacity = 0.4 + Math.random() * 0.6;
            const color = isCyan ?
                `hsla(180, 100%, 50%, ${opacity})` :
                `rgba(255, 255, 255, ${opacity})`;

            const startFromTop = Math.random() > 0.5;
            const travelDistance = startFromTop ?
                (100 + Math.random() * 300) :
                (-100 - Math.random() * 300);

            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${startPosition}%;
                ${startFromTop ? 'top: -20px' : 'bottom: -20px'};
                opacity: 0;
                background: ${color};
                animation: ${startFromTop ? 'floatDown' : 'floatUp'} ${duration}s linear infinite;
                animation-delay: ${delay}s;
                --travel-distance: ${travelDistance}px;
                --opacity: ${opacity};
            `;

            dustContainer.appendChild(particle);
        }

        const leftPanel = document.querySelector('.left-panel');
        if (leftPanel) {
            leftPanel.appendChild(dustContainer);
        }

        return () => dustContainer.remove();
    }, [isMobile]);

    useEffect(() => {
        if (isMobile) {
            const timer = setTimeout(() => {
                setShowMobileLogo(true);
            }, 3000);
            return () => clearTimeout(timer);
        }
    }, [isMobile]);

    // Clean up camera when component unmounts
    useEffect(() => {
        return () => {
            if (cameraCleanup) {
                cameraCleanup();
            }
        };
    }, [cameraCleanup]);

    return (
        <div className="app-container">
            {!isMobile && (
                <a href="https://hackclub.com">
                    <img
                        src="/flag-orpheus-top.svg"
                        alt="Hack Club"
                        className="hack-club-logo"
                    />
                </a>
            )}
            {isMobile && (
                <>
                    <div className="mobile-blur-bar" />
                    <a href="https://hackclub.com">
                        <img
                            src="/flag-standalone-wtransparent.svg"
                            alt="Hack Club"
                            className="hack-club-logo mobile"
                        />
                    </a>
                </>
            )}
            <div className={`left-panel ${!useCamera ? 'full-width' : ''}`}>
                {useCamera && (
                    <button className="skip-button" onClick={handleSkip}>
                        Skip CV Demo →
                    </button>
                )}
                <StepContent
                    currentStep={currentStep}
                    steps={steps}
                    isFullScreen={!useCamera}
                />

                {/* Show celebration end content if we've reached the end */}
                {showEnding && useCamera && (
                    <div className="celebration-section">
                        <h2>Mission Complete! 🎉</h2>
                        <p>You've mastered all the gestures! Time to build your own computer vision project.</p>
                        <div className="celebration-buttons">
                            <button onClick={handleSkip}>View All Instructions</button>
                        </div>
                    </div>
                )}

                {!useCamera && currentStep === steps.length - 1 && (
                    <EndOfContent />
                )}

                <Footer
                    isFullScreen={!useCamera}
                    currentStep={currentStep}
                    totalSteps={steps.length}
                />
            </div>
            {useCamera && !isMobile && (
                <div className="right-panel">
                    <CameraFeed
                        onGestureDetected={handleGestureDetected}
                        currentStep={currentStep}
                        steps={steps}
                        onCameraMount={handleCameraMount}
                    />
                </div>
            )}

            {/* Emoji celebration component */}
            <EmojiCelebration active={celebrationActive} />
        </div>
    );
}

export default App;