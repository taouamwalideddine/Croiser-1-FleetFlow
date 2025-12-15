import mongoose from 'mongoose';

const journeyLogSchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ['to_do', 'in_progress', 'finished'],
      required: true
    },
    note: String,
    timestamp: {
      type: Date,
      default: Date.now
    }
  },
  { _id: false }
);

const journeySchema = new mongoose.Schema(
  {
    driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    truck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Truck',
      required: true
    },
    trailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trailer'
    },
    origin: {
      type: String,
      required: true
    },
    destination: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['to_do', 'in_progress', 'finished'],
      default: 'to_do'
    },
    startDate: Date,
    endDate: Date,
    mileageStart: Number,
    mileageEnd: Number,
    fuelVolume: Number,
    tireStatus: {
      type: String,
      default: 'ok'
    },
    remarks: String,
    logs: [journeyLogSchema]
  },
  {
    timestamps: true
  }
);

const Journey = mongoose.model('Journey', journeySchema);

export default Journey;

