// core imports
import mongoose from 'mongoose';

// schema for journey logs
// tracks status changes and notes for each journey

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

// main journey schema
// defines the structure of journey documents in mongodb
const journeySchema = new mongoose.Schema(
  {
    // reference to the user (driver) assigned to this journey
  driver: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
    },
    // reference to the truck assigned to this journey
  truck: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Truck',
      required: true
    },
    // optional reference to a trailer assigned to this journey
  trailer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Trailer'
    },
    // journey origin location
  origin: {
      type: String,
      required: true
    },
    // journey destination location
  destination: {
      type: String,
      required: true
    },
    status: {
      type: String,
      enum: ['to_do', 'in_progress', 'finished'],
      default: 'to_do'
    },
    // timestamps for journey lifecycle
  startDate: Date,
    endDate: Date,
    // tracking data
  mileageStart: Number,
    mileageEnd: Number,
    fuelVolume: Number,
    tireStatus: {
      type: String,
      default: 'ok'
    },
    remarks: String,
    // array of log entries for this journey
  logs: [journeyLogSchema]
  },
  {
    // automatically add createdAt and updatedAt timestamps
  timestamps: true
  }
);

const Journey = mongoose.model('Journey', journeySchema);

export default Journey;

