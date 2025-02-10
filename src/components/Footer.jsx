import React, { useState } from 'react';

const Footer = ({ isFullScreen, currentStep, totalSteps }) => {
    const [isMobile] = useState(window.innerWidth <= 768);
    
    // Show on last step for desktop, or always for mobile
    const shouldShow = (isFullScreen && currentStep === totalSteps - 1) || 
                      (!isFullScreen && currentStep === totalSteps - 1) ||
                      isMobile;
    
    if (!shouldShow) return null;

    return (
        <div className={`credits-footer ${!isFullScreen ? 'cv-mode' : ''}`}>
            <p>site by <a href="https://github.com/emergenitro" target="_blank" rel="noopener noreferrer">@emergenitro</a> & <a href="https://github.com/ashfelloff" target="_blank" rel="noopener noreferrer">@ashfelloff</a> - follow us on github for a suprise</p>
            <p>ysws by <a href="https://github.com/emergenitro" target="_blank" rel="noopener noreferrer">@emergenitro</a></p>
            <p>shoutout to espressif!</p>
        </div>
    );
};

export default Footer; 
