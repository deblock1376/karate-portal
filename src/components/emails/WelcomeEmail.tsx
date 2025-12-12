import * as React from 'react';

interface WelcomeEmailProps {
    name: string;
}

export const WelcomeEmail: React.FC<WelcomeEmailProps> = ({ name }) => (
    <div style={{ fontFamily: 'sans-serif', lineHeight: '1.5' }}>
        <h1>Welcome to the Dojo, {name}!</h1>
        <p>
            We are thrilled to have you join our karate family. Your journey to black belt starts now!
        </p>
        <p>
            You can log in to your student portal to track your progress, view your current rank, and access training videos.
        </p>
        <p>
            <a href="http://localhost:3000/login" style={{ display: 'inline-block', padding: '10px 20px', backgroundColor: '#d97706', color: '#fff', textDecoration: 'none', borderRadius: '5px' }}>
                Login to Portal
            </a>
        </p>
        <p>
            Oss!
            <br />
            Sensei Miyagi
        </p>
    </div>
);
