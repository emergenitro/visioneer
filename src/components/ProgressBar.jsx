import React from 'react';

const ProgressBar = ({ currentStep, totalSteps }) => {
    const progress = (currentStep / (totalSteps - 1)) * 100;
    return (
        <div className="progress-bar-container">
            <div className="progress-bar" style={{ width: progress + '%' }}></div>
        </div>
    );
};

export default ProgressBar;
