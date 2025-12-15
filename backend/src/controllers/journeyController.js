import Journey from '../models/Journey.js';
import Truck from '../models/Truck.js';
import Trailer from '../models/Trailer.js';
import User from '../models/User.js';

// Helper to ensure driver can access assigned journeys
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

    res.status(201).json({ success: true, data: journey });
  } catch (error) {
    next(error);
  }
};

export const updateJourneyStatus = async (req, res, next) => {
  try {
    const { status, note } = req.body;
    const allowedStatuses = ['to_do', 'in_progress', 'finished'];
    if (!allowedStatuses.includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    const journey = await Journey.findById(req.params.id);
    if (!journey) {
      return res.status(404).json({ success: false, message: 'Journey not found' });
    }

    if (!canAccessJourney(journey, req.user)) {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    journey.status = status;
    journey.logs.push({ status, note });

    if (status === 'in_progress' && !journey.startDate) {
      journey.startDate = new Date();
    }
    if (status === 'finished' && !journey.endDate) {
      journey.endDate = new Date();
    }

    await journey.save();
    res.json({ success: true, data: journey });
  } catch (error) {
    next(error);
  }
};

// Tracking updates: mileage, fuel, tires, remarks, and status
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

    // Update status if provided
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

    // Update tracking data
    if (mileageStart !== undefined) journey.mileageStart = mileageStart;
    if (mileageEnd !== undefined) journey.mileageEnd = mileageEnd;
    if (fuelVolume !== undefined) journey.fuelVolume = fuelVolume;
    if (tireStatus !== undefined) journey.tireStatus = tireStatus;
    if (remarks !== undefined) journey.remarks = remarks;

    // Validate mileage
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
      return res.status(404).json({ success: false, message: 'Journey not found' });
    }

    // Only admins can delete journeys
    if (req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied' });
    }

    await Journey.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: 'Journey deleted successfully' });
  } catch (error) {
    next(error);
  }
};

