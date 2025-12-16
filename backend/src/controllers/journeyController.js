import Journey from '../models/Journey.js';
import Truck from '../models/Truck.js';
import Trailer from '../models/Trailer.js';
import User from '../models/User.js';
import mongoose from 'mongoose';
import PDFDocument from 'pdfkit';

// check truck availability
export const checkTruckAvailability = async (req, res, next) => {
  try {
    const { truck } = req.body;
    if (!truck) return next(); // No truck to check

    const activeJourney = await Journey.findOne({
      truck,
      status: 'in_progress'
    });

    if (activeJourney) {
      return res.status(400).json({
        success: false,
        message: 'Ce camion est déjà en cours d\'utilisation pour un autre trajet'
      });
    }
    next();
  } catch (error) {
    console.error('Error checking truck availability:', error);
    next(error);
  }
};

// check journey access
const canAccessJourney = (journey, user) => {
  if (user.role === 'admin') return true;
  return journey.driver?.toString() === user.userId;
};

export const getJourneys = async (req, res, next) => {
  try {
    const filter = req.user.role === 'chauffeur' ? { driver: req.user.userId } : {};
    const journeys = await Journey.find(filter)
      .populate('driver', 'name email role')
      .populate('truck', 'licensePlate model')
      .populate('trailer', 'licensePlate type')
      .sort({ createdAt: -1 });
    res.json({ success: true, data: journeys });
  } catch (error) {
    next(error);
  }
};

export const getJourneyById = async (req, res, next) => {
  try {
    const journey = await Journey.findById(req.params.id)
      .populate('driver', 'name email role')
      .populate('truck', 'licensePlate model')
      .populate('trailer', 'licensePlate type');

    if (!journey) {
      return res.status(404).json({ success: false, message: 'Journey not found' });
    }

    if (!canAccessJourney(journey, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    res.json({ success: true, data: journey });
  } catch (error) {
    next(error);
  }
};

export const createJourney = async (req, res, next) => {
  try {
    const { driver, truck, trailer, origin, destination, startDate } = req.body;

    if (!driver || !truck || !origin || !destination) {
      return res.status(400).json({ success: false, message: 'driver, truck, origin and destination are required' });
    }

    const driverExists = await User.findById(driver);
    if (!driverExists || driverExists.role !== 'chauffeur') {
      return res.status(400).json({ success: false, message: 'Driver must be a valid chauffeur' });
    }

    const truckExists = await Truck.findById(truck);
    if (!truckExists) {
      return res.status(400).json({ success: false, message: 'Truck not found' });
    }

    if (trailer) {
      const trailerExists = await Trailer.findById(trailer);
      if (!trailerExists) {
        return res.status(400).json({ success: false, message: 'Trailer not found' });
      }
    }

    const journey = await Journey.create({
      driver,
      truck,
      trailer,
      origin,
      destination,
      startDate,
      logs: [{ status: 'to_do', note: 'Journey created' }]
    });

    // Update truck status to 'assigned'
    await Truck.findByIdAndUpdate(truck, { status: 'assigned' }, { new: true });

    res.status(201).json({ success: true, data: journey });
  } catch (error) {
    const validateJourneyUpdate = (data, currentStatus) => {
      const errors = [];

      // Check mileage values
      if (data.mileageStart && (isNaN(data.mileageStart) || data.mileageStart < 0)) {
        errors.push('Le kilométrage de départ doit être un nombre positif');
      }

      if (data.mileageEnd && (isNaN(data.mileageEnd) || data.mileageEnd < 0)) {
        errors.push('Le kilométrage d\'arrivée doit être un nombre positif');
      }

      if (data.mileageStart && data.mileageEnd && data.mileageEnd <= data.mileageStart) {
        errors.push('Le kilométrage d\'arrivée doit être supérieur au kilométrage de départ');
      }

      // Check fuel volume
      if (data.fuelVolume !== undefined && (isNaN(data.fuelVolume) || data.fuelVolume < 0 || data.fuelVolume > 1000)) {
        errors.push('Le volume de carburant doit être compris entre 0 et 1000 litres');
      }

      // Status transition validation
      if (data.status) {
        const validTransitions = {
          to_do: ['in_progress'],
          in_progress: ['finished']
        };

        if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(data.status)) {
          errors.push(`Transition de statut invalide: ${currentStatus} -> ${data.status}`);
        }
      }

      return errors.length > 0 ? errors : null;
    };

    const validationErrors = validateJourneyUpdate(req.body, 'to_do');
    if (validationErrors) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: validationErrors
      });
    }

    next(error);
  }
};

export const updateJourneyStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const allowedStatuses = ['to_do', 'in_progress', 'finished'];

    // Basic validation
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'Statut invalide. Les statuts autorisés sont: ' + allowedStatuses.join(', ')
      });
    }

    // Find the journey
    const journey = await Journey.findById(req.params.id);
    if (!journey) {
      return res.status(404).json({
        success: false,
        message: 'Trajet non trouvé'
      });
    }

    if (!canAccessJourney(journey, req.user)) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé'
      });
    }

    // Status transition validation
    const validTransitions = {
      to_do: ['in_progress'],
      in_progress: ['finished'],
      finished: [] // Cannot transition from finished
    };

    if (!validTransitions[journey.status]?.includes(status)) {
      return res.status(400).json({
        success: false,
        message: `Transition de statut non autorisée: ${journey.status} -> ${status}`
      });
    }

    // Update status
    const previousStatus = journey.status;
    journey.status = status;
    
    if (note) {
      journey.logs.push({
        status,
        note,
        timestamp: new Date()
      });
    }
    
    // Update truck status
    if (journey.truck) {
      let truckStatus;
      
      if (status === 'in_progress') {
        truckStatus = 'in_use';
      } else if (status === 'finished') {
        truckStatus = 'available';
      } else if (status === 'to_do') {
        truckStatus = 'assigned';
      } else {
        truckStatus = 'available'; // Default fallback
      }
      
      await Truck.findByIdAndUpdate(
        journey.truck, 
        { status: truckStatus },
        { new: true }
      );
    }

    // Handle status updates
    if (status === 'in_progress' && !journey.startDate) {
      journey.startDate = new Date();

      // Check if truck is already in use
      if (journey.truck) {
        const truckInUse = await Journey.findOne({
          truck: journey.truck,
          status: 'in_progress',
          _id: { $ne: journey._id } // Exclude current journey
        });

        if (truckInUse) {
          return res.status(400).json({
            success: false,
            message: 'Ce camion est déjà en cours d\'utilisation pour un autre trajet'
          });
        }
      }
    }

    if (status === 'finished' && !journey.endDate) {
      journey.endDate = new Date();
    }

    await journey.save();

    // Return updated journey
    const updatedJourney = await Journey.findById(journey._id)
      .populate('driver', 'name email role')
      .populate('truck', 'licensePlate model status')
      .populate('trailer', 'licensePlate type');

    res.json({
      success: true,
      message: `Statut du trajet mis à jour avec succès: ${status}`,
      data: updatedJourney
    });
  } catch (error) {
    next(error);
  }
};

// Update journey tracking
export const updateJourneyTracking = async (req, res, next) => {
  try {
    const { mileageStart, mileageEnd, fuelVolume, tireStatus, remarks, status } = req.body;

    const journey = await Journey.findById(req.params.id);
    if (!journey) {
      return res.status(404).json({ success: false, message: 'Journey not found' });
    }

    if (!canAccessJourney(journey, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // Validate data
    const validateJourneyUpdate = (data, currentStatus) => {
      const errors = [];

      // Check mileage values
      if (data.mileageStart && (isNaN(data.mileageStart) || data.mileageStart < 0)) {
        errors.push('Le kilométrage de départ doit être un nombre positif');
      }

      if (data.mileageEnd && (isNaN(data.mileageEnd) || data.mileageEnd < 0)) {
        errors.push('Le kilométrage d\'arrivée doit être un nombre positif');
      }

      if (data.mileageStart && data.mileageEnd && data.mileageEnd <= data.mileageStart) {
        errors.push('Le kilométrage d\'arrivée doit être supérieur au kilométrage de départ');
      }

      // Check fuel volume
      if (data.fuelVolume !== undefined && (isNaN(data.fuelVolume) || data.fuelVolume < 0 || data.fuelVolume > 1000)) {
        errors.push('Le volume de carburant doit être compris entre 0 et 1000 litres');
      }

      // Status transition validation
      if (data.status) {
        const validTransitions = {
          to_do: ['in_progress'],
          in_progress: ['finished']
        };

        if (validTransitions[currentStatus] && !validTransitions[currentStatus].includes(data.status)) {
          errors.push(`Transition de statut invalide: ${currentStatus} -> ${data.status}`);
        }
      }

      return errors.length > 0 ? errors : null;
    };

    const validationErrors = validateJourneyUpdate(req.body, journey.status);
    if (validationErrors) {
      return res.status(400).json({
        success: false,
        message: 'Erreur de validation',
        errors: validationErrors
      });
    }

    // Update status
    if (status) {
      const allowedStatuses = ['to_do', 'in_progress', 'finished'];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({ success: false, message: 'Invalid status' });
      }

      journey.status = status;
      journey.logs.push({ status, note: 'Status updated via tracking update' });

      if (status === 'in_progress' && !journey.startDate) {
        journey.startDate = new Date();
      }
      if (status === 'finished' && !journey.endDate) {
        journey.endDate = new Date();
      }
    }

    // Update data
    if (mileageStart !== undefined) journey.mileageStart = mileageStart;
    if (mileageEnd !== undefined) journey.mileageEnd = mileageEnd;
    if (fuelVolume !== undefined) journey.fuelVolume = fuelVolume;
    if (tireStatus !== undefined) journey.tireStatus = tireStatus;
    if (remarks !== undefined) journey.remarks = remarks;

    // Check mileage
    if (journey.mileageEnd && journey.mileageStart && journey.mileageEnd < journey.mileageStart) {
      return res.status(400).json({
        success: false,
        message: 'End mileage cannot be less than start mileage'
      });
    }

    await journey.save();
    res.json({ success: true, data: journey });
  } catch (error) {
    next(error);
  }
};

export const deleteJourney = async (req, res, next) => {
  try {
    const journey = await Journey.findById(req.params.id);
    if (!journey) {
      return res.status(404).json({ message: 'Trajet non trouvé' });
    }

    // Only admins can delete journeys
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    // If journey has an associated truck, update its status
    if (journey.truck) {
      // Check if there are other active journeys for this truck
      const activeJourneys = await Journey.find({
        truck: journey.truck,
        status: { $in: ['to_do', 'in_progress'] },
        _id: { $ne: journey._id } // Exclude current journey
      });

      // Only set to available if no other active journeys for this truck
      if (activeJourneys.length === 0) {
        await Truck.findByIdAndUpdate(
          journey.truck,
          { status: 'available' },
          { new: true }
        );
      }
    }

    await Journey.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Journey deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// Generate journey PDF
export const generateJourneyPDF = async (req, res, next) => {
  try {
    const journey = await Journey.findById(req.params.id)
      .populate('driver', 'name email phone')
      .populate('truck', 'licensePlate model')
      .populate('trailer', 'licensePlate type');

    if (!journey) {
      return res.status(404).json({ success: false, message: 'Trajet non trouvé' });
    }

    if (!canAccessJourney(journey, req.user)) {
      return res.status(403).json({ success: false, message: 'Accès refusé' });
    }

    const doc = new PDFDocument();
    const filename = `trajet-${journey._id}.pdf`;
    
    // Set response headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Pipe PDF to response
    doc.pipe(res);

    // Add content to PDF
    doc
      .fontSize(20)
      .text('Détails du Trajet', { align: 'center' })
      .moveDown(0.5);

    // Journey details
    doc
      .fontSize(14)
      .text(`Trajet #${journey._id.toString().substring(18, 24)}`, { align: 'center' })
      .moveDown(0.5);

    // Driver and Vehicle Info
    doc
      .fontSize(12)
      .text('Informations du Conducteur:')
      .text(`- Nom: ${journey.driver?.name || 'Non spécifié'}`)
      .text(`- Email: ${journey.driver?.email || 'Non spécifié'}`)
      .text(`- Téléphone: ${journey.driver?.phone || 'Non spécifié'}`)
      .moveDown(0.5);

    doc
      .text('Véhicule:')
      .text(`- Camion: ${journey.truck?.licensePlate || 'Non spécifié'} (${journey.truck?.model || 'Modèle inconnu'})`)
      .text(`- Remorque: ${journey.trailer?.licensePlate || 'Aucune'}`)
      .moveDown(0.5);

    // Journey Details
    doc
      .text('Détails:')
      .text(`- Départ: ${journey.origin}`)
      .text(`- Destination: ${journey.destination}`)
      .text(`- Statut: ${getStatusLabel(journey.status)}`)
      .text(`- Date de début: ${journey.startDate ? new Date(journey.startDate).toLocaleString() : 'Non commencé'}`)
      .text(`- Date de fin: ${journey.endDate ? new Date(journey.endDate).toLocaleString() : 'En cours'}`)
      .moveDown(0.5);

    // Add a simple footer
    doc
      .fontSize(10)
      .text(`Généré le ${new Date().toLocaleString()}`, 50, doc.page.height - 50);

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error('Error generating PDF:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Erreur lors de la génération du PDF',
      error: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
};

// get status label
const getStatusLabel = (status) => {
  const statusLabels = {
    'to_do': 'À faire',
    'in_progress': 'En cours',
    'finished': 'Terminé'
  };
  return statusLabels[status] || status;
};

