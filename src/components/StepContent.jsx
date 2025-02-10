import React, { useState, useEffect } from 'react';

const StepContent = ({ currentStep, steps, isFullScreen }) => {
    const [isVisible, setIsVisible] = useState(false);
    const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
    const step = steps[currentStep];
    
    useEffect(() => {
        const handleResize = () => {
            setIsMobile(window.innerWidth <= 768);
        };
        
        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    useEffect(() => {
        if (!isMobile) {
            setIsVisible(false);
            const timer = setTimeout(() => setIsVisible(true), 50);
            return () => clearTimeout(timer);
        }
    }, [currentStep, isMobile]);

    if (isMobile) {
        return (
            <div className="mobile-content">
                {steps.map((step, index) => (
                    <div key={index} className="mobile-step">
                        <h1 data-title={step.title.toLowerCase()}>{step.title}</h1>
                        <p dangerouslySetInnerHTML={{ __html: step.content }}></p>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            <div className={`step-content ${isVisible ? 'visible' : ''}`}>
                <h1 data-title={step.title.toLowerCase()}>{step.title}</h1>
                <p dangerouslySetInnerHTML={{ __html: step.content }}></p>
            </div>
            {isFullScreen && currentStep < 2 && (
                <div className="scroll-instruction">
                    Scroll to navigate
                </div>
            )}
            {isFullScreen && (
                <div className="page-indicators">
                    {steps.map((_, index) => (
                        <div 
                            key={index} 
                            className={`page-indicator ${index === currentStep ? 'active' : ''}`}
                        />
                    ))}
                </div>
            )}
        </>
    );
};

export default StepContent;
