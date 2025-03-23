// src/components/Loader.js
import React from 'react';
import { motion } from 'framer-motion';

const Loader = ({ message = 'Loading...' }) => (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-christian-accent/10 to-hindu-secondary/10">
        <div className="bg-white p-8 rounded-xl shadow-xl flex flex-col items-center">
            <motion.div
                animate={{ rotate: 360 }}
                transition={{
                    repeat: Infinity,
                    duration: 1.5,
                    ease: "linear"
                }}
                className="w-16 h-16 border-4 border-t-christian-accent border-wedding-love/30 rounded-full mb-4"
            />
            <p className="text-xl text-gray-700">{message}</p>
        </div>
    </div>
);

export default Loader;
