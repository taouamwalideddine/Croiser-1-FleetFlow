import Trailer from '../models/Trailer.js';

export const getTrailers = async (req, res, next) => {
  try {
    const trailers = await Trailer.find().sort({ createdAt: -1 });
    res.json({ success: true, data: trailers });
  } catch (error) {
    next(error);
  }
};

export const getTrailerById = async (req, res, next) => {
  try {
    const trailer = await Trailer.findById(req.params.id);
    if (!trailer) {
      return res.status(404).json({ success: false, message: 'Trailer not found' });
    }
    res.json({ success: true, data: trailer });
  } catch (error) {
    next(error);
  }
};

export const createTrailer = async (req, res, next) => {
  try {
    const trailer = await Trailer.create(req.body);
    res.status(201).json({ success: true, data: trailer });
  } catch (error) {
    next(error);
  }
};

export const updateTrailer = async (req, res, next) => {
  try {
    const trailer = await Trailer.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true
    });
    if (!trailer) {
      return res.status(404).json({ success: false, message: 'Trailer not found' });
    }
    res.json({ success: true, data: trailer });
  } catch (error) {
    next(error);
  }
};

export const deleteTrailer = async (req, res, next) => {
  try {
    const trailer = await Trailer.findByIdAndDelete(req.params.id);
    if (!trailer) {
      return res.status(404).json({ success: false, message: 'Trailer not found' });
    }
    res.json({ success: true, message: 'Trailer deleted' });
  } catch (error) {
    next(error);
  }
};

export const updateTrailerTracking = async (req, res, next) => {
  try {
    const { mileage, tireStatus, maintenanceDueDate, lastServiceDate, notes, status } = req.body;

    const trailer = await Trailer.findById(req.params.id);
    if (!trailer) {
      return res.status(404).json({ success: false, message: 'Trailer not found' });
    }

    if (mileage !== undefined) trailer.mileage = mileage;
    if (tireStatus !== undefined) trailer.tireStatus = tireStatus;
    if (maintenanceDueDate !== undefined) trailer.maintenanceDueDate = maintenanceDueDate;
    if (lastServiceDate !== undefined) trailer.lastServiceDate = lastServiceDate;
    if (notes !== undefined) trailer.notes = notes;
    if (status !== undefined) trailer.status = status;

    await trailer.save();
    res.json({ success: true, data: trailer });
  } catch (error) {
    next(error);
  }
};

