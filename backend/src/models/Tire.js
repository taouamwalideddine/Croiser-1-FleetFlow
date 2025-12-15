import mongoose from 'mongoose';

const tireHistorySchema = new mongoose.Schema(
  {
    action: { type: String, enum: ['created', 'assigned', 'unassigned', 'wear', 'status'], required: true },
    note: String,
    treadDepth: Number,
    mileage: Number,
    date: { type: Date, default: Date.now }
  },
  { _id: false }
);

const tireSchema = new mongoose.Schema(
  {
    serialNumber: { type: String, required: true, unique: true, trim: true },
    brand: { type: String, trim: true },
    size: { type: String, trim: true },
    status: { type: String, enum: ['in_stock', 'mounted', 'retired'], default: 'in_stock' },
    treadDepth: { type: Number, default: 0 },
    position: { type: String, trim: true },
    assignedToType: { type: String, enum: ['truck', 'trailer', null], default: null },
    assignedToId: { type: mongoose.Schema.Types.ObjectId, refPath: 'assignedToType' },
    mileageAtInstall: { type: Number },
    notes: { type: String, trim: true },
    history: [tireHistorySchema]
  },
  { timestamps: true }
);

const Tire = mongoose.model('Tire', tireSchema);

export default Tire;

