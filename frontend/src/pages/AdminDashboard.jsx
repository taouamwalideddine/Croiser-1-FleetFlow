import React, { useEffect, useState, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import TruckTable from '../components/TruckTable';
import JourneyCard from '../components/JourneyCard';
import TireTable from '../components/TireTable';
import api, { journeyAPI, maintenanceRuleAPI, reportsAPI, truckAPI, trailerAPI } from '../services/api';
import { toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const [journeys, setJourneys] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [trucks, setTrucks] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [journeyForm, setJourneyForm] = useState({
    driver: '',
    truck: '',
    trailer: '',
    origin: '',
    destination: ''
  });
  const [rules, setRules] = useState([]);
  const [ruleForm, setRuleForm] = useState({ name: '', type: 'tire', appliesTo: 'all', thresholdKm: '', thresholdDays: '', notes: '' });
  const [upcoming, setUpcoming] = useState([]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [metrics, setMetrics] = useState({
    activeJourneys: 0,
    availableTrucks: 0,
    activeAlerts: 0,
    totalDistance: 0
  });

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

  const loadMetrics = useCallback(() => {
    try {
      // Calculate active journeys
      const activeJourneys = journeys.filter(j => 
        j.status === 'in_progress' || j.status === 'loading' || j.status === 'in_transit'
      ).length;

      // Calculate available trucks
      const availableTrucks = trucks.filter(t => t.status === 'available').length;

      // Get active maintenance alerts
      const activeAlerts = upcoming.length;

      // Calculate total distance (sum of all completed journey distances)
      const totalDistance = journeys
        .filter(j => j.status === 'completed' && j.distance)
        .reduce((sum, j) => sum + j.distance, 0);

      setMetrics({
        activeJourneys,
        availableTrucks,
        activeAlerts,
        totalDistance: Math.round(totalDistance * 100) / 100 // Round to 2 decimal places
      });
    } catch (err) {
      console.error('Error loading metrics:', err);
    }
  }, [journeys, trucks, upcoming]);

  useEffect(() => {
    if (journeys.length > 0 || trucks.length > 0 || upcoming.length > 0) {
      loadMetrics();
    }
  }, [loadMetrics, journeys, trucks, upcoming]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setIsLoading(true);
        
        // Load all data in parallel
        await Promise.all([
          loadJourneys(),
          loadRules(),
          loadUpcoming(),
          loadReport(),
          loadDrivers(),
          loadTrucks(),
          loadTrailers()
        ]);
      } catch (err) {
        console.error('Error loading data:', err);
        setError('Failed to load data');
        toast.error('Failed to load data');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const handleStatusUpdate = async (journeyId, payload) => {
    try {
      setLoading(true);
      
      // Update the status and any additional data
      if (payload.status) {
        const note = payload.status === 'in_progress' ? 'Trajet démarré' : 
                    payload.status === 'finished' ? 'Trajet terminé' : 
                    'Statut mis à jour';
        
        // Update the status
        await journeyAPI.updateStatus(journeyId, payload.status, note);
        
        // If there's additional tracking data, update that too
        if (Object.keys(payload).length > 1) {
          await journeyAPI.updateTracking(journeyId, payload);
        }
      } else {
        // Just update tracking data without changing status
        await journeyAPI.updateTracking(journeyId, payload);
      }
      
      // Refresh the journeys list
      await loadJourneys();
      
    } catch (err) {
      console.error('Error updating journey:', err);
      setError(err.response?.data?.message || 'Erreur lors de la mise à jour du trajet');
      throw err; // Re-throw to handle in the component
    } finally {
      setLoading(false);
    }
  };

  const handleTrackingSave = async (id, payload) => {
    try {
      await journeyAPI.updateTracking(id, payload);
      await loadJourneys();
      toast.success('Tracking updated successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.message || 'Failed to update tracking';
      setError(errorMsg);
      toast.error(errorMsg);
    }
  };

  const loadDrivers = async () => {
    try {
      const usersRes = await api.get('/users');
      const driversList = usersRes.data.data.filter(user => user.role === 'chauffeur');
      setDrivers(driversList);
    } catch (err) {
      console.error('Error loading drivers:', err);
      toast.error('Failed to load drivers');
    }
  };

  const loadTrucks = async () => {
    try {
      const trucksRes = await truckAPI.list();
      setTrucks(trucksRes.data || []);
    } catch (err) {
      console.error('Error loading trucks:', err);
      toast.error('Failed to load trucks');
    }
  };

  const loadTrailers = async () => {
    try {
      const trailersRes = await trailerAPI.list();
      setTrailers(trailersRes.data || []);
    } catch (err) {
      console.error('Error loading trailers:', err);
      toast.error('Failed to load trailers');
    }
  };

  const handleDeleteTruck = async (truckId) => {
    if (!window.confirm('Are you sure you want to delete this truck?')) return;
    
    try {
      setIsDeleting(true);
      await truckAPI.remove(truckId);
      setTrucks(trucks.filter(truck => truck._id !== truckId));
      toast.success('Truck deleted successfully');
    } catch (err) {
      console.error('Error deleting truck:', err);
      toast.error(err.response?.data?.message || 'Failed to delete truck');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleDeleteJourney = async (journeyId) => {
    if (!window.confirm('Are you sure you want to delete this journey?')) return;
    
    try {
      setIsDeleting(true);
      await journeyAPI.delete(journeyId);
      setJourneys(journeys.filter(journey => journey._id !== journeyId));
      toast.success('Journey deleted successfully');
    } catch (err) {
      console.error('Error deleting journey:', err);
      toast.error(err.response?.data?.message || 'Failed to delete journey');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleCreateJourney = async (e) => {
    e.preventDefault();
    setError('');
    
    try {
      if (!journeyForm.driver || !journeyForm.truck) {
        throw new Error('Please select both driver and truck');
      }
      
      const payload = {
        driver: journeyForm.driver,
        truck: journeyForm.truck,
        origin: journeyForm.origin,
        destination: journeyForm.destination,
        ...(journeyForm.trailer && { trailer: journeyForm.trailer })
      };
      
      await journeyAPI.create(payload);
      
      // Reset form
      setJourneyForm({
        driver: '',
        truck: '',
        trailer: '',
        origin: '',
        destination: ''
      });
      
      await loadJourneys();
      toast.success('Journey created successfully');
    } catch (err) {
      const errorMsg = err.response?.data?.message || err.message || 'Failed to create journey';
      setError(errorMsg);
      toast.error(errorMsg);
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

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm('Are you sure you want to delete this rule?')) return;
    
    try {
      await maintenanceRuleAPI.remove(ruleId);
      setRules(rules.filter(rule => rule._id !== ruleId));
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete rule');
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
        <button onClick={logout} style={styles.logoutButton}>Logout</button>
      </header>

      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}
        {isLoading && <div>Loading...</div>}
        
        {/* Metrics Section */}
        <section style={styles.metricsContainer}>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>{metrics.activeJourneys}</div>
            <div style={styles.metricLabel}>Active Journeys</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>{metrics.availableTrucks}</div>
            <div style={styles.metricLabel}>Available Trucks</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>{metrics.activeAlerts}</div>
            <div style={styles.metricLabel}>Active Alerts</div>
          </div>
          <div style={styles.metricCard}>
            <div style={styles.metricValue}>{metrics.totalDistance} km</div>
            <div style={styles.metricLabel}>Total Distance</div>
          </div>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <h2 style={{ marginBottom: '12px' }}>Create Journey</h2>
          <form onSubmit={handleCreateJourney} style={styles.form}>
            <div style={styles.formGroup}>
              <label>Driver:</label>
              <select
                style={styles.select}
                value={journeyForm.driver}
                onChange={(e) => setJourneyForm({ ...journeyForm, driver: e.target.value })}
                required
                disabled={isLoading}
              >
                <option value="">Select a driver</option>
                {drivers.map(driver => (
                  <option key={driver._id} value={driver._id}>
                    {driver.name} ({driver.licenseNumber || 'No license'})
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label>Truck:</label>
              <select
                style={styles.select}
                value={journeyForm.truck}
                onChange={(e) => setJourneyForm({ ...journeyForm, truck: e.target.value })}
                required
                disabled={isLoading}
              >
                <option value="">Select a truck</option>
                {trucks.map(truck => (
                  <option key={truck._id} value={truck._id}>
                    {truck.licensePlate} - {truck.model || 'No model'}
                  </option>
                ))}
              </select>
            </div>

            <div style={styles.formGroup}>
              <label>Trailer (optional):</label>
              <select
                style={styles.select}
                value={journeyForm.trailer || ''}
                onChange={(e) => setJourneyForm({ ...journeyForm, trailer: e.target.value || null })}
                disabled={isLoading}
              >
                <option value="">No Trailer</option>
                {trailers.map(trailer => (
                  <option key={trailer._id} value={trailer._id}>
                    {trailer.licensePlate} - {trailer.model || 'No model'}
                  </option>
                ))}
              </select>
            </div>
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
            <button style={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Create Journey'}
            </button>
          </form>
        </section>

        <section style={{ marginBottom: '24px' }}>
          <TruckTable onDeleteTruck={handleDeleteTruck} isDeleting={isDeleting} />
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
                  <th>Actions</th>
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
                    <td>
                      <button 
                        onClick={() => handleDeleteRule(r._id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          color: '#dc3545',
                          cursor: 'pointer',
                          padding: '4px 8px',
                          borderRadius: '4px',
                          transition: 'background-color 0.2s'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ffebee'}
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
                        title="Delete Rule"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
                {rules.length === 0 && (
                  <tr><td colSpan="7" style={{ textAlign: 'center', padding: '12px' }}>No rules</td></tr>
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
            <div key={j._id} style={{ marginBottom: '16px' }}>
              <JourneyCard
                journey={j}
                onStatusUpdate={handleStatusUpdate}
                onTrackingSave={handleTrackingSave}
                onDelete={handleDeleteJourney}
                loading={loading}
              />
            </div>
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
    backgroundColor: '#f5f5f5',
    padding: '20px'
  },
  metricsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  metricCard: {
    backgroundColor: 'white',
    borderRadius: '8px',
    padding: '16px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    textAlign: 'center',
    transition: 'transform 0.2s, box-shadow 0.2s'
  },
  metricValue: {
    fontSize: '24px',
    fontWeight: 'bold',
    margin: '8px 0',
    color: '#333'
  },
  metricLabel: {
    color: '#666',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
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
    display: 'flex',
    flexDirection: 'column',
    gap: '16px',
    marginBottom: '24px',
    maxWidth: '600px',
    backgroundColor: '#fff',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
  },
  input: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    width: '100%',
    boxSizing: 'border-box'
  },
  primaryButton: {
    padding: '12px 16px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'background-color 0.2s',
    ':hover': {
      backgroundColor: '#0056b3'
    },
    ':disabled': {
      backgroundColor: '#6c757d',
      cursor: 'not-allowed'
    }
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '4px'
  },
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    fontSize: '14px',
    width: '100%',
    backgroundColor: 'white',
    cursor: 'pointer'
  }
};

export default AdminDashboard;