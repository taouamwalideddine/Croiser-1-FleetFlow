import mongoose from 'mongoose';

const trailerSchema = new mongoose.Schema(
  {
    licensePlate: {
      type: String,
      required: [true, 'License plate is required'],
      unique: true,
      trim: true
    },
    type: {
      type: String,
      required: [true, 'Trailer type is required'],
      trim: true
    },
    capacity: {
      type: Number,
      default: 0
    },
    status: {
      type: String,
      enum: ['available', 'maintenance', 'assigned'],
      default: 'available'
    },
    mileage: {
      type: Number,
      default: 0
    },
    tireStatus: {
      type: String,
      default: 'ok'
    },
    maintenanceDueDate: {
      type: Date
    },
    lastServiceDate: {
      type: Date
    },
    notes: {
      type: String
    }
  },
  {
    timestamps: true
  }
);

const Trailer = mongoose.model('Trailer', trailerSchema);

export default Trailer;

