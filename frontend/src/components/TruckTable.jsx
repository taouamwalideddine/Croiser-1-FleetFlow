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
  
  // Search and filter states
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

  // Filter and sort trucks
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
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
    marginBottom: '20px',
    overflow: 'hidden'
  },
  controlsContainer: {
    marginBottom: '16px',
    display: 'flex',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: '10px'
  },
  searchContainer: {
    display: 'flex',
    gap: '10px',
    flexWrap: 'wrap',
    alignItems: 'center',
    marginBottom: '16px',
    width: '100%'
  },
  searchInput: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    flex: '1',
    minWidth: '200px',
    fontSize: '14px'
  },
  filterSelect: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '4px',
    backgroundColor: 'white',
    cursor: 'pointer',
    fontSize: '14px',
    minWidth: '150px'
  },
  clearButton: {
    padding: '8px 12px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #ddd',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '14px',
    color: '#6c757d',
    transition: 'all 0.2s',
    ':hover': {
      backgroundColor: '#e9ecef',
      borderColor: '#ced4da'
    }
  },
  sortableHeader: {
    userSelect: 'none',
    ':hover': {
      backgroundColor: '#f8f9fa'
    }
  },
  resultsCount: {
    marginTop: '12px',
    fontSize: '14px',
    color: '#6c757d',
    textAlign: 'right',
    padding: '4px 8px'
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


