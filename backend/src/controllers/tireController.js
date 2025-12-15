import Tire from '../models/Tire.js';
import Truck from '../models/Truck.js';
import Trailer from '../models/Trailer.js';

export const listTires = async (req, res, next) => {
  try {
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    const tires = await Tire.find(filter).sort({ createdAt: -1 });
    res.json({ success: true, data: tires });
  } catch (error) {
    next(error);
  }
};

export const getTire = async (req, res, next) => {
  try {
    const tire = await Tire.findById(req.params.id);
    if (!tire) return res.status(404).json({ success: false, message: 'Tire not found' });
    res.json({ success: true, data: tire });
  } catch (error) {
    next(error);
  }
};

export const createTire = async (req, res, next) => {
  try {
    const { serialNumber, brand, size, treadDepth } = req.body;
    if (!serialNumber) return res.status(400).json({ success: false, message: 'serialNumber is required' });
    const tire = await Tire.create({
      serialNumber,
      brand,
      size,
      treadDepth,
      history: [{ action: 'created', note: 'Tire created', treadDepth }]
    });
    res.status(201).json({ success: true, data: tire });
  } catch (error) {
    next(error);
  }
};

export const updateTire = async (req, res, next) => {
  try {
    if (req.body.treadDepth !== undefined && Number.isNaN(Number(req.body.treadDepth))) {
      return res.status(400).json({ success: false, message: 'treadDepth must be a number' });
    }
    const tire = await Tire.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!tire) return res.status(404).json({ success: false, message: 'Tire not found' });
    res.json({ success: true, data: tire });
  } catch (error) {
    next(error);
  }
};

export const deleteTire = async (req, res, next) => {
  try {
    const tire = await Tire.findByIdAndDelete(req.params.id);
    if (!tire) return res.status(404).json({ success: false, message: 'Tire not found' });
    res.json({ success: true, message: 'Tire deleted' });
  } catch (error) {
    next(error);
  }
};

export const assignTire = async (req, res, next) => {
  try {
    const { assignedToType, assignedToId, position, mileageAtInstall } = req.body;
    if (!['truck', 'trailer'].includes(assignedToType)) {
      return res.status(400).json({ success: false, message: 'assignedToType must be truck or trailer' });
    }
    if (!assignedToId) return res.status(400).json({ success: false, message: 'assignedToId is required' });
    if (!position) return res.status(400).json({ success: false, message: 'position is required' });
    if (mileageAtInstall !== undefined && Number.isNaN(Number(mileageAtInstall))) {
      return res.status(400).json({ success: false, message: 'mileageAtInstall must be a number' });
    }

    const tire = await Tire.findById(req.params.id);
    if (!tire) return res.status(404).json({ success: false, message: 'Tire not found' });
    if (tire.status === 'retired') return res.status(400).json({ success: false, message: 'Retired tire cannot be assigned' });

    if (assignedToType === 'truck') {
      const exists = await Truck.findById(assignedToId);
      if (!exists) return res.status(400).json({ success: false, message: 'Truck not found' });
    } else {
      const exists = await Trailer.findById(assignedToId);
      if (!exists) return res.status(400).json({ success: false, message: 'Trailer not found' });
    }

    tire.assignedToType = assignedToType;
    tire.assignedToId = assignedToId;
    tire.position = position;
    if (mileageAtInstall !== undefined) tire.mileageAtInstall = mileageAtInstall;
    tire.status = 'mounted';
    tire.history.push({ action: 'assigned', note: `Mounted to ${assignedToType}`, treadDepth: tire.treadDepth, mileage: mileageAtInstall });

    await tire.save();
    res.json({ success: true, data: tire });
  } catch (error) {
    next(error);
  }
};

export const unassignTire = async (req, res, next) => {
  try {
    const tire = await Tire.findById(req.params.id);
    if (!tire) return res.status(404).json({ success: false, message: 'Tire not found' });

    tire.assignedToType = null;
    tire.assignedToId = null;
    tire.position = null;
    tire.mileageAtInstall = null;
    tire.status = 'in_stock';
    tire.history.push({ action: 'unassigned', note: 'Unassigned from vehicle', treadDepth: tire.treadDepth });

    await tire.save();
    res.json({ success: true, data: tire });
  } catch (error) {
    next(error);
  }
};

export const updateTireWear = async (req, res, next) => {
  try {
    const { treadDepth, status, note, mileage } = req.body;
    const tire = await Tire.findById(req.params.id);
    if (!tire) return res.status(404).json({ success: false, message: 'Tire not found' });

    if (treadDepth !== undefined) {
      if (Number.isNaN(Number(treadDepth))) return res.status(400).json({ success: false, message: 'treadDepth must be a number' });
      tire.treadDepth = Number(treadDepth);
    }
    if (status !== undefined) tire.status = status;
    tire.history.push({ action: 'wear', note, treadDepth: treadDepth !== undefined ? Number(treadDepth) : tire.treadDepth, mileage });

    await tire.save();
    res.json({ success: true, data: tire });
  } catch (error) {
    next(error);
  }
};

