import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import DriverJourneyCard from '../components/DriverJourneyCard';
import { journeyAPI } from '../services/api';

const DriverDashboard = () => {
  const { user, logout } = useAuth();
  const [journeys, setJourneys] = useState([]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const loadJourneys = async () => {
    try {
      setLoading(true);
      const response = await journeyAPI.list();
      setJourneys(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load journeys');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadJourneys();
  }, []);

  const handleStatusChange = async (id, status) => {
    try {
      await journeyAPI.updateTracking(id, status);
      loadJourneys();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update status');
    }
  };

  const handleTrackingSave = async (id, payload) => {
    try {
      await journeyAPI.updateTracking(id, payload);
      loadJourneys();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update tracking');
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Driver Dashboard</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {user?.name}</span>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>
      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}
        {loading && <p>Loading...</p>}
        {journeys.map((j) => (
          <DriverJourneyCard
            key={j._id}
            journey={j}
            onStatusUpdate={handleStatusChange}
            onTrackingSave={handleTrackingSave}
          />
        ))}
        {journeys.length === 0 && !loading && <p>No journeys assigned yet</p>}
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffff'
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #000000'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: '2px solid #000000',
    borderRadius: '0px',
    cursor: 'pointer'
  },
  main: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  error: {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '12px',
    borderRadius: '0px',
    marginBottom: '16px',
    border: '2px solid #000000'
  }
};

export default DriverDashboard;