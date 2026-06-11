import * as React from 'react';

interface Props {
    name: string;
    subject: string;
    body: string;
}

export const NewsletterEmail: React.FC<Props> = ({ name, body }) => (
    <div style={{ fontFamily: 'Georgia, serif', lineHeight: '1.7', maxWidth: '600px', margin: '0 auto', color: '#1a1a1a' }}>
        <div style={{ background: '#1a1a1a', padding: '24px 32px', borderRadius: '8px 8px 0 0' }}>
            <h1 style={{ color: '#d97706', margin: 0, fontSize: '22px', fontFamily: 'sans-serif', letterSpacing: '0.05em' }}>
                ZANSHIN KARATE DOJO
            </h1>
        </div>
        <div style={{ background: '#ffffff', padding: '32px', border: '1px solid #e5e7eb', borderTop: 'none' }}>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: 0 }}>Hi {name},</p>
            <div style={{ whiteSpace: 'pre-wrap', fontSize: '15px' }}>{body}</div>
            <hr style={{ border: 'none', borderTop: '1px solid #e5e7eb', margin: '32px 0' }} />
            <p style={{ color: '#9ca3af', fontSize: '12px', margin: 0 }}>
                Zanshin Karate Dojo &nbsp;·&nbsp; <a href="https://zanshinkaratedojo.com" style={{ color: '#d97706' }}>zanshinkaratedojo.com</a>
                <br />
                You are receiving this because you are an enrolled student.
            </p>
        </div>
    </div>
);
