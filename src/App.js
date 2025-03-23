// src/App.js
import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ApiProvider } from './contexts/ApiContext';
import PhotoView from './components/PhotoView';
import './styles/tailwind.css';

function App() {
  return (
      <ApiProvider>
        <Router>
          <Routes>
            {/* Main photo view route */}
            <Route path="/photo/:photoId" element={<PhotoView />} />

            {/* Redirect to Rushel & Sivani wedding site if no photo ID is provided */}
            <Route path="*" element={
              <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-christian-accent/10 to-hindu-secondary/10">
                <div className="bg-white p-8 rounded-xl shadow-xl max-w-md text-center">
                  <h1 className="text-4xl font-script text-wedding-love mb-4">Rushel & Sivani</h1>
                  <p className="text-xl mb-6">Wedding Photo Gallery</p>
                  <p className="mb-6">Scan a QR code from our wedding photo booth to view your photo.</p>
                  <a
                      href="https://rushelandsivani.com"
                      className="inline-block bg-christian-accent text-white px-6 py-3 rounded-full hover:bg-christian-accent/90 transition-colors"
                  >
                    Visit Our Wedding Site
                  </a>
                </div>
              </div>
            } />
          </Routes>
        </Router>
      </ApiProvider>
  );
}

export default App;