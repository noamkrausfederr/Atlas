import { Route, Routes } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Homepage from './pages/Homepage';

function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/dashboard" element={<Dashboard />} />
      </Routes>
    </div>
  );
}

export default App;
