import React, { useEffect, useState } from 'react';
import '../assets/GestureOverlay.css';

function GestureOverlay({ message, stepContent }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setVisible(false);
        const timer = setTimeout(() => {
            setVisible(true);
        }, 100); // Small delay to trigger transition

        return () => clearTimeout(timer);
    }, [message, stepContent]);

    return (
        <div className={`gesture-overlay ${visible ? 'visible' : 'hidden'}`}>
            <div className="overlay-content">
                <h2>{message}</h2>
                <p>{stepContent}</p>
            </div>
        </div>
    );
}

export default GestureOverlay;