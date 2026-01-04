import { useState } from 'react';
import './App.css'
import RhetoricAnalyzer from './RhetoricAnalyzer';

function App() {
  const [showEasterEgg, setShowEasterEgg] = useState(false);

  // If the user wants to see the easter egg, we redirect them to the static file
  // or we could show a link. Since it's an "easter egg", maybe just redirecting is fine
  // or showing an iframe?
  // Let's just use window.location.href to go to the static file.
  if (showEasterEgg) {
     window.location.href = 'emoji-game.html';
     return null;
  }

  return (
    <div className="relative">
      <RhetoricAnalyzer />
      <button
        onClick={() => setShowEasterEgg(true)}
        className="fixed bottom-2 right-2 p-2 opacity-5 hover:opacity-100 transition-opacity text-2xl z-50 cursor-pointer"
        title="Nothing to see here..."
      >
        🤡
      </button>
    </div>
  );
}

export default App
