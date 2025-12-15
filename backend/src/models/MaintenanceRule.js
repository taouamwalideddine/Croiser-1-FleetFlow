import mongoose from 'mongoose';

const maintenanceRuleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: ['tire', 'oil', 'revision'], required: true },
    appliesTo: { type: String, enum: ['truck', 'trailer', 'all'], default: 'all' },
    thresholdKm: { type: Number },
    thresholdDays: { type: Number },
    notes: { type: String, trim: true }
  },
  { timestamps: true }
);

const MaintenanceRule = mongoose.model('MaintenanceRule', maintenanceRuleSchema);

export default MaintenanceRule;

