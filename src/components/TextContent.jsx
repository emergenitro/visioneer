import React from 'react';

function TextContent({ steps }) {
    return (
        <div className="text-content">
            <div className="text-header">
                <button className="skip-button" onClick={() => window.location.reload()}>
                    Return to CV Demo →
                </button>
            </div>
            <div className="text-sections">
                {steps.map((step, index) => (
                    <section key={index} className="text-section">
                        <h2>{step.title}</h2>
                        <p>{step.content}</p>
                    </section>
                ))}
            </div>
        </div>
    );
}

export default TextContent; 