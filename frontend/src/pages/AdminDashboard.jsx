import React, { useEffect, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import TruckTable from '../components/TruckTable';
import JourneyCard from '../components/JourneyCard';
import TireTable from '../components/TireTable';
import { journeyAPI, maintenanceRuleAPI, reportsAPI } from '../services/api';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [journeys, setJourneys] = useState([]);
  const [journeyForm, setJourneyForm] = useState({
    driver: '',
    truck: '',
    trailer: '',
    origin: '',
    destination: '',
    startDate: '',
    endDate: ''
  });
  const [rules, setRules] = useState([]);
  const [ruleForm, setRuleForm] = useState({ name: '', type: 'tire', appliesTo: 'all', thresholdKm: '', thresholdDays: '', notes: '' });
  const [upcoming, setUpcoming] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

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
    loadRules();
    loadUpcoming();
    loadReport();
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

  const handleCreateJourney = async (e) => {
    e.preventDefault();
    setError('');
    try {
    await journeyAPI.create(journeyForm);
      setJourneyForm({
        driver: '',
        truck: '',
        trailer: '',
        origin: '',
      destination: '',
      startDate: '',
      endDate: ''
      });
      loadJourneys();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create journey');
    }
  };

  const loadRules = async () => {
    try {
      const res = await maintenanceRuleAPI.list();
      setRules(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load rules');
    }
  };

  const loadUpcoming = async () => {
    try {
      const res = await maintenanceRuleAPI.upcoming();
      setUpcoming(res.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load maintenance alerts');
    }
  };

  const loadReport = async () => {
    try {
      const res = await reportsAPI.summary();
      setReport(res.data || null);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load reports');
    }
  };

  const handleCreateRule = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const payload = { ...ruleForm };
      if (!payload.thresholdKm) delete payload.thresholdKm;
      else payload.thresholdKm = Number(payload.thresholdKm);
      if (!payload.thresholdDays) delete payload.thresholdDays;
      else payload.thresholdDays = Number(payload.thresholdDays);
      const res = await maintenanceRuleAPI.create(payload);
      setRules([res.data, ...rules]);
      setRuleForm({ name: '', type: 'tire', appliesTo: 'all', thresholdKm: '', thresholdDays: '', notes: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create rule');
    }
  };

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <h1>Admin Dashboard</h1>
        <div style={styles.userInfo}>
          <span>Welcome, {user?.name}</span>
          <button onClick={logout} style={styles.logoutButton}>
            Logout
          </button>
        </div>
      </header>
      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '12px' }}>Create Journey</h2>
          <form onSubmit={handleCreateJourney} style={styles.form}>
            <input
              style={styles.input}
              placeholder="Driver ID"
              value={journeyForm.driver}
              onChange={(e) => setJourneyForm({ ...journeyForm, driver: e.target.value })}
              required
            />
            <input
              style={styles.input}
              placeholder="Truck ID"
              value={journeyForm.truck}
              onChange={(e) => setJourneyForm({ ...journeyForm, truck: e.target.value })}
              required
            />
            <input
              style={styles.input}
              placeholder="Trailer ID (optional)"
              value={journeyForm.trailer}
              onChange={(e) => setJourneyForm({ ...journeyForm, trailer: e.target.value })}
            />
            <input
              style={styles.input}
              placeholder="Origin"
              value={journeyForm.origin}
              onChange={(e) => setJourneyForm({ ...journeyForm, origin: e.target.value })}
              required
            />
            <input
              style={styles.input}
              placeholder="Destination"
              value={journeyForm.destination}
              onChange={(e) => setJourneyForm({ ...journeyForm, destination: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              style={styles.input}
              placeholder="Start date"
              value={journeyForm.startDate}
              onChange={(e) => setJourneyForm({ ...journeyForm, startDate: e.target.value })}
              required
            />
            <input
              type="datetime-local"
              style={styles.input}
              placeholder="End date"
              value={journeyForm.endDate}
              onChange={(e) => setJourneyForm({ ...journeyForm, endDate: e.target.value })}
              required
            />
            <button style={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Create Journey'}
            </button>
          </form>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <TruckTable />
        </section>

        <section style={{ marginBottom: '24px' }}>
          <TireTable />
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '12px' }}>Maintenance Rules</h2>
          <form onSubmit={handleCreateRule} style={styles.form}>
            <input style={styles.input} placeholder="Name" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} required />
            <select style={styles.input} value={ruleForm.type} onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value })}>
              <option value="tire">Tire</option>
              <option value="oil">Oil</option>
              <option value="revision">Revision</option>
            </select>
            <select style={styles.input} value={ruleForm.appliesTo} onChange={(e) => setRuleForm({ ...ruleForm, appliesTo: e.target.value })}>
              <option value="all">All</option>
              <option value="truck">Truck</option>
              <option value="trailer">Trailer</option>
            </select>
            <input style={styles.input} type="number" placeholder="Threshold km" value={ruleForm.thresholdKm} onChange={(e) => setRuleForm({ ...ruleForm, thresholdKm: e.target.value })} />
            <input style={styles.input} type="number" placeholder="Threshold days" value={ruleForm.thresholdDays} onChange={(e) => setRuleForm({ ...ruleForm, thresholdDays: e.target.value })} />
            <input style={styles.input} placeholder="Notes" value={ruleForm.notes} onChange={(e) => setRuleForm({ ...ruleForm, notes: e.target.value })} />
            <button style={styles.primaryButton} type="submit" disabled={loading}>Add Rule</button>
          </form>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Type</th>
                  <th>Applies to</th>
                  <th>Km</th>
                  <th>Days</th>
                  <th>Notes</th>
                </tr>
              </thead>
              <tbody>
                {rules.map((r) => (
                  <tr key={r._id}>
                    <td>{r.name}</td>
                    <td>{r.type}</td>
                    <td>{r.appliesTo}</td>
                    <td>{r.thresholdKm ?? '—'}</td>
                    <td>{r.thresholdDays ?? '—'}</td>
                    <td>{r.notes || '—'}</td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '12px' }}>No rules</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '12px' }}>Maintenance Alerts</h2>
          <div style={{ overflowX: 'auto' }}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th>Asset</th>
                  <th>Rule</th>
                  <th>Type</th>
                  <th>Due date</th>
                  <th>Due km</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((a, idx) => (
                  <tr key={idx}>
                    <td>{a.assetType} {a.assetId}</td>
                    <td>{a.rule}</td>
                    <td>{a.type}</td>
                    <td>{a.dueByDate ? new Date(a.dueByDate).toLocaleDateString() : '—'}</td>
                    <td>{a.dueByKm ?? '—'}</td>
                    <td>{a.status}</td>
                  </tr>
                ))}
                {upcoming.length === 0 && (
                  <tr><td colSpan="6" style={{ textAlign: 'center', padding: '12px' }}>No alerts</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '12px' }}>Reports</h2>
          {report ? (
            <div style={styles.reportGrid}>
              <div style={styles.reportCard}>
                <div>Total journeys</div>
                <strong>{report.journeysCount}</strong>
              </div>
              <div style={styles.reportCard}>
                <div>Total mileage</div>
                <strong>{report.totalMileage || 0} km</strong>
              </div>
              <div style={styles.reportCard}>
                <div>Total fuel</div>
                <strong>{report.totalFuel || 0} L</strong>
              </div>
            </div>
          ) : (
            <p>No report data</p>
          )}
        </section>

        <section>
          <h2 style={{ marginBottom: '12px' }}>Journeys</h2>
          {journeys.map((j) => (
            <JourneyCard
              key={j._id}
              journey={j}
              onStatusChange={handleStatusChange}
              onTrackingSave={handleTrackingSave}
            />
          ))}
          {journeys.length === 0 && <p>No journeys yet</p>}
        </section>
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
  },
  form: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
    gap: '10px',
    marginBottom: '16px'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px'
  },
  primaryButton: {
    padding: '10px 14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  }
};

export default AdminDashboard;