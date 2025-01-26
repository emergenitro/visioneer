import React from 'react';
import '../assets/StepContent.css';

function StepContent({ currentStep, steps }) {
    return (
        <div className="step-content">
            {currentStep < steps.length ? (
                <div>
                    <h1>{steps[currentStep].title}</h1>
                    <p>{steps[currentStep].content}</p>
                    <p className="hint">
                        Make a "<strong>{steps[currentStep].gesture.replace('_', ' ')}</strong>" gesture to proceed.
                    </p>
                </div>
            ) : (
                <div>
                    <h1>Thank You!</h1>
                    <p>You have reached the end of the presentation.</p>
                    <button onClick={() => window.location.reload()} className="restart-button">
                        Restart
                    </button>
                </div>
            )}
        </div>
    );
}

export default StepContent;