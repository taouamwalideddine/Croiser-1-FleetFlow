import mongoose from 'mongoose';

const truckSchema = new mongoose.Schema(
  {
    licensePlate: {
      type: String,
      required: [true, 'License plate is required'],
      unique: true,
      trim: true
    },
    model: {
      type: String,
      required: [true, 'Model is required'],
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
    fuelLevel: {
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

const Truck = mongoose.model('Truck', truckSchema);

export default Truck;

