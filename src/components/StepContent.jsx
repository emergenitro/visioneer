import React from 'react';

function StepContent({ currentStep, steps }) {
    return (
        <div className="step-content" style={contentStyles}>
            {currentStep < steps.length ? (
                <div>
                    <h2>{steps[currentStep].title}</h2>
                    <p>{steps[currentStep].content}</p>
                    <p style={{ marginTop: '2em' }}>Click "Next" to proceed.</p>
                    <button onClick={() => window.location.reload()} style={buttonStyles}>
                        Restart
                    </button>
                </div>
            ) : (
                <div>
                    <h2>Thank You!</h2>
                    <p>You have reached the end of the presentation.</p>
                    <button onClick={() => window.location.reload()} style={buttonStyles}>
                        Restart
                    </button>
                </div>
            )}
        </div>
    );
}

const contentStyles = {
    position: 'relative',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: 'white',
    padding: '2em',
    borderRadius: '8px',
    maxWidth: '600px',
    margin: '2em auto',
    textAlign: 'center'
};

const buttonStyles = {
    marginTop: '1em',
    padding: '0.5em 1em',
    fontSize: '1em',
    borderRadius: '4px',
    border: 'none',
    backgroundColor: '#007BFF',
    color: 'white',
    cursor: 'pointer'
};

export default StepContent;