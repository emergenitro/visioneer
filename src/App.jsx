import { useState, useCallback } from 'react';
import CameraFeed from './components/CameraFeed';
import StepContent from './components/StepContent';

function App() {
    const [currentStep, setCurrentStep] = useState(0);
    const [useCamera, setUseCamera] = useState(true);

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
        setCurrentStep((prevStep) =>
            prevStep < steps.length - 1 ? prevStep + 1 : prevStep
        );
    }, [steps.length]);

    const handleBack = () => {
        setCurrentStep((prev) => (prev > 0 ? prev - 1 : 0));
    };

    return (
        <div className="app-container">
            <div className="left-panel">
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
        </div>
    );
}

export default App;
