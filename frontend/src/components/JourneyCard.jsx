import React from 'react';

const statusLabels = {
  to_do: 'To Do',
  in_progress: 'In Progress',
  finished: 'Finished'
};

const JourneyCard = ({ journey, onStatusChange, onTrackingSave }) => {
  const handleStatus = (nextStatus) => {
    onStatusChange(journey._id, nextStatus);
  };

  const handleTracking = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const payload = Object.fromEntries(formData.entries());
    ['mileageStart', 'mileageEnd', 'fuelVolume'].forEach((k) => {
      if (payload[k] !== undefined && payload[k] !== '') {
        payload[k] = Number(payload[k]);
      } else {
        delete payload[k];
      }
    });
    onTrackingSave(journey._id, payload);
  };

  return (
    <div style={styles.card}>
      <div style={styles.header}>
        <div>
          <h3 style={{ margin: 0 }}>{journey.origin} → {journey.destination}</h3>
          <small>Truck: {journey.truck?.licensePlate || 'N/A'} | Driver: {journey.driver?.name}</small>
        </div>
        <span style={styles.status}>{statusLabels[journey.status] || journey.status}</span>
      </div>

      <div style={styles.row}>
        <div><strong>Start:</strong> {journey.startDate ? new Date(journey.startDate).toLocaleString() : '—'}</div>
        <div><strong>End:</strong> {journey.endDate ? new Date(journey.endDate).toLocaleString() : '—'}</div>
      </div>

      <div style={styles.buttons}>
        {journey.status !== 'to_do' && (
          <button style={styles.btn} onClick={() => handleStatus('to_do')}>To Do</button>
        )}
        {journey.status !== 'in_progress' && (
          <button style={styles.btn} onClick={() => handleStatus('in_progress')}>Start</button>
        )}
        {journey.status !== 'finished' && (
          <button style={styles.btn} onClick={() => handleStatus('finished')}>Finish</button>
        )}
      </div>

      <form onSubmit={handleTracking} style={styles.form}>
        <input name="mileageStart" type="number" placeholder="Mileage start" style={styles.input} defaultValue={journey.mileageStart || ''} />
        <input name="mileageEnd" type="number" placeholder="Mileage end" style={styles.input} defaultValue={journey.mileageEnd || ''} />
        <input name="fuelVolume" type="number" placeholder="Fuel volume" style={styles.input} defaultValue={journey.fuelVolume || ''} />
        <input name="tireStatus" placeholder="Tire status" style={styles.input} defaultValue={journey.tireStatus || ''} />
        <input name="remarks" placeholder="Remarks" style={styles.input} defaultValue={journey.remarks || ''} />
        <button type="submit" style={styles.btnPrimary}>Save Tracking</button>
      </form>
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: 'white',
    padding: '16px',
    borderRadius: '8px',
    boxShadow: '0 2px 6px rgba(0,0,0,0.05)',
    marginBottom: '16px'
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '8px'
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
  buttons: {
    display: 'flex',
    gap: '8px',
    marginBottom: '10px'
  },
  btn: {
    padding: '8px 12px',
    border: '1px solid #ddd',
    borderRadius: '6px',
    backgroundColor: '#f7f7f7',
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


