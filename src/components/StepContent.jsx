function StepContent({ currentStep, steps, onBack }) {
    return (
        <div className="step-content">
            {currentStep < steps.length ? (
                <div>
                    <h1>{steps[currentStep].title}</h1>
                    <p>{steps[currentStep].content}</p>
                    <p className="hint">
                        Perform a "<strong>{steps[currentStep].gesture.replace(
                            '_',
                            ' '
                        )}</strong>" gesture to proceed.
                    </p>
                    {currentStep > 0 && (
                        <button className="back-button" onClick={onBack}>
                            ← Back
                        </button>
                    )}
                </div>
            ) : (
                <div>
                    <h1>Thank You!</h1>
                    <p>You have reached the end of the presentation.</p>
                    <button
                        onClick={() => window.location.reload()}
                        className="restart-button"
                    >
                        Restart
                    </button>
                </div>
            )}
        </div>
    );
}

export default StepContent;
