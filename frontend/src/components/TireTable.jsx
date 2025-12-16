import React, { useEffect, useState } from 'react';
import { tireAPI, truckAPI, trailerAPI } from '../services/api';

const defaultForm = { serialNumber: '', brand: '', size: '', treadDepth: 0 };

const TireTable = () => {
  const [tires, setTires] = useState([]);
  const [form, setForm] = useState(defaultForm);
  const [assignForm, setAssignForm] = useState({ tireId: '', assignedToType: 'truck', assignedToId: '', position: '', mileageAtInstall: '' });
  const [trucks, setTrucks] = useState([]);
  const [trailers, setTrailers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const loadData = async () => {
    try {
      setLoading(true);
      const res = await tireAPI.list();
      setTires(res.data || []);
      const truckRes = await truckAPI.list();
      setTrucks(truckRes.data || []);
      const trailerRes = await trailerAPI.list();
      setTrailers(trailerRes.data || []);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load tires');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreate = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await tireAPI.create({ ...form, treadDepth: Number(form.treadDepth || 0) });
      setForm(defaultForm);
      setSuccess('Tire created');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create tire');
    }
  };

  const handleAssign = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    try {
      await tireAPI.assign(assignForm.tireId, {
        assignedToType: assignForm.assignedToType,
        assignedToId: assignForm.assignedToId,
        position: assignForm.position,
        mileageAtInstall: assignForm.mileageAtInstall ? Number(assignForm.mileageAtInstall) : undefined
      });
      setAssignForm({ tireId: '', assignedToType: 'truck', assignedToId: '', position: '', mileageAtInstall: '' });
      setSuccess('Tire assigned');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign tire');
    }
  };

  const handleUnassign = async (id) => {
    setError('');
    setSuccess('');
    try {
      await tireAPI.unassign(id);
      setSuccess('Tire unassigned');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to unassign tire');
    }
  };

  const handleWearUpdate = async (id, treadDepth) => {
    setError('');
    setSuccess('');
    try {
      await tireAPI.updateWear(id, { treadDepth: Number(treadDepth) });
      setSuccess('Tread depth updated');
      loadData();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update tread depth');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this tire?')) return;
    
    try {
      setLoading(true);
      await tireAPI.remove(id);
      setTires(tires.filter(tire => tire._id !== id));
      setSuccess('Tire deleted successfully');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete tire');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h2>Tires</h2>
        {loading && <span style={styles.badge}>Loading...</span>}
      </div>
      {error && <div style={styles.error}>{error}</div>}
      {success && <div style={styles.success}>{success}</div>}

      <form onSubmit={handleCreate} style={styles.form}>
        <input style={styles.input} placeholder="Serial Number" value={form.serialNumber} onChange={(e) => setForm({ ...form, serialNumber: e.target.value })} required />
        <input style={styles.input} placeholder="Brand" value={form.brand} onChange={(e) => setForm({ ...form, brand: e.target.value })} />
        <input style={styles.input} placeholder="Size" value={form.size} onChange={(e) => setForm({ ...form, size: e.target.value })} />
        <input style={styles.input} type="number" placeholder="Tread depth (mm)" value={form.treadDepth} onChange={(e) => setForm({ ...form, treadDepth: e.target.value })} />
        <button style={styles.button} type="submit" disabled={loading}>Add Tire</button>
      </form>

      <h3 style={{ marginTop: '16px' }}>Assign Tire</h3>
      <form onSubmit={handleAssign} style={styles.form}>
        <select style={styles.input} value={assignForm.tireId} onChange={(e) => setAssignForm({ ...assignForm, tireId: e.target.value })} required>
          <option value="">Select tire</option>
          {tires.filter(t => t.status !== 'retired').map((t) => (
            <option key={t._id} value={t._id}>{t.serialNumber} ({t.status})</option>
          ))}
        </select>
        <select style={styles.input} value={assignForm.assignedToType} onChange={(e) => setAssignForm({ ...assignForm, assignedToType: e.target.value })}>
          <option value="truck">Truck</option>
          <option value="trailer">Trailer</option>
        </select>
        <select style={styles.input} value={assignForm.assignedToId} onChange={(e) => setAssignForm({ ...assignForm, assignedToId: e.target.value })} required>
          <option value="">Select vehicle</option>
          {assignForm.assignedToType === 'truck'
            ? trucks.map((t) => <option key={t._id} value={t._id}>{t.licensePlate}</option>)
            : trailers.map((t) => <option key={t._id} value={t._id}>{t.licensePlate}</option>)
          }
        </select>
        <input style={styles.input} placeholder="Position (e.g., FL, FR, RL1)" value={assignForm.position} onChange={(e) => setAssignForm({ ...assignForm, position: e.target.value })} required />
        <input style={styles.input} type="number" placeholder="Mileage at install" value={assignForm.mileageAtInstall} onChange={(e) => setAssignForm({ ...assignForm, mileageAtInstall: e.target.value })} />
        <button style={styles.button} type="submit" disabled={loading}>Assign</button>
      </form>

      <div style={{ overflowX: 'auto', marginTop: '12px' }}>
        <table style={styles.table}>
          <thead>
            <tr>
              <th>Serial</th>
              <th>Brand</th>
              <th>Size</th>
              <th>Status</th>
              <th>Tread</th>
              <th>Mounted On</th>
              <th>Position</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {tires.map((t) => (
              <tr key={t._id}>
                <td>{t.serialNumber}</td>
                <td>{t.brand || '-'}</td>
                <td>{t.size || '-'}</td>
                <td>{t.status}</td>
                <td>
                  {t.treadDepth ?? '-'}
                  <input
                    type="number"
                    style={styles.inlineInput}
                    placeholder="mm"
                    onBlur={(e) => e.target.value && handleWearUpdate(t._id, e.target.value)}
                  />
                </td>
                <td>
                  {t.assignedToType ? `${t.assignedToType} ${t.assignedToId}` : '—'}
                </td>
                <td>{t.position || '—'}</td>
                <td>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    {t.assignedToType && (
                      <button style={styles.linkBtn} onClick={() => handleUnassign(t._id)}>Unassign</button>
                    )}
                    <button 
                      style={{ ...styles.linkBtn, color: '#dc3545' }} 
                      onClick={() => handleDelete(t._id)}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {tires.length === 0 && (
              <tr>
                <td colSpan="8" style={{ textAlign: 'center', padding: '12px' }}>No tires</td>
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
    backgroundColor: '#ffffff', 
    padding: '24px', 
    borderRadius: '0px', 
    border: '2px solid #000000', 
    marginBottom: '24px' 
  },
  cardHeader: { 
    display: 'flex', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: '20px',
    borderBottom: '2px solid #000000',
    paddingBottom: '12px'
  },
  badge: { 
    backgroundColor: '#ffffff', 
    color: '#000000', 
    padding: '4px 12px', 
    borderRadius: '0px', 
    fontSize: '12px',
    border: '2px solid #000000',
    fontWeight: '500'
  },
  error: { 
    backgroundColor: '#ffffff', 
    color: '#000000', 
    padding: '12px', 
    borderRadius: '0px', 
    marginBottom: '16px',
    border: '2px solid #000000'
  },
  success: { 
    backgroundColor: '#ffffff', 
    color: '#000000', 
    padding: '12px', 
    borderRadius: '0px', 
    marginBottom: '16px',
    border: '2px solid #000000'
  },
  form: { 
    display: 'grid', 
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
    gap: '16px', 
    marginBottom: '20px' 
  },
  input: { 
    padding: '12px 16px', 
    border: '2px solid #000000', 
    borderRadius: '0px',
    backgroundColor: '#ffffff',
    fontSize: '14px'
  },
  inlineInput: { 
    width: '100px', 
    marginLeft: '8px', 
    padding: '8px 12px', 
    border: '2px solid #000000', 
    borderRadius: '0px',
    backgroundColor: '#ffffff'
  },
  button: { 
    padding: '12px 20px', 
    backgroundColor: '#000000', 
    color: '#ffffff', 
    border: '2px solid #000000', 
    borderRadius: '0px', 
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  table: { 
    width: '100%', 
    borderCollapse: 'collapse',
    border: '2px solid #000000',
    marginTop: '16px'
  },
  linkBtn: { 
    background: 'none', 
    border: '2px solid #000000', 
    color: '#000000', 
    cursor: 'pointer',
    padding: '6px 12px',
    borderRadius: '0px',
    margin: '0 4px',
    fontSize: '13px',
    fontWeight: '500'
  },
  th: {
    backgroundColor: '#000000',
    color: '#ffffff',
    textAlign: 'left',
    padding: '12px 16px',
    borderBottom: '2px solid #000000',
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: '12px',
    letterSpacing: '0.5px'
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #000000',
    verticalAlign: 'top'
  },
  tr: {
    backgroundColor: '#ffffff',
    '&:hover': {
      backgroundColor: '#f9f9f9'
    }
  },
  select: {
    padding: '10px 12px',
    border: '2px solid #000000',
    borderRadius: '0px',
    backgroundColor: '#ffffff',
    width: '100%',
    fontSize: '14px',
    cursor: 'pointer'
  },
  actionCell: {
    whiteSpace: 'nowrap',
    textAlign: 'right'
  },
  formGroup: {
    marginBottom: '16px'
  },
  formLabel: {
    display: 'block',
    marginBottom: '8px',
    fontSize: '14px',
    fontWeight: '500'
  },
  formActions: {
    display: 'flex',
    justifyContent: 'flex-end',
    gap: '12px',
    marginTop: '20px'
  },
  secondaryButton: {
    padding: '12px 20px',
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '2px solid #000000',
    borderRadius: '0px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  tableContainer: {
    overflowX: 'auto',
    marginTop: '20px'
  },
  loading: {
    padding: '20px',
    textAlign: 'center',
    color: '#000000'
  }
};

export default TireTable;


