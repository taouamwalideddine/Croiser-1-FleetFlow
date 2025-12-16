import React, { useEffect, useState, useMemo } from 'react';
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
  
  // filter state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortConfig, setSortConfig] = useState({ key: 'licensePlate', direction: 'asc' });

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

  // filter trucks
  const filteredTrucks = useMemo(() => {
    return trucks.filter(truck => {
      const matchesSearch = searchTerm === '' || 
        truck.licensePlate.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (truck.model && truck.model.toLowerCase().includes(searchTerm.toLowerCase()));
      
      const matchesStatus = statusFilter === 'all' || truck.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    }).sort((a, b) => {
      if (a[sortConfig.key] < b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? -1 : 1;
      }
      if (a[sortConfig.key] > b[sortConfig.key]) {
        return sortConfig.direction === 'asc' ? 1 : -1;
      }
      return 0;
    });
  }, [trucks, searchTerm, statusFilter, sortConfig]);

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const getSortIndicator = (key) => {
    if (sortConfig.key !== key) return null;
    return sortConfig.direction === 'asc' ? ' ↑' : ' ↓';
  };

  const clearFilters = () => {
    setSearchTerm('');
    setStatusFilter('all');
  };

  return (
    <div style={styles.card}>
      <div style={styles.cardHeader}>
        <h2>Trucks</h2>
        {loading && <span style={styles.badge}>Loading...</span>}
      </div>
      
      {/* Search and Filter Controls */}
      <div style={styles.controlsContainer}>
        <div style={styles.searchContainer}>
          <input
            type="text"
            placeholder="Search by plate or model..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={styles.searchInput}
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            style={styles.filterSelect}
          >
            <option value="all">All Statuses</option>
            <option value="available">Available</option>
            <option value="in_use">In Use</option>
            <option value="maintenance">Maintenance</option>
          </select>
          {(searchTerm || statusFilter !== 'all') && (
            <button 
              onClick={clearFilters}
              style={styles.clearButton}
              title="Clear all filters"
            >
              Clear Filters
            </button>
          )}
        </div>
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
              <th 
                onClick={() => requestSort('licensePlate')}
                style={{...styles.sortableHeader, cursor: 'pointer'}}
              >
                License Plate{getSortIndicator('licensePlate')}
              </th>
              <th 
                onClick={() => requestSort('model')}
                style={{...styles.sortableHeader, cursor: 'pointer'}}
              >
                Model{getSortIndicator('model')}
              </th>
              <th 
                onClick={() => requestSort('capacity')}
                style={{...styles.sortableHeader, cursor: 'pointer'}}
              >
                Capacity (kg){getSortIndicator('capacity')}
              </th>
              <th 
                onClick={() => requestSort('status')}
                style={{...styles.sortableHeader, cursor: 'pointer'}}
              >
                Status{getSortIndicator('status')}
              </th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredTrucks.length === 0 ? (
              <tr>
                <td colSpan="5" style={{ textAlign: 'center', padding: '20px' }}>
                  {loading ? 'Loading...' : 'No trucks found matching your criteria'}
                </td>
              </tr>
            ) : (
              filteredTrucks.map((truck) => (
                <tr key={truck._id}>
                  <td>{truck.licensePlate}</td>
                  <td>{truck.model}</td>
                  <td>{truck.capacity ?? '-'}</td>
                  <td>{truck.status}</td>
                  <td>
                    <button 
                      onClick={() => handleDelete(truck._id)} 
                      style={{...styles.button, backgroundColor: '#dc3545'}}
                      disabled={loading}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
        <div style={styles.resultsCount}>
          Showing {filteredTrucks.length} of {trucks.length} trucks
        </div>
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
    marginBottom: '24px',
    overflow: 'hidden'
  },
  controlsContainer: {
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '16px',
    borderBottom: '2px solid #000000',
    paddingBottom: '16px'
  },
  searchContainer: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: '20px',
    width: '100%'
  },
  searchInput: {
    padding: '12px 16px',
    border: '2px solid #000000',
    borderRadius: '0px',
    flex: '1',
    minWidth: '200px',
    fontSize: '14px',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  filterSelect: {
    padding: '12px 16px',
    border: '2px solid #000000',
    borderRadius: '0px',
    backgroundColor: '#ffffff',
    cursor: 'pointer',
    fontSize: '14px',
    minWidth: '180px',
    color: '#000000'
  },
  clearButton: {
    padding: '12px 20px',
    backgroundColor: '#ffffff',
    border: '2px solid #000000',
    borderRadius: '0px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#000000',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px'
  },
  sortableHeader: {
    userSelect: 'none',
    cursor: 'pointer',
    '&:hover': {
      backgroundColor: '#f9f9f9'
    }
  },
  resultsCount: {
    marginTop: '16px',
    fontSize: '14px',
    color: '#000000',
    textAlign: 'right',
    padding: '8px',
    fontWeight: '500'
  },
  cardHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    paddingBottom: '12px',
    borderBottom: '2px solid #000000'
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
    fontSize: '14px',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  select: {
    padding: '12px 16px',
    border: '2px solid #000000',
    borderRadius: '0px',
    backgroundColor: '#ffffff',
    color: '#000000',
    fontSize: '14px',
    cursor: 'pointer'
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
  th: {
    backgroundColor: '#000000',
    color: '#ffffff',
    textAlign: 'left',
    padding: '12px 16px',
    borderBottom: '2px solid #000000',
    fontWeight: '600',
    textTransform: 'uppercase',
    fontSize: '12px',
    letterSpacing: '0.5px',
    '&:hover': {
      backgroundColor: '#000000'
    }
  },
  td: {
    padding: '12px 16px',
    borderBottom: '1px solid #000000',
    verticalAlign: 'top',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  tr: {
    '&:hover': {
      backgroundColor: '#f9f9f9'
    }
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
    fontWeight: '500',
    color: '#000000'
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

export default TruckTable;


