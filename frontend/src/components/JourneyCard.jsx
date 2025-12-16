import React, { useState } from 'react';
import { FaFilePdf } from 'react-icons/fa';

const statusLabels = {
  to_do: { label: 'À faire', color: '#666' },
  in_progress: { label: 'En cours', color: '#1a73e8' },
  finished: { label: 'Terminé', color: '#0f9d58' }
};

const statusTransitions = {
  to_do: ['in_progress'],
  in_progress: ['finished']
};

const JourneyCard = ({ journey, onStatusUpdate, onTrackingSave, onDelete, loading, viewType = 'admin' }) => {
  const [showStartForm, setShowStartForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [formData, setFormData] = useState({
    mileageStart: journey.mileageStart || '',
    mileageEnd: journey.mileageEnd || '',
    fuelVolume: '',
    notes: ''
  });

  const handleDownloadPDF = async () => {
    try {
      const token = localStorage.getItem('token');
      if (!token) {
        console.error('No authentication token found');
        return;
      }

      const response = await fetch(`/api/journeys/${journey._id}/pdf`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/pdf'
        }
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `trajet-${journey._id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Error downloading PDF:', error);
    }
  };

  const validateMileage = (name, value) => {
    if (value === '') return '';
    
    // parse number
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(numericValue)) return '';
    
    // check positive
    if (numericValue < 0) return '';
    
    // validate end > start
    if (name === 'mileageEnd' && formData.mileageStart) {
      const startMileage = parseFloat(formData.mileageStart);
      if (numericValue <= startMileage) {
        return startMileage + 1; // Auto-correct to be greater than start mileage
      }
    }
    
    return numericValue;
  };

  const validateFuelVolume = (value) => {
    if (value === '') return '';
    
    // parse number
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(numericValue)) return '';
    
    // validate fuel range
    return numericValue >= 0 && numericValue <= 1000 ? numericValue : '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
    // validate field
    if (name === 'mileageStart' || name === 'mileageEnd') {
      processedValue = validateMileage(name, value);
    } else if (name === 'fuelVolume') {
      processedValue = validateFuelVolume(value);
    }
    
    setFormData(prev => ({
      ...prev,
      [name]: processedValue
    }));
  };

  const handleStatusUpdate = async (newStatus) => {
    // validate fields
    if (newStatus === 'in_progress' && !formData.mileageStart) {
      alert('Veuillez entrer le kilométrage de départ avant de commencer le trajet.');
      return;
    }
    
    if (newStatus === 'finished' && (!formData.mileageEnd || !formData.fuelVolume)) {
      alert('Veuillez remplir tous les champs requis (kilométrage d\'arrivée et volume de carburant) avant de terminer le trajet.');
      return;
    }
    
    if (!window.confirm(`Voulez-vous vraiment marquer ce trajet comme "${statusLabels[newStatus].label}" ?`)) {
      return;
    }

    try {
      const payload = { status: newStatus };
      
      // update timestamps
      if (newStatus === 'in_progress') {
        payload.startDate = new Date().toISOString();
        if (formData.mileageStart) {
          payload.mileageStart = Number(formData.mileageStart);
        }
      } else if (newStatus === 'finished') {
        payload.endDate = new Date().toISOString();
        if (formData.mileageEnd) {
          payload.mileageEnd = Number(formData.mileageEnd);
        }
        if (formData.fuelVolume) {
          payload.fuelVolume = Number(formData.fuelVolume);
        }
        if (formData.notes) {
          payload.notes = formData.notes;
        }
      }
      
      await onStatusUpdate(journey._id, payload);
      
      // Reset forms
      setShowStartForm(false);
      setShowCompleteForm(false);
      
    } catch (error) {
      console.error('Error updating journey status:', error);
      alert(`Erreur lors de la mise à jour du statut: ${error.message}`);
    }
  };

  const renderStatusButtons = () => {
    const possibleNextStatuses = statusTransitions[journey.status] || [];
    
    return (
      <div style={styles.statusButtons}>
        {possibleNextStatuses.map(status => (
          <button
            key={status}
            style={{ ...styles.statusButton, backgroundColor: statusLabels[status].color }}
            onClick={() => handleStatusUpdate(status)}
          >
            Passer à {statusLabels[status].label}
          </button>
        ))}
      </div>
    );
  };

  const renderStatusForm = () => {
    if (journey.status === 'to_do' && !showStartForm) {
      return (
        <div style={styles.statusForm}>
          <button 
            onClick={() => setShowStartForm(true)}
            style={styles.toggleButton}
            disabled={loading}
          >
            {loading ? 'Chargement...' : 'Démarrer le trajet'}
          </button>
        </div>
      );
    }

    if (journey.status === 'in_progress' && !showCompleteForm) {
      return (
        <div style={styles.statusForm}>
          <button 
            onClick={() => setShowCompleteForm(true)}
            style={styles.toggleButton}
          >
            Terminer le trajet
          </button>
        </div>
      );
    }

    if (showStartForm) {
      return (
        <div style={styles.statusForm}>
          <h4>Démarrer le trajet</h4>
          <div style={styles.formGroup}>
            <label>Kilométrage de départ:</label>
            <input
              type="number"
              name="mileageStart"
              value={formData.mileageStart}
              onChange={handleInputChange}
              style={styles.input}
              required
            />
          </div>
          <div style={styles.formActions}>
            <button 
              type="button" 
              onClick={() => setShowStartForm(false)}
              style={styles.cancelButton}
            >
              Annuler
            </button>
            <button 
              type="button" 
              onClick={() => handleStatusUpdate('in_progress')}
              style={styles.submitButton}
              disabled={!formData.mileageStart}
            >
              Confirmer le départ
            </button>
          </div>
        </div>
      );
    }

    if (showCompleteForm) {
      return (
        <div style={styles.statusForm}>
          <h4>Terminer le trajet</h4>
          <div style={styles.formGroup}>
            <label>Kilométrage d'arrivée:</label>
            <input
              type="number"
              name="mileageEnd"
              value={formData.mileageEnd}
              onChange={handleInputChange}
              style={styles.input}
              min={journey.mileageStart}
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label>Volume de carburant consommé (L):</label>
            <input
              type="number"
              name="fuelVolume"
              value={formData.fuelVolume}
              onChange={handleInputChange}
              style={styles.input}
              min="0"
              step="0.1"
              required
            />
          </div>
          <div style={styles.formGroup}>
            <label>Notes:</label>
            <textarea
              name="notes"
              value={formData.notes}
              onChange={handleInputChange}
              style={styles.textarea}
              rows="3"
            />
          </div>
          <div style={styles.formActions}>
            <button 
              type="button" 
              onClick={() => setShowCompleteForm(false)}
              style={styles.cancelButton}
            >
              Annuler
            </button>
            <button 
              type="button" 
              onClick={() => handleStatusUpdate('finished')}
              style={styles.submitButton}
              disabled={!formData.mileageEnd || !formData.fuelVolume}
            >
              Confirmer l'arrivée
            </button>
          </div>
        </div>
      );
    }

    return null;
  };

  const handleCompleteTrip = async () => {
    try {
      const payload = {
        status: 'finished',
        endDate: new Date().toISOString(),
        mileageEnd: Number(formData.mileageEnd),
        fuelVolume: Number(formData.fuelVolume),
        remarks: formData.notes
      };
      
      await onTrackingSave(journey._id, payload);
      setShowCompleteForm(false);
      // reset form
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
          <small>Camion: {journey.truck?.licensePlate || 'N/A'} | Chauffeur: {journey.driver?.name}</small>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <span style={getStatusStyle(journey.status)}>
            {statusLabels[journey.status]?.label || journey.status}
          </span>
          <button 
            onClick={handleDownloadPDF}
            style={{
              background: 'none',
              border: 'none',
              color: '#e74c3c',
              cursor: 'pointer',
              fontSize: '1.1em',
              padding: '0 5px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '30px',
              height: '30px',
              borderRadius: '4px',
              transition: 'all 0.2s',
              '&:hover': {
                color: '#c0392b',
                transform: 'scale(1.1)'
              }
            }}
            title="Télécharger PDF"
            disabled={loading}
          >
            {loading ? '...' : <FaFilePdf />}
          </button>
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
              transition: 'all 0.2s',
              '&:hover': {
                color: '#a71d2a',
                transform: 'scale(1.1)'
              }
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
              onClick={() => handleStatusUpdate('in_progress')}
              style={{ ...styles.button, backgroundColor: '#1a73e8' }}
              disabled={!formData.mileageStart}
            >
              Confirmer le départ
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
              onClick={() => handleStatusUpdate('finished')}
              style={{ ...styles.button, backgroundColor: '#0f9d58' }}
              disabled={!formData.mileageEnd || !formData.fuelVolume}
            >
              Confirmer l'arrivée
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
    backgroundColor: '#ffffff',
    padding: '24px',
    borderRadius: '0px',
    marginBottom: '16px',
    position: 'relative',
    border: '2px solid #000000'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '20px',
    gap: '16px'
  },
  statusBadge: {
    padding: '6px 12px',
    borderRadius: '0px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    border: '2px solid #000000'
  },
  row: {
    display: 'flex',
    gap: '24px',
    marginBottom: '12px',
    flexWrap: 'wrap'
  },
  infoGroup: {
    flex: '1',
    minWidth: '200px'
  },
  label: {
    fontSize: '12px',
    color: '#000000',
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    marginBottom: '4px'
  },
  value: {
    fontSize: '15px',
    color: '#000000',
    fontWeight: '500'
  },
  actionButton: {
    display: 'block',
    width: '100%',
    padding: '12px 16px',
    margin: '12px 0',
    cursor: 'pointer',
    border: '2px solid #000000',
    borderRadius: '0px',
    fontSize: '14px',
    fontWeight: '500'
  },
  primaryButton: {
    backgroundColor: '#000000',
    color: '#ffffff',
    border: '2px solid #000000'
  },
  successButton: {
    backgroundColor: '#000000',
    color: '#ffffff',
    border: '2px solid #000000'
  },
  dangerButton: {
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '2px solid #000000'
  },
  secondaryButton: {
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '2px solid #000000'
  },
  downloadButton: {
    background: 'none',
    border: '2px solid #000000',
    color: '#000000',
    cursor: 'pointer',
    fontSize: '18px',
    padding: '8px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    width: '36px',
    height: '36px',
    borderRadius: '0px'
  },
  form: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '0px',
    marginTop: '16px',
    border: '2px solid #000000'
  },
  formGroup: {
    marginBottom: '16px'
  },
  input: {
    width: '100%',
    padding: '10px 14px',
    border: '2px solid #000000',
    borderRadius: '0px',
    fontSize: '14px',
    backgroundColor: '#ffffff'
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '20px'
  },
  button: {
    padding: '10px 16px',
    border: '2px solid #000000',
    borderRadius: '0px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    backgroundColor: '#000000',
    color: '#ffffff'
  },
  statusButtons: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px'
  },
  statusButton: {
    padding: '10px 16px',
    border: '2px solid #000000',
    borderRadius: '0px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    color: '#ffffff',
    backgroundColor: '#000000'
  },
  statusForm: {
    backgroundColor: '#ffffff',
    padding: '20px',
    borderRadius: '0px',
    marginTop: '16px',
    border: '2px solid #000000'
  },
  toggleButton: {
    padding: '12px 16px',
    border: '2px solid #000000',
    borderRadius: '0px',
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    backgroundColor: '#ffffff',
    color: '#000000'
  },
  summarySection: {
    marginTop: '20px',
    padding: '16px',
    backgroundColor: '#ffffff',
    borderRadius: '0px',
    border: '2px solid #000000'
  },
  summaryTitle: {
    fontSize: '14px',
    fontWeight: '600',
    color: '#000000',
    marginBottom: '12px'
  },
  summaryRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #000000',
    marginBottom: '12px'
  }
};

export default JourneyCard;


