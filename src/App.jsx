import { useState, useCallback, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import StepContent from './components/StepContent';
import ProgressBar from './components/ProgressBar';
import TextContent from './components/TextContent';
import Footer from './components/Footer';

function App() {
    const [currentStep, setCurrentStep] = useState(0);
    const [useCamera, setUseCamera] = useState(!window.innerWidth <= 768);
    const [isScrolling, setIsScrolling] = useState(false);
    const endingSectionRef = useRef(null);
    const [showEnding, setShowEnding] = useState(false);
    const videoRef = useRef(null);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const [showMobileLogo, setShowMobileLogo] = useState(false);

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
        if (!useCamera && !isScrolling && !isMobile) {  // Don't handle scroll events on mobile
            if (!(currentStep === 0 && e.deltaY < 0) && Math.abs(e.deltaY) > 10) {
                setIsScrolling(true);
                if (e.deltaY > 0 && currentStep < steps.length - 1) {
                    setCurrentStep(prev => prev + 1);
                } else if (e.deltaY < 0 && currentStep > 0) {
                    setCurrentStep(prev => prev - 1);
                }
                setTimeout(() => setIsScrolling(false), 500);
            }
        }
    }, [currentStep, useCamera, isScrolling, steps.length, isMobile]);

    useEffect(() => {
        window.addEventListener('wheel', handleScroll);
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
            setUseCamera(false);
            document.body.style.overflow = 'auto';
        } else {
            document.body.style.overflow = 'hidden';
        }
        return () => {
            document.body.style.overflow = 'hidden';
        };
    }, [isMobile]);

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

    return (
        <div className="app-container">
            {!isMobile && (
                <a href="https://hackclub.com">
                    <img 
                        src="https://assets.hackclub.com/flag-orpheus-top.svg"
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
                            src="https://assets.hackclub.com/flag-standalone-wtransparent.svg"
                            alt="Hack Club"
                            className="hack-club-logo mobile"
                        />
                    </a>
                </>
            )}
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
            {useCamera && !isMobile && (
                <div className="right-panel">
                    <CameraFeed
                        onGestureDetected={handleGestureDetected}
                        currentStep={currentStep}
                        steps={steps}
                    />
                </div>
            )}
        </div>
    );
}

export default App;
