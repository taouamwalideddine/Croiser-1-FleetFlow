import Truck from '../models/Truck.js';

export const getTrucks = async (req, res, next) => {
  try {
    const trucks = await Truck.find().sort({ createdAt: -1 });
    res.json({ success: true, data: trucks });
  } catch (error) {
    next(error);
  }
};

export const getTruckById = async (req, res, next) => {
  try {
    const truck = await Truck.findById(req.params.id);
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }
    res.json({ success: true, data: truck });
  } catch (error) {
    next(error);
  }
};

export const createTruck = async (req, res, next) => {
  try {
    const truck = await Truck.create(req.body);
    res.status(201).json({ success: true, data: truck });
  } catch (error) {
    next(error);
  }
};

export const updateTruck = async (req, res, next) => {
  try {
    const truck = await Truck.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }
    res.json({ success: true, data: truck });
  } catch (error) {
    next(error);
  }
};

export const deleteTruck = async (req, res, next) => {
  try {
    const truck = await Truck.findByIdAndDelete(req.params.id);
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }
    res.json({ success: true, message: 'Truck deleted' });
  } catch (error) {
    next(error);
  }
};

// update tracking
export const updateTruckTracking = async (req, res, next) => {
  try {
    const { mileage, fuelLevel, tireStatus, maintenanceDueDate, lastServiceDate, notes, status } = req.body;

    const truck = await Truck.findById(req.params.id);
    if (!truck) {
      return res.status(404).json({ success: false, message: 'Truck not found' });
    }

    if (mileage !== undefined) truck.mileage = mileage;
    if (fuelLevel !== undefined) truck.fuelLevel = fuelLevel;
    if (tireStatus !== undefined) truck.tireStatus = tireStatus;
    if (maintenanceDueDate !== undefined) truck.maintenanceDueDate = maintenanceDueDate;
    if (lastServiceDate !== undefined) truck.lastServiceDate = lastServiceDate;
    if (notes !== undefined) truck.notes = notes;
    if (status !== undefined) truck.status = status;

    await truck.save();
    res.json({ success: true, data: truck });
  } catch (error) {
    next(error);
  }
};

