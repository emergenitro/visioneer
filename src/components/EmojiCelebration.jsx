import React, { useEffect, useState } from 'react';

const emojis = ['🎉', '🥳', '🎊', '👏', '🔥', '✨', '🌟', '💯', '🚀', '🎯'];

const EmojiCelebration = ({ active }) => {
    const [particles, setParticles] = useState([]);

    useEffect(() => {
        if (!active) {
            setParticles([]);
            return;
        }

        // Create random particles
        const newParticles = [];
        const particleCount = 40; // Number of emoji particles

        for (let i = 0; i < particleCount; i++) {
            newParticles.push({
                id: i,
                emoji: emojis[Math.floor(Math.random() * emojis.length)],
                x: Math.random() * 100, // Random starting x position (0-100%)
                y: 120, // Start below the screen
                size: 20 + Math.random() * 30, // Random size
                opacity: 0.1 + Math.random() * 0.9, // Random opacity
                speed: 2 + Math.random() * 5, // Random speed
                delay: Math.random() * 0.8, // Random delay for staggered effect
                rotation: Math.random() * 360, // Random initial rotation
                rotationSpeed: -5 + Math.random() * 10, // Random rotation speed
                fromLeft: Math.random() > 0.5, // Coming from left or right side
            });
        }

        setParticles(newParticles);

        // Auto cleanup after animation duration
        const timer = setTimeout(() => {
            setParticles([]);
        }, 4000); // 4 seconds should be enough for the animation

        return () => clearTimeout(timer);
    }, [active]);

    if (particles.length === 0) return null;

    return (
        <div className="emoji-celebration">
            {particles.map((particle) => (
                <div
                    key={particle.id}
                    className="emoji-particle"
                    style={{
                        position: 'absolute',
                        left: `${particle.fromLeft ? -10 : 110}%`,
                        bottom: `${particle.y}%`,
                        fontSize: `${particle.size}px`,
                        opacity: particle.opacity,
                        transform: `rotate(${particle.rotation}deg)`,
                        animation: `
              moveEmoji${particle.fromLeft ? 'Right' : 'Left'} 2.5s forwards cubic-bezier(0.1, 0.9, 0.2, 1),
              fadeAway 2.5s forwards
            `,
                        animationDelay: `${particle.delay}s`,
                        zIndex: 1000,
                    }}
                >
                    {particle.emoji}
                </div>
            ))}
        </div>
    );
};

export default EmojiCelebration;