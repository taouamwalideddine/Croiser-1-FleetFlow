import React, { useState } from 'react';

const statusLabels = {
  to_do: { label: 'À faire', color: '#000000' },
  in_progress: { label: 'En cours', color: '#1a73e8' },
  finished: { label: 'Terminé', color: '#0f9d58' }
};

const statusTransitions = {
  to_do: ['in_progress'],
  in_progress: ['finished']
};

const DriverJourneyCard = ({ journey, onStatusUpdate, onTrackingSave }) => {
  const [showStartForm, setShowStartForm] = useState(false);
  const [showCompleteForm, setShowCompleteForm] = useState(false);
  const [formData, setFormData] = useState({
    mileageStart: journey.mileageStart || '',
    mileageEnd: journey.mileageEnd || '',
    fuelVolume: '',
    notes: ''
  });

  const validateMileage = (name, value) => {
    if (value === '') return '';
    
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(numericValue)) return '';
    
    if (numericValue < 0) return '';
    
    if (name === 'mileageEnd' && formData.mileageStart) {
      const startMileage = parseFloat(formData.mileageStart);
      if (numericValue <= startMileage) {
        return startMileage + 1;
      }
    }
    
    return numericValue;
  };

  const validateFuelVolume = (value) => {
    if (value === '') return '';
    
    const numericValue = parseFloat(value.replace(/[^0-9.]/g, ''));
    if (isNaN(numericValue)) return '';
    
    return numericValue >= 0 && numericValue <= 1000 ? numericValue : '';
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    
    let processedValue = value;
    
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
      
      setShowStartForm(false);
      setShowCompleteForm(false);
      
      // Reset form data
      setFormData({
        mileageStart: journey.mileageStart || '',
        mileageEnd: journey.mileageEnd || '',
        fuelVolume: '',
        notes: ''
      });
      
    } catch (error) {
      console.error('Error updating journey status:', error);
      alert('Une erreur est survenue lors de la mise à jour du statut du trajet.');
    }
  };

  const renderStatusBadge = () => {
    const status = statusLabels[journey.status] || { label: 'Inconnu', color: '#666' };
    return (
      <span style={styles.statusBadge}>
        {status.label}
      </span>
    );
  };

  const renderActionButtons = () => {
    const nextStatus = statusTransitions[journey.status]?.[0];
    
    if (!nextStatus) return null;

    const buttonText = nextStatus === 'in_progress' ? 'Commencer le trajet' : 'Terminer le trajet';
    const onClick = () => {
      if (nextStatus === 'in_progress') {
        setShowStartForm(true);
      } else {
        setShowCompleteForm(true);
      }
    };

    return (
      <button 
        onClick={onClick}
        style={styles.actionButton}
      >
        {buttonText}
      </button>
    );
  };

  const renderStartForm = () => (
    <div style={styles.formContainer}>
      <h4>Début du trajet</h4>
      <div style={styles.formGroup}>
        <label>Kilométrage de départ:</label>
        <input
          type="number"
          name="mileageStart"
          value={formData.mileageStart}
          onChange={handleInputChange}
          style={styles.input}
          min="0"
          step="1"
          required
        />
      </div>
      <div style={styles.buttonGroup}>
        <button 
          onClick={() => handleStatusUpdate('in_progress')}
          style={styles.primaryButton}
          disabled={!formData.mileageStart}
        >
          Confirmer
        </button>
        <button 
          onClick={() => setShowStartForm(false)}
          style={styles.secondaryButton}
        >
          Annuler
        </button>
      </div>
    </div>
  );

  const renderCompleteForm = () => (
    <div style={styles.formContainer}>
      <h4>Fin du trajet</h4>
      <div style={styles.formGroup}>
        <label>Kilométrage d'arrivée:</label>
        <input
          type="number"
          name="mileageEnd"
          value={formData.mileageEnd}
          onChange={handleInputChange}
          min={formData.mileageStart ? parseFloat(formData.mileageStart) + 1 : 0}
          step="1"
          style={styles.input}
          required
        />
      </div>
      <div style={styles.formGroup}>
        <label>Volume de carburant (L):</label>
        <input
          type="number"
          name="fuelVolume"
          value={formData.fuelVolume}
          onChange={handleInputChange}
          min="0"
          max="1000"
          step="0.1"
          style={styles.input}
          required
        />
      </div>
      <div style={styles.formGroup}>
        <label>Notes (optionnel):</label>
        <textarea
          name="notes"
          value={formData.notes}
          onChange={handleInputChange}
          style={{...styles.input, minHeight: '80px'}}
        />
      </div>
      <div style={styles.buttonGroup}>
        <button 
          onClick={() => handleStatusUpdate('finished')}
          style={styles.primaryButton}
          disabled={!formData.mileageEnd || !formData.fuelVolume}
        >
          Terminer le trajet
        </button>
        <button 
          onClick={() => setShowCompleteForm(false)}
          style={styles.secondaryButton}
        >
          Annuler
        </button>
      </div>
    </div>
  );

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <h3 style={styles.title}>
          Trajet #{journey.journeyNumber || journey._id.substring(-4)}
        </h3>
        {renderStatusBadge()}
      </div>
      
      <div style={styles.content}>
        <div style={styles.infoGroup}>
          <div style={styles.infoRow}>
            <span style={styles.label}>Chauffeur:</span>
            <span style={styles.value}>
              {journey.driver?.name || 'Non assigné'}
            </span>
          </div>
          <div style={styles.infoRow}>
            <span style={styles.label}>Camion:</span>
            <span style={styles.value}>
              {journey.truck?.licensePlate || 'Non assigné'}
              {journey.truck?.model && ` (${journey.truck.model})`}
            </span>
          </div>
          {journey.trailer && (
            <div style={styles.infoRow}>
              <span style={styles.label}>Remorque:</span>
              <span style={styles.value}>
                {journey.trailer.licensePlate}
                {journey.trailer.model && ` (${journey.trailer.model})`}
              </span>
            </div>
          )}
          <div style={styles.infoRow}>
            <span style={styles.label}>Itinéraire:</span>
            <span style={styles.value}>
              {journey.origin} → {journey.destination}
            </span>
          </div>
          {journey.startDate && (
            <div style={styles.infoRow}>
              <span style={styles.label}>Début:</span>
              <span style={styles.value}>
                {new Date(journey.startDate).toLocaleString()}
              </span>
            </div>
          )}
          {journey.endDate && (
            <div style={styles.infoRow}>
              <span style={styles.label}>Fin:</span>
              <span style={styles.value}>
                {new Date(journey.endDate).toLocaleString()}
              </span>
            </div>
          )}
          {journey.mileageStart && (
            <div style={styles.infoRow}>
              <span style={styles.label}>Km départ:</span>
              <span style={styles.value}>
                {journey.mileageStart.toLocaleString()}
              </span>
            </div>
          )}
          {journey.mileageEnd && (
            <div style={styles.infoRow}>
              <span style={styles.label}>Km arrivée:</span>
              <span style={styles.value}>
                {journey.mileageEnd.toLocaleString()}
              </span>
            </div>
          )}
          {journey.fuelVolume && (
            <div style={styles.infoRow}>
              <span style={styles.label}>Carburant (L):</span>
              <span style={styles.value}>
                {journey.fuelVolume}
              </span>
            </div>
          )}
          {journey.notes && (
            <div style={styles.infoRow}>
              <span style={styles.label}>Notes:</span>
              <span style={styles.value}>
                {journey.notes}
              </span>
            </div>
          )}
        </div>

        {!showStartForm && !showCompleteForm && renderActionButtons()}
        {showStartForm && renderStartForm()}
        {showCompleteForm && renderCompleteForm()}
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
    marginBottom: '16px',
    position: 'relative'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '16px',
    paddingBottom: '12px',
    borderBottom: '2px solid #000000'
  },
  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: '600',
    color: '#000000'
  },
  statusBadge: {
    backgroundColor: '#000000',
    color: '#ffffff',
    padding: '4px 12px',
    borderRadius: '0px',
    fontSize: '12px',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
    border: '2px solid #000000'
  },
  content: {
    display: 'flex',
    flexDirection: 'column',
    gap: '16px'
  },
  infoGroup: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px'
  },
  infoRow: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
    alignItems: 'flex-start'
  },
  label: {
    fontWeight: '500',
    color: '#000000',
    minWidth: '120px'
  },
  value: {
    flex: 1,
    color: '#000000'
  },
  actionButton: {
    padding: '10px 16px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: '2px solid #000000',
    borderRadius: '0px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    marginTop: '12px',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#333333'
    }
  },
  formContainer: {
    marginTop: '16px',
    padding: '16px',
    backgroundColor: '#f9f9f9',
    border: '1px solid #e0e0e0',
    borderRadius: '0px'
  },
  formGroup: {
    marginBottom: '16px'
  },
  input: {
    width: '100%',
    padding: '10px 12px',
    border: '2px solid #000000',
    borderRadius: '0px',
    fontSize: '14px',
    boxSizing: 'border-box',
    backgroundColor: '#ffffff',
    color: '#000000',
    '&:focus': {
      outline: 'none',
      borderColor: '#000000',
      boxShadow: '0 0 0 2px rgba(0,0,0,0.1)'
    }
  },
  buttonGroup: {
    display: 'flex',
    gap: '12px',
    marginTop: '16px'
  },
  primaryButton: {
    padding: '10px 16px',
    backgroundColor: '#000000',
    color: '#ffffff',
    border: '2px solid #000000',
    borderRadius: '0px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#333333'
    },
    '&:disabled': {
      backgroundColor: '#cccccc',
      borderColor: '#999999',
      cursor: 'not-allowed'
    }
  },
  secondaryButton: {
    padding: '10px 16px',
    backgroundColor: '#ffffff',
    color: '#000000',
    border: '2px solid #000000',
    borderRadius: '0px',
    cursor: 'pointer',
    fontSize: '14px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    '&:hover': {
      backgroundColor: '#f0f0f0'
    }
  }
};

export default DriverJourneyCard;
