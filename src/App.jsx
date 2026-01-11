import { Routes, Route } from 'react-router-dom';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import Home from './pages/Home';
import About from './pages/About';
import Rules from './pages/Rules';
import Organization from './pages/Organization';
import Registration from './pages/Registration';
import Teams from './pages/Teams';
import Players from './pages/Players';
import Tournaments from './pages/Tournaments';
import Matches from './pages/Matches';
import Results from './pages/Results';
import Admin from './pages/Admin';
import AdminUpload from './pages/AdminUpload';

function App() {
  console.log("Current App Version: 1.1 (Includes AdminUpload fix)");
  return (
    <div className="app-container" style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar />
      <main style={{ flex: 1, position: 'relative' }}>
        {/* Background Fog/Glow Effect Overlay */}
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, zIndex: -1, pointerEvents: 'none',
          backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(163, 51, 27, 0.05) 0%, rgba(0,0,0,0) 70%)'
        }}></div>

        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/about" element={<About />} />
          <Route path="/rules" element={<Rules />} />
          <Route path="/organization" element={<Organization />} />
          <Route path="/register" element={<Registration />} />
          <Route path="/teams" element={<Teams />} />
          <Route path="/players" element={<Players />} />
          <Route path="/tournaments" element={<Tournaments />} />
          <Route path="/matches" element={<Matches />} />
          <Route path="/results" element={<Results />} />
          <Route path="/admin" element={<Admin />} /> {/* Added Route for Admin */}
          <Route path="/admin/upload" element={<AdminUpload />} />
        </Routes>
      </main>
      <Footer />
    </div>
  )
}

export default App;
