import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, useMapEvents, CircleMarker, useMap, Polyline } from 'react-leaflet';
import { LatLng, LatLngBounds } from 'leaflet';
import { X } from 'lucide-react';
import 'leaflet/dist/leaflet.css';

interface Location {
  name: string;
  lat: number;
  lon: number;
}

function shuffleArray<T>(array: T[]): T[] {
  let shuffled = [...array];
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
  }
  return shuffled;
}

const answers: Location[] = shuffleArray([
  { name: "Fort Louisbourg", lat: 45.8922, lon: -59.9855 },
  { name: "Start of St. Lawrence Seaway", lat: 42.891411, lon: -79.251964 },
  { name: "Rideau Canal", lat: 45.422164, lon: -75.691664 },
  { name: "Plains of Abraham", lat: 46.8015, lon: -71.2201 },
  { name: "End of St. Lawrence Seaway", lat: 45.508888, lon: -73.561668 },
]);

function haversineDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Earth's radius in meters
  const φ1 = lat1 * Math.PI / 180;
  const φ2 = lat2 * Math.PI / 180;
  const Δφ = (lat2 - lat1) * Math.PI / 180;
  const Δλ = (lon2 - lon1) * Math.PI / 180;

  const a = Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) *
    Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return R * c / 1000;
}

function calculateScore(distance: number, size = 3176.862) {
  const score = 50 * Math.exp(-10 * distance / size);
  return Math.round(score);
}

function MapEvents({ onMapClick }: { onMapClick: (lat: number, lng: number) => void }) {
  useMapEvents({
    click: (e) => {
      onMapClick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

function ZoomToPoints({ userGuess, correctLocation }: { userGuess: [number, number] | null, correctLocation: Location | null }) {
  const map = useMap();

  useEffect(() => {
    if (userGuess && correctLocation) {
      const bounds = new LatLngBounds(
        new LatLng(userGuess[0], userGuess[1]),
        new LatLng(correctLocation.lat, correctLocation.lon)
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [userGuess, correctLocation, map]);

  return null;
}

function Rules({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[2000] p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full relative">
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700"
        >
          <X size={24} />
        </button>
        
        <h2 className="text-2xl font-bold mb-4">Welcome to Heritaguessr!</h2>
        
        <div className="space-y-4">
          <p className="text-gray-700">
            Test your knowledge of Canadian heritage sites by guessing their locations on the map.
          </p>
          
          <div className="space-y-2">
            <h3 className="font-semibold">How to Play:</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>You'll be given the name of a Canadian heritage site</li>
              <li>Click on the map where you think it's located</li>
              <li>The closer your guess, the more points you'll earn (max 50 points per location)</li>
              <li><b>The person with the most total points will get a prize.</b></li>
              <li>After each guess:
                <ul className="list-disc pl-5 mt-1">
                  <li>Red dot shows your guess</li>
                  <li>Green dot shows the actual location</li>
                  <li>Black line shows the distance between them</li>
                </ul>
              </li>
              <li>The map will automatically zoom to show both points</li>
              <li>Try to get the highest total score across all locations!</li>
            </ul>
          </div>
          
          <button
            onClick={onClose}
            className="mt-4 w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
          >
            Start Playing!
          </button>
        </div>
      </div>
    </div>
  );
}

function App() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState<number | string>('0');
  const [totalScore, setTotalScore] = useState(0);
  const [scoreAnimation, setScoreAnimation] = useState('');
  const [isDone, setIsDone] = useState(0);
  const [userGuess, setUserGuess] = useState<[number, number] | null>(null);
  const [showCorrect, setShowCorrect] = useState(false);
  const [correctLocation, setCorrectLocation] = useState<Location | null>(null);
  const [showRules, setShowRules] = useState(true);

  const handleGuess = (playerLat: number, playerLon: number) => {
    if (isDone === 1) return;
    
    const correct = answers[currentIndex];
    const distance = haversineDistance(correct.lat, correct.lon, playerLat, playerLon);
    const roundScore = calculateScore(distance);
    
    setUserGuess([playerLat, playerLon]);
    setCorrectLocation(correct);
    setShowCorrect(true);
    setScore(roundScore);
    setTotalScore(prev => prev + roundScore);
    setScoreAnimation('score-animation');

    if (currentIndex + 1 >= answers.length) {
      setIsDone(1);
      setScore(`You won with a score of ${totalScore + roundScore}!`);
      setScoreAnimation('done-animation');
    }
    
    if (currentIndex + 1 < answers.length) {
      setCurrentIndex(prev => prev + 1);
    }
  };

  return (
    <div className="relative w-full h-screen">
      {showRules && <Rules onClose={() => setShowRules(false)} />}
      
      <dialog open className={`popup bg-white px-4 py-2 shadow-lg ${isDone === 1 ? 'hidden' : ''}`}>
        <p>{answers[currentIndex].name}</p>
      </dialog>

      <dialog open className={`score ${scoreAnimation}`}>
        <p>{score}</p>
      </dialog>

      <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg shadow-lg z-[1000]">
        <p className="font-bold">Total Score: {totalScore}</p>
      </div>

      <MapContainer
        center={[48.393303, -65.8181455]}
        zoom={5}
        className="w-full h-full"
      >
        <TileLayer
          attribution='&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
          maxZoom={19}
        />
        <MapEvents onMapClick={handleGuess} />
        <ZoomToPoints userGuess={userGuess} correctLocation={correctLocation} />
        
        {userGuess && correctLocation && showCorrect && (
          <Polyline
            positions={[
              [userGuess[0], userGuess[1]],
              [correctLocation.lat, correctLocation.lon]
            ]}
            pathOptions={{ color: 'black', weight: 3, opacity: 0.7 }}
          />
        )}
        
        {userGuess && (
          <CircleMarker
            center={[userGuess[0], userGuess[1]]}
            radius={8}
            pathOptions={{ color: 'red', fillColor: 'red', fillOpacity: 1 }}
          />
        )}
        
        {showCorrect && correctLocation && (
          <CircleMarker
            center={[correctLocation.lat, correctLocation.lon]}
            radius={8}
            pathOptions={{ color: 'green', fillColor: 'green', fillOpacity: 1 }}
          />
        )}
      </MapContainer>
    </div>
  );
}

export default App;