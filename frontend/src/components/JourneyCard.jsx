import React, { useState } from 'react';

const statusLabels = {
  to_do: { label: 'To Do', color: '#666' },
  in_progress: { label: 'In Progress', color: '#1a73e8' },
  finished: { label: 'Completed', color: '#0f9d58' }
};

const JourneyCard = ({ journey, onStatusChange, onTrackingSave, onDelete }) => {
  const [showStartForm, setShowStartForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [formData, setFormData] = useState({
    mileageStart: journey.mileageStart || '',
    mileageEnd: journey.mileageEnd || '',
    fuelVolume: '',
    notes: ''
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleStartTrip = async () => {
    try {
      const payload = {
        status: 'in_progress',
        startDate: new Date().toISOString(),
        mileageStart: Number(formData.mileageStart),
        // Include the status in the tracking update
        status: 'in_progress'
      };
      
      await onTrackingSave(journey._id, payload);
      setShowStartForm(false);
      // Reset form data
      setFormData(prev => ({
        ...prev,
        mileageStart: payload.mileageStart
      }));
    } catch (error) {
      console.error('Error starting trip:', error);
    }
  };

  const handleCompleteTrip = async () => {
    try {
      const payload = {
        status: 'finished',
        endDate: new Date().toISOString(),
        mileageEnd: Number(formData.mileageEnd),
        fuelVolume: Number(formData.fuelVolume),
        remarks: formData.notes,
        // Include the status in the tracking update
        status: 'finished'
      };
      
      await onTrackingSave(journey._id, payload);
      setShowCompleteForm(false);
      // Reset form data
      setFormData({
        mileageStart: journey.mileageStart || '',
        mileageEnd: '',
        fuelVolume: '',
        notes: ''
      });
    } catch (error) {
      console.error('Error completing trip:', error);
    }
  };

  const getStatusStyle = (status) => ({
    ...styles.status,
    backgroundColor: statusLabels[status]?.color || '#666',
    color: 'white',
    padding: '4px 12px',
    borderRadius: '12px',
    fontSize: '0.75rem',
    fontWeight: '600',
    textTransform: 'uppercase',
    whiteSpace: 'nowrap'
  });

  const renderTripSummary = () => {
    if (journey.status !== 'finished') return null;
    
    const distance = journey.mileageEnd - journey.mileageStart;
    const fuelEfficiency = journey.fuelVolume > 0 ? (distance / journey.fuelVolume).toFixed(2) : 0;
    
    return (
      <div style={styles.summary}>
        <h4>Trip Summary</h4>
        <div style={styles.summaryGrid}>
          <div>Distance:</div><div>{distance} km</div>
          <div>Fuel Used:</div><div>{journey.fuelVolume} L</div>
          <div>Efficiency:</div><div>{fuelEfficiency} km/L</div>
          {journey.notes && <div>Notes:</div>}
          {journey.notes && <div>{journey.notes}</div>}
        </div>
      </div>
    );
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h3 style={{ margin: 0 }}>{journey.origin} → {journey.destination}</h3>
          <small>Truck: {journey.truck?.licensePlate || 'N/A'} | Driver: {journey.driver?.name}</small>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={getStatusStyle(journey.status)}>
            {statusLabels[journey.status]?.label || journey.status}
          </span>
          <button 
            onClick={() => onDelete && onDelete(journey._id)}
            style={{
              background: 'none',
              border: 'none',
              color: '#dc3545',
              cursor: 'pointer',
              fontSize: '1.1em',
              padding: '0 5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: '4px',
              transition: 'background-color 0.2s'
            }}
            onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#ffebee'}
            onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
            title="Delete Journey"
          >
            🗑️
          </button>
        </div>
      </div>

      <div style={styles.row}>
        <div><strong>Start:</strong> {journey.startDate ? new Date(journey.startDate).toLocaleString() : '—'}</div>
        <div><strong>End:</strong> {journey.endDate ? new Date(journey.endDate).toLocaleString() : '—'}</div>
      </div>

      {journey.mileageStart > 0 && (
        <div style={styles.row}>
          <div><strong>Start Mileage:</strong> {journey.mileageStart.toLocaleString()} km</div>
          {journey.mileageEnd > 0 && (
            <div><strong>End Mileage:</strong> {journey.mileageEnd.toLocaleString()} km</div>
          )}
        </div>
      )}

      {journey.status === 'to_do' && !showStartForm && (
        <button 
          style={styles.actionButton}
          onClick={() => setShowStartForm(true)}
        >
          Start Trip
        </button>
      )}

      {showStartForm && (
        <div style={styles.formContainer}>
          <h4>Start Trip</h4>
          <div style={styles.formGroup}>
            <label>Current Mileage (km):</label>
            <input
              type="number"
              name="mileageStart"
              value={formData.mileageStart}
              onChange={handleInputChange}
              style={styles.input}
              required
              min={journey.truck?.currentMileage || 0}
            />
          </div>
          <div style={styles.buttonGroup}>
            <button 
              type="button" 
              onClick={handleStartTrip}
              style={{ ...styles.button, backgroundColor: '#1a73e8' }}
              disabled={!formData.mileageStart}
            >
              Confirm Start
            </button>
            <button 
              type="button" 
              onClick={() => setShowStartForm(false)}
              style={{ ...styles.button, backgroundColor: '#f1f1f1', color: '#333' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {journey.status === 'in_progress' && !showCompleteForm && (
        <button 
          style={styles.actionButton}
          onClick={() => setShowCompleteForm(true)}
        >
          Complete Trip
        </button>
      )}

      {showCompleteForm && (
        <div style={styles.formContainer}>
          <h4>Complete Trip</h4>
          <div style={styles.formGroup}>
            <label>End Mileage (km):</label>
            <input
              type="number"
              name="mileageEnd"
              value={formData.mileageEnd}
              onChange={handleInputChange}
              style={styles.input}
              required
              min={journey.mileageStart || 0}
            />
          </div>
          <div style={styles.formGroup}>
            <label>Fuel Used (L):</label>
            <input
              type="number"
              name="fuelVolume"
              value={formData.fuelVolume}
              onChange={handleInputChange}
              style={styles.input}
              required
              min="0.1"
              step="0.1"
            />
          </div>
          <div style={styles.formGroup}>
            <label>Notes:</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              style={{ ...styles.input, minHeight: '60px' }}
              placeholder="Any issues or observations..."
            />
          </div>
          <div style={styles.buttonGroup}>
            <button 
              type="button" 
              onClick={handleCompleteTrip}
              style={{ ...styles.button, backgroundColor: '#0f9d58' }}
              disabled={!formData.mileageEnd || !formData.fuelVolume}
            >
              Complete Trip
            </button>
            <button 
              type="button" 
              onClick={() => setShowCompleteForm(false)}
              style={{ ...styles.button, backgroundColor: '#f1f1f1', color: '#333' }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {renderTripSummary()}
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    padding: '20px',
    borderRadius: '8px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    marginBottom: '16px',
    borderLeft: '4px solid #1a73e8'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '16px',
    gap: '12px'
  },
  status: {
    background: '#eef',
    color: '#334',
    padding: '4px 8px',
    borderRadius: '8px',
    fontSize: '12px'
  },
  row: {
    display: 'flex',
    gap: '16px',
    marginBottom: '10px'
  },
  actionButton: {
    display: 'block',
    width: '100%',
    padding: '10px',
    margin: '12px 0',
    cursor: 'pointer'
  },
  btnPrimary: {
    padding: '10px 12px',
    border: 'none',
    borderRadius: '6px',
    backgroundColor: '#007bff',
    color: 'white',
    cursor: 'pointer'
  },
  form: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
    gap: '8px',
    marginTop: '10px'
  },
  input: {
    padding: '8px',
    border: '1px solid #ddd',
    borderRadius: '6px'
  }
};

export default JourneyCard;


