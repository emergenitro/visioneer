import React, { useEffect } from 'react';

const EndOfContent = () => {
    useEffect(() => {
        window.scrollTo({
            top: document.documentElement.scrollHeight - window.innerHeight,
            behavior: 'smooth'
        });
    }, []);

    return (
        <div className="end-of-content">
            <div className="end-content-container">
                <h2>🎉 You've reached the end!</h2>
                <p>Ready to create your computer vision project?</p>
                <div className="end-buttons">
                    <a
                        href="https://hackclub.slack.com/archives/C082PCKJYMN"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="end-button"
                    >
                        Join the slack now!
                    </a>
                </div>
            </div>
            <div className="dummy-spacer"></div>
        </div>
    );
};

export default EndOfContent;