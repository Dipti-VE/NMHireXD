import { Routes, Route } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import MatchAgent from './pages/MatchAgent';
import Candidates from './pages/Candidates';
import Outreach from './pages/Outreach';
import Register from './pages/Register';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/match-agent" element={<MatchAgent />} />
      <Route path="/candidates" element={<Candidates />} />
      <Route path="/outreach" element={<Outreach />} />
    </Routes>
  );
}

export default App;