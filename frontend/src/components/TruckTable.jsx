import React, { useEffect, useState } from 'react';
import { truckAPI } from '../services/api';

const defaultForm = {
  licensePlate: '',
  model: '',
  capacity: '',
  status: 'available'
};

const TruckTable = () => {
  const [trucks, setTrucks] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const loadTrucks = async () => {
    try {
      setLoading(true);
      const response = await truckAPI.list();
      setTrucks(response.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load trucks');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTrucks();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    try {
      setLoading(true);
      await truckAPI.create({
        ...form,
        capacity: Number(form.capacity || 0)
      });
      setForm(defaultForm);
      await loadTrucks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create truck');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this truck?')) {
      return;
    }
    
    try {
      setLoading(true);
      await truckAPI.remove(id);
      await loadTrucks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete truck');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h2>Trucks</h2>
        {loading && <span style={styles.badge}>Loading...</span>}
      </div>
      {error && <div style={styles.error}>{error}</div>}

      <form onSubmit={handleCreate} style={styles.form}>
        <input
          style={styles.input}
          placeholder="License Plate"
          value={form.licensePlate}
          onChange={(e) => setForm({ ...form, licensePlate: e.target.value })}
          required
        />
        <input
          style={styles.input}
          placeholder="Model"
          value={form.model}
          onChange={(e) => setForm({ ...form, model: e.target.value })}
          required
        />
        <input
          style={styles.input}
          placeholder="Capacity (kg)"
          type="number"
          value={form.capacity}
          onChange={(e) => setForm({ ...form, capacity: e.target.value })}
        />
        <select
          style={styles.select}
          value={form.status}
          onChange={(e) => setForm({ ...form, status: e.target.value })}
        >
          <option value="available">Available</option>
          <option value="maintenance">Maintenance</option>
          <option value="assigned">Assigned</option>
        </select>
        <button style={styles.button} type="submit" disabled={loading}>
          Add Truck
        </button>
      </form>

      <div style={{ overflowX: 'auto' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Plate</th>
              <th>Model</th>
              <th>Capacity</th>
              <th>Status</th>
              <th>Mileage</th>
              <th>Fuel</th>
              <th>Tires</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {trucks.map((t) => (
              <tr key={t._id}>
                <td>{t.licensePlate}</td>
                <td>{t.model}</td>
                <td>{t.capacity ?? '-'}</td>
                <td>{t.status}</td>
                <td>{t.mileage ?? 0}</td>
                <td>{t.fuelLevel ?? 0}</td>
                <td>{t.tireStatus ?? '-'}</td>
                <td>
                  <button 
                    onClick={() => handleDelete(t._id)} 
                    style={{...styles.button, backgroundColor: '#dc3545'}}
                    disabled={loading}
                  >
                    Delete
                  </button>
                </td>
              </tr>
            ))}
            {trucks.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '12px' }}>
                  No trucks yet
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.05)',
    marginBottom: '24px'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '12px'
  },
  badge: {
    backgroundColor: '#eef',
    color: '#334',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '12px'
  },
  error: {
    backgroundColor: '#fee',
    color: '#c33',
    padding: '10px',
    borderRadius: '6px',
    marginBottom: '10px'
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
  select: {
    padding: '10px',
    border: '1px solid #ddd',
    borderRadius: '6px'
  },
  button: {
    padding: '10px 14px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse'
  },
  th: {
    textAlign: 'left'
  }
};

export default TruckTable;


