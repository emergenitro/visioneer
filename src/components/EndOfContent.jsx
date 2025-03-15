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
                        href="https://github.com/hackclub/visioneer"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="end-button"
                    >
                        Visit GitHub Repo
                    </a>
                    <button
                        onClick={() => window.location.reload()}
                        className="end-button secondary"
                    >
                        Back to Demo
                    </button>
                </div>
            </div>
            <div className="dummy-spacer"></div>
        </div>
    );
};

export default EndOfContent;