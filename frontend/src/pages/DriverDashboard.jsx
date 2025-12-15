import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import JourneyCard from '../components/JourneyCard';
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
      await journeyAPI.updateStatus(id, status);
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
          <JourneyCard
            key={j._id}
            journey={j}
            onStatusChange={handleStatusChange}
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
    backgroundColor: '#f5f5f5'
  },
  header: {
    backgroundColor: 'white',
    padding: '20px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  logoutButton: {
    padding: '8px 16px',
    backgroundColor: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer'
  },
  main: {
    padding: '40px',
    maxWidth: '1200px',
    margin: '0 auto'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '12px',
    borderRadius: '6px',
    marginBottom: '16px'
  }
};

export default DriverDashboard;