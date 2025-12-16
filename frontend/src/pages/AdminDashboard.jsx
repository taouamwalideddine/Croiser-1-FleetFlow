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
      // count active journeys
      const activeJourneys = journeys.filter(j => 
        j.status === 'in_progress' || j.status === 'loading' || j.status === 'in_transit'
      ).length;

      // count available trucks
      const availableTrucks = trucks.filter(t => t.status === 'available').length;

      // count maintenance alerts
      const activeAlerts = upcoming.length;

      // sum completed distances
      const totalDistance = journeys
        .filter(j => j.status === 'completed' && j.distance)
        .reduce((sum, j) => sum + j.distance, 0);

      setMetrics({
        activeJourneys,
        availableTrucks,
        activeAlerts,
        totalDistance: Math.round(totalDistance * 100) / 100 // round to 2 decimals
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
        
        // load data
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
      
      // get status
      const { status, ...trackingData } = payload;
      
      // update status
      if (status) {
        // set update data
        const updateData = { status, ...trackingData };
        
        // update tracking
        await journeyAPI.updateTracking(journeyId, updateData);
      } else {
        // update tracking only
        await journeyAPI.updateTracking(journeyId, trackingData);
      }
      
      // refresh list
      await loadJourneys();
      toast.success('Trajet mis à jour avec succès');
      
    } catch (err) {
      console.error('Error updating journey:', err);
      const errorMessage = err.response?.data?.message || 
                         err.response?.data?.error || 
                         'Erreur lors de la mise à jour du trajet';
      setError(errorMessage);
      toast.error(errorMessage);
      throw err; // rethrow
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
      
      // reset form
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
        <h1 style={styles.headerTitle}>Admin Dashboard</h1>
        <button onClick={logout} style={styles.logoutButton}>Logout</button>
      </header>

      <main style={styles.main}>
        {error && <div style={styles.error}>{error}</div>}
        {isLoading && <div style={styles.loading}>Loading...</div>}
        
        {/* Metrics Section */}
        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Overview</h2>
          <div style={styles.metricsContainer}>
            <div style={{...styles.metricCard, backgroundColor: '#ffffff', color: '#000000', border: '2px solid #000000'}}>
              <div style={styles.metricValue}>{metrics.activeJourneys}</div>
              <div style={{...styles.metricLabel, color: '#000000'}}>Active Journeys</div>
            </div>
            <div style={{...styles.metricCard, backgroundColor: '#ffffff', color: '#000000', border: '2px solid #000000'}}>
              <div style={styles.metricValue}>{metrics.availableTrucks}</div>
              <div style={{...styles.metricLabel, color: '#000000'}}>Available Trucks</div>
            </div>
            <div style={{...styles.metricCard, backgroundColor: '#ffffff', color: '#000000', border: '2px solid #000000'}}>
              <div style={styles.metricValue}>{metrics.activeAlerts}</div>
              <div style={{...styles.metricLabel, color: '#000000'}}>Active Alerts</div>
            </div>
            <div style={{...styles.metricCard, backgroundColor: '#000000', color: '#ffffff', border: '2px solid #000000'}}>
              <div style={styles.metricValue}>{metrics.totalDistance} km</div>
              <div style={{...styles.metricLabel, color: '#ffffff'}}>Total Distance</div>
            </div>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Create Journey</h2>
          <form onSubmit={handleCreateJourney} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Driver:</label>
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
              <label style={styles.label}>Truck:</label>
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
              <label style={styles.label}>Trailer (optional):</label>
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
            <div style={styles.formGroup}>
              <label style={styles.label}>Origin:</label>
              <input
                style={styles.input}
                placeholder="Enter origin"
                value={journeyForm.origin}
                onChange={(e) => setJourneyForm({ ...journeyForm, origin: e.target.value })}
                required
              />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Destination:</label>
              <input
                style={styles.input}
                placeholder="Enter destination"
                value={journeyForm.destination}
                onChange={(e) => setJourneyForm({ ...journeyForm, destination: e.target.value })}
                required
              />
            </div>
            <button style={styles.primaryButton} type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Create Journey'}
            </button>
          </form>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Fleet Management</h2>
          <TruckTable onDeleteTruck={handleDeleteTruck} isDeleting={isDeleting} />
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Tire Management</h2>
          <TireTable />
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Maintenance Rules</h2>
          <form onSubmit={handleCreateRule} style={styles.form}>
            <div style={styles.formGroup}>
              <label style={styles.label}>Rule Name:</label>
              <input style={styles.input} placeholder="Enter rule name" value={ruleForm.name} onChange={(e) => setRuleForm({ ...ruleForm, name: e.target.value })} required />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Type:</label>
              <select style={styles.select} value={ruleForm.type} onChange={(e) => setRuleForm({ ...ruleForm, type: e.target.value })}>
                <option value="tire">Tire</option>
                <option value="oil">Oil</option>
                <option value="revision">Revision</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Applies To:</label>
              <select style={styles.select} value={ruleForm.appliesTo} onChange={(e) => setRuleForm({ ...ruleForm, appliesTo: e.target.value })}>
                <option value="all">All</option>
                <option value="truck">Truck</option>
                <option value="trailer">Trailer</option>
              </select>
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Threshold (km):</label>
              <input style={styles.input} type="number" placeholder="Enter threshold km" value={ruleForm.thresholdKm} onChange={(e) => setRuleForm({ ...ruleForm, thresholdKm: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Threshold (days):</label>
              <input style={styles.input} type="number" placeholder="Enter threshold days" value={ruleForm.thresholdDays} onChange={(e) => setRuleForm({ ...ruleForm, thresholdDays: e.target.value })} />
            </div>
            <div style={styles.formGroup}>
              <label style={styles.label}>Notes:</label>
              <input style={styles.input} placeholder="Enter notes" value={ruleForm.notes} onChange={(e) => setRuleForm({ ...ruleForm, notes: e.target.value })} />
            </div>
            <button style={styles.primaryButton} type="submit" disabled={loading}>Add Rule</button>
          </form>
          <div style={{ overflowX: 'auto', marginTop: '24px' }}>
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
                  <th style={styles.tableHeader}>Asset</th>
                  <th style={styles.tableHeader}>Rule</th>
                  <th style={styles.tableHeader}>Type</th>
                  <th style={styles.tableHeader}>Due date</th>
                  <th style={styles.tableHeader}>Due km</th>
                  <th style={styles.tableHeader}>Status</th>
                </tr>
              </thead>
              <tbody>
                {upcoming.map((a, idx) => (
                  <tr key={idx}>
                    <td style={styles.tableCell}>{a.assetType} {a.assetId}</td>
                    <td style={styles.tableCell}>{a.rule}</td>
                    <td style={styles.tableCell}>{a.type}</td>
                    <td style={styles.tableCell}>{a.dueByDate ? new Date(a.dueByDate).toLocaleDateString() : '—'}</td>
                    <td style={styles.tableCell}>{a.dueByKm ?? '—'}</td>
                    <td style={styles.tableCell}>
                      <span style={{
                        padding: '4px 8px',
                        borderRadius: '4px',
                        fontSize: '12px',
                        fontWeight: '500',
                        backgroundColor: a.status === 'overdue' ? '#fef2f2' : '#f0f9ff',
                        color: a.status === 'overdue' ? '#dc2626' : '#0369a1'
                      }}>
                        {a.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {upcoming.length === 0 && (
                  <tr>
                    <td colSpan="6" style={{ ...styles.tableCell, textAlign: 'center', color: '#64748b' }}>
                      No alerts
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Reports</h2>
          {report ? (
            <div style={styles.reportGrid}>
              <div style={styles.reportCard}>
                <div style={styles.reportLabel}>Total journeys</div>
                <div style={styles.reportValue}>{report.journeysCount}</div>
              </div>
              <div style={styles.reportCard}>
                <div style={styles.reportLabel}>Total mileage</div>
                <div style={styles.reportValue}>{report.totalMileage || 0} km</div>
              </div>
              <div style={styles.reportCard}>
                <div style={styles.reportLabel}>Total fuel</div>
                <div style={styles.reportValue}>{report.totalFuel || 0} L</div>
              </div>
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No report data available
            </div>
          )}
        </section>

        <section style={styles.section}>
          <h2 style={styles.sectionTitle}>Active Journeys</h2>
          {journeys.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {journeys.map((j) => (
                <JourneyCard
                  key={j._id}
                  journey={j}
                  onStatusUpdate={handleStatusUpdate}
                  onTrackingSave={handleTrackingSave}
                  onDelete={handleDeleteJourney}
                  loading={loading}
                />
              ))}
            </div>
          ) : (
            <div style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>
              No journeys yet
            </div>
          )}
        </section>
      </main>
    </div>
  );
};

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#ffffff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif'
  },
  metricsContainer: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
    gap: '24px',
    marginBottom: '40px'
  },
  metricCard: {
    padding: '24px',
    borderRadius: '0px',
    position: 'relative',
    transition: 'all 0.2s ease',
    '&:hover': {
      transform: 'translateY(-2px)'
    }
  },
  metricValue: {
    fontSize: '36px',
    fontWeight: '700',
    marginBottom: '8px',
    position: 'relative',
    fontFamily: '"Roboto Mono", monospace'
  },
  metricLabel: {
    fontSize: '12px',
    textTransform: 'uppercase',
    letterSpacing: '1.5px',
    fontWeight: '600',
    position: 'relative',
    fontFamily: '"Roboto", sans-serif'
  },
  header: {
    backgroundColor: '#ffffff',
    padding: '24px 40px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderBottom: '2px solid #000000'
  },
  headerTitle: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#000000',
    margin: 0
  },
  userInfo: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  logoutButton: {
    padding: '10px 20px',
    backgroundColor: '#000000',
    color: 'white',
    border: '2px solid #000000',
    borderRadius: '0px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500'
  },
  main: {
    padding: '40px',
    maxWidth: '1400px',
    margin: '0 auto'
  },
  section: {
    backgroundColor: '#ffffff',
    borderRadius: '0px',
    padding: '32px',
    marginBottom: '32px',
    border: '2px solid #000000'
  },
  sectionTitle: {
    fontSize: '20px',
    fontWeight: '600',
    color: '#000000',
    marginBottom: '24px',
    paddingBottom: '12px',
    borderBottom: '2px solid #000000'
  },
  error: {
    backgroundColor: '#ffffff',
    color: '#000000',
    padding: '16px',
    borderRadius: '0px',
    marginBottom: '24px',
    border: '2px solid #000000',
    fontSize: '14px'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    padding: '40px',
    color: '#000000'
  },
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '20px',
    maxWidth: '700px',
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '0px',
    border: '2px solid #000000'
  },
  input: {
    padding: '12px 16px',
    border: '2px solid #000000',
    borderRadius: '0px',
    fontSize: '15px',
    width: '100%',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff'
  },
  primaryButton: {
    padding: '12px 24px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: '2px solid #000000',
    borderRadius: '0px',
    cursor: 'pointer',
    fontSize: '15px',
    fontWeight: '600'
  },
  primaryButtonDisabled: {
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '2px solid #000000',
    cursor: 'not-allowed'
  },
  formGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px'
  },
  label: {
    fontSize: '14px',
    fontWeight: '500',
    color: '#000000'
  },
  select: {
    padding: '12px 16px',
    border: '2px solid #000000',
    borderRadius: '0px',
    fontSize: '15px',
    width: '100%',
    backgroundColor: '#ffffff',
    cursor: 'pointer'
  },
  reportGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '16px',
    marginBottom: '24px'
  },
  reportCard: {
    backgroundColor: '#ffffff',
    borderRadius: '0px',
    padding: '24px',
    border: '2px solid #000000',
    textAlign: 'center'
  },
  reportLabel: {
    fontSize: '14px',
    color: '#000000',
    marginBottom: '8px',
    fontWeight: '500'
  },
  reportValue: {
    fontSize: '28px',
    fontWeight: '700',
    color: '#000000'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    backgroundColor: '#ffffff',
    borderRadius: '0px',
    overflow: 'hidden',
    border: '2px solid #000000'
  },
  tableHeader: {
    padding: '16px',
    backgroundColor: '#000000',
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'left',
    borderBottom: '2px solid #000000',
    fontSize: '14px',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tableCell: {
    padding: '16px',
    borderBottom: '1px solid #000000',
    fontSize: '14px',
    color: '#000000'
  }
};

export default AdminDashboard;