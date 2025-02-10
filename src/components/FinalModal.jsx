import React, { useEffect, useState } from 'react';
import '../assets/FinalModal.css';

function FinalModal({ onClose }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        setTimeout(() => setVisible(true), 10);
    }, []);

    return (
        <div className="modal-overlay">
            <div className={`modal-content ${visible ? 'visible' : ''}`}>
                <h1>Welcome to the first step towards your vision(eer)!</h1>
                <p>
                    Join the Slack channel{' '}
                    <a
                        href="https://hackclub.slack.com/archives/C082PCKJYMN"
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        #visioneer
                    </a>
                </p>
                <button className="close-btn" onClick={onClose}>
                    Close
                </button>
            </div>
        </div>
    );
}

export default FinalModal;