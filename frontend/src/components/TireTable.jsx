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
                  {t.assignedToType && (
                    <button style={styles.linkBtn} onClick={() => handleUnassign(t._id)}>Unassign</button>
                  )}
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
  card: { backgroundColor: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)', marginBottom: '24px' },
  cardHeader: { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' },
  badge: { backgroundColor: '#eef', color: '#334', padding: '4px 8px', borderRadius: '12px', fontSize: '12px' },
  error: { backgroundColor: '#fee', color: '#c33', padding: '10px', borderRadius: '6px', marginBottom: '10px' },
  success: { backgroundColor: '#e9f7ef', color: '#2f855a', padding: '10px', borderRadius: '6px', marginBottom: '10px' },
  form: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', marginBottom: '12px' },
  input: { padding: '10px', border: '1px solid #ddd', borderRadius: '6px' },
  inlineInput: { width: '80px', marginLeft: '6px', padding: '6px', border: '1px solid #ddd', borderRadius: '4px' },
  button: { padding: '10px 14px', backgroundColor: '#007bff', color: 'white', border: 'none', borderRadius: '6px', cursor: 'pointer' },
  table: { width: '100%', borderCollapse: 'collapse' },
  linkBtn: { background: 'none', border: 'none', color: '#007bff', cursor: 'pointer' }
};

export default TireTable;


