// src/components/ErrorDisplay.js
import React from 'react';

const ErrorDisplay = ({ message = 'An error occurred' }) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-christian-accent/10 to-hindu-secondary/10">
        <div className="bg-white p-8 rounded-xl shadow-xl max-w-md text-center">
            <div className="text-5xl text-wedding-love mb-4">😕</div>
            <h2 className="text-2xl font-bold mb-2">Something went wrong</h2>
            <p className="text-gray-700 mb-6">{message}</p>
            <button
                onClick={() => window.location.reload()}
                className="bg-christian-accent text-white px-6 py-2 rounded-full hover:bg-christian-accent/90 transition-colors"
            >
                Try Again
            </button>
        </div>
    </div>
);

export default ErrorDisplay;
