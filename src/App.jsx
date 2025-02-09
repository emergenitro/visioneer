import { useState, useCallback, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import StepContent from './components/StepContent';
import ProgressBar from './components/ProgressBar';
import TextContent from './components/TextContent';
import Footer from './components/Footer';

function App() {
    const [currentStep, setCurrentStep] = useState(0);
    const [useCamera, setUseCamera] = useState(true);
    const [isScrolling, setIsScrolling] = useState(false);
    const endingSectionRef = useRef(null);
    const [showEnding, setShowEnding] = useState(false);
    const videoRef = useRef(null);

    const steps = [
        {
            title: 'visioneer',
            content:
                'give your computer the gift of vision, get an esp32-s3-eye to see it through',
            gesture: 'open_hand',
        },
        {
            title: 'criteria',
            content:
                'projects should apply computer vision in unique or unconventional ways. be creative! have fun! and most importantly, make it your own!',
            gesture: 'thumbs_up',
        },
        {
            title: 'what can i bag?',
            content:
                `upon successful submission and evaluation of your visioneer project, participants will receive an <a href="https://www.espressif.com/en/products/devkits/esp-eye/overview" target="_blank" rel="noopener noreferrer" style="text-decoration: underline">ESP32-S3-EYE</a>. this is a great way to get started with computer vision and embedded systems!`,
            gesture: 'victory',
        },
        {
            title: 'how do i submit?',
            content:
                `just send a pull request to the <a href="https://github.com/hackclub/visioneer" target="_blank" rel="noopener noreferrer" style="text-decoration: underline">visioneer github repo</a> with your project! make sure to add it to the projects file and include a README explaining your project in detail. if you have any questions, feel free to reach out on <a href="https://hackclub.slack.com/archives/C082PCKJYMN" target="_blank" rel="noopener noreferrer" style="text-decoration: underline">#visioneer</a>`,
            gesture: 'call_me',
        },
    ];

    const handleGestureDetected = useCallback(() => {
        if (currentStep < steps.length - 1) {
            setCurrentStep((prevStep) => prevStep + 1);
        } else {
            setShowEnding(true);
            // Smooth scroll to the ending section
            endingSectionRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    }, [currentStep, steps.length]);

    const handleBack = () => {
        setCurrentStep((prev) => (prev > 0 ? prev - 1 : 0));
    };

    const handleSkip = () => {
        setUseCamera(false);
        if (videoRef.current?.srcObject) {
            videoRef.current.srcObject.getTracks().forEach(track => track.stop());
        }
    };

    const handleScroll = useCallback((e) => {
        if (!useCamera && !isScrolling) {
            // Set scroll threshold to 10 for more sensitive scrolling
            const scrollThreshold = 10;
            
            // Only proceed if scroll is strong enough and we're not at boundaries
            if (!(currentStep === 0 && e.deltaY < 0) && Math.abs(e.deltaY) > scrollThreshold) {
                setIsScrolling(true);
                if (e.deltaY > 0 && currentStep < steps.length - 1) {
                    setCurrentStep(prev => prev + 1);
                } else if (e.deltaY < 0 && currentStep > 0) {
                    setCurrentStep(prev => prev - 1);
                }
                // Reduce debounce time to 500ms
                setTimeout(() => setIsScrolling(false), 500);
            }
        }
    }, [currentStep, useCamera, isScrolling, steps.length]);

    useEffect(() => {
        window.addEventListener('wheel', handleScroll);
        return () => window.removeEventListener('wheel', handleScroll);
    }, [handleScroll]);

    useEffect(() => {
        const dustContainer = document.createElement('div');
        dustContainer.className = 'dust-particles';
        
        for (let i = 0; i < 314; i++) {
            const particle = document.createElement('div');
            particle.className = 'dust-particle';
            
            // Random properties
            const size = 1 + Math.random() * 3;
            const duration = 10 + Math.random() * 20;
            const travelDistance = -100 - Math.random() * 300;
            const startPosition = Math.random() * 100;
            const delay = Math.random() * -duration;
            const hue = Math.random() * 360;
            
            particle.style.cssText = `
                width: ${size}px;
                height: ${size}px;
                left: ${startPosition}%;
                bottom: -20px;
                opacity: 0;
                background: hsla(${hue}, 70%, 50%, 0.6);
                animation: float ${duration}s linear infinite;
                animation-delay: ${delay}s;
                --travel-distance: ${travelDistance}px;
                --opacity: ${0.3 + Math.random() * 0.5};
            `;
            
            dustContainer.appendChild(particle);
        }
        
        const leftPanel = document.querySelector('.left-panel');
        if (leftPanel) {
            leftPanel.appendChild(dustContainer);
        }
        
        return () => dustContainer.remove();
    }, []);

    return (
        <div className="app-container">
            <div className={`left-panel ${!useCamera ? 'full-width' : ''}`}>
                <button className="skip-button" onClick={handleSkip}>
                    Skip CV Demo →
                </button>
                <StepContent
                    currentStep={currentStep}
                    steps={steps}
                    isFullScreen={!useCamera}
                />
                <Footer 
                    isFullScreen={!useCamera} 
                    currentStep={currentStep}
                    totalSteps={steps.length}
                />
            </div>
            {useCamera && (
                <div className="right-panel">
                    <CameraFeed
                        onGestureDetected={handleGestureDetected}
                        currentStep={currentStep}
                        steps={steps}
                    />
                </div>
            )}
            {showEnding && (
                <div ref={endingSectionRef} className="ending-section">
                    <h2>Thank you for participating!</h2>
                    <p>
                        We appreciate your interest in Visioneer. We hope you enjoyed the
                        experience and learned something new.
                    </p>
                    <p>
                        Feel free to explore more about our organization and other exciting
                        opportunities on our website.
                    </p>
                    <a href="https://example.com" target="_blank" rel="noopener noreferrer">
                        Visit our website
                    </a>
                </div>
            )}
        </div>
    );
}

export default App;
