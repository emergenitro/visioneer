import { useState, useCallback, useRef, useEffect } from 'react';
import CameraFeed from './components/CameraFeed';
import StepContent from './components/StepContent';
import ProgressBar from './components/ProgressBar';

function App() {
    const [currentStep, setCurrentStep] = useState(0);
    const [useCamera, setUseCamera] = useState(true);
    const endingSectionRef = useRef(null);
    const [showEnding, setShowEnding] = useState(false);

    const steps = [
        {
            title: 'Description of the YSWS',
            content:
                'Visioneer challenges participants to develop a computer vision project that leverages technologies like OpenCV or similar...',
            gesture: 'open_hand',
        },
        {
            title: 'Requirements/Criteria',
            content:
                'Projects should apply computer vision in unique or unconventional ways. Examples include real-time object tracking...',
            gesture: 'thumbs_up',
        },
        {
            title: 'What Do You Get When You Complete It?',
            content:
                'Upon successful submission and evaluation of your Visioneer project, participants will receive an ESP32-S3-EYE...',
            gesture: 'victory',
        },
        {
            title: 'How to Submit',
            content:
                'You can submit your project by providing a link to your repository along with a README explaining your project in detail...',
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

    return (
        <div className="app-container">
            <div className="left-panel">
                <ProgressBar currentStep={currentStep} totalSteps={steps.length} />
                {useCamera ? (
                    <StepContent
                        currentStep={currentStep}
                        steps={steps}
                        onBack={handleBack}
                    />
                ) : (
                    <div className="step-content">
                        <h2>Camera is off</h2>
                        <p>Please enable the camera to proceed.</p>
                    </div>
                )}
            </div>
            <div className="right-panel">
                {useCamera && (
                    <CameraFeed
                        onGestureDetected={handleGestureDetected}
                        currentStep={currentStep}
                        steps={steps}
                    />
                )}
            </div>
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
