import MaintenanceRule from '../models/MaintenanceRule.js';
import Truck from '../models/Truck.js';
import Trailer from '../models/Trailer.js';

export const listRules = async (req, res, next) => {
  try {
    const rules = await MaintenanceRule.find().sort({ createdAt: -1 });
    res.json({ success: true, data: rules });
  } catch (error) {
    next(error);
  }
};

export const createRule = async (req, res, next) => {
  try {
    const { name, type, appliesTo, thresholdKm, thresholdDays, notes } = req.body;
    if (!name || !type) return res.status(400).json({ success: false, message: 'name and type are required' });
    const rule = await MaintenanceRule.create({ name, type, appliesTo, thresholdKm, thresholdDays, notes });
    res.status(201).json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

export const updateRule = async (req, res, next) => {
  try {
    const rule = await MaintenanceRule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, data: rule });
  } catch (error) {
    next(error);
  }
};

export const deleteRule = async (req, res, next) => {
  try {
    const rule = await MaintenanceRule.findByIdAndDelete(req.params.id);
    if (!rule) return res.status(404).json({ success: false, message: 'Rule not found' });
    res.json({ success: true, message: 'Rule deleted' });
  } catch (error) {
    next(error);
  }
};

export const upcomingMaintenance = async (req, res, next) => {
  try {
    const now = new Date();
    const rules = await MaintenanceRule.find();
    const trucks = await Truck.find();
    const trailers = await Trailer.find();

    const items = [];

    const checkRules = (asset, type) => {
      rules.forEach((rule) => {
        if (rule.appliesTo !== 'all' && rule.appliesTo !== type) return;
        const dueByDate = rule.thresholdDays ? addDays(asset.lastServiceDate || asset.updatedAt, rule.thresholdDays) : null;
        const dueByKm = rule.thresholdKm && asset.mileage !== undefined ? (asset.mileage + rule.thresholdKm) : null;
        const overdue =
          (dueByDate && now > dueByDate) ||
          (dueByKm && asset.mileage !== undefined && asset.mileage >= dueByKm);
        const upcoming =
          (dueByDate && daysBetween(now, dueByDate) <= 14) ||
          (dueByKm && asset.mileage !== undefined && dueByKm - asset.mileage <= 500);
        if (overdue || upcoming) {
          items.push({
            assetType: type,
            assetId: asset._id,
            rule: rule.name,
            type: rule.type,
            dueByDate,
            dueByKm,
            status: overdue ? 'overdue' : 'upcoming'
          });
        }
      });
    };

    trucks.forEach((t) => checkRules(t, 'truck'));
    trailers.forEach((t) => checkRules(t, 'trailer'));

    res.json({ success: true, data: items });
  } catch (error) {
    next(error);
  }
};

const addDays = (date, days) => {
  if (!date) return null;
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
};

const daysBetween = (a, b) => Math.round((b - a) / (1000 * 60 * 60 * 24));

