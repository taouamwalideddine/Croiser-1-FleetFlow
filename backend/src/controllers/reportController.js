import Journey from '../models/Journey.js';

export const summary = async (req, res, next) => {
  try {
    const journeys = await Journey.find();
    let totalFuel = 0;
    let totalMileage = 0;
    const perTruck = {};
    const perDriver = {};

    journeys.forEach((j) => {
      if (j.fuelVolume) totalFuel += j.fuelVolume;
      if (j.mileageStart !== undefined && j.mileageEnd !== undefined) {
        const delta = j.mileageEnd - j.mileageStart;
        if (delta > 0) totalMileage += delta;
      }
      if (j.truck) {
        perTruck[j.truck] = perTruck[j.truck] || { journeys: 0, mileage: 0, fuel: 0 };
        perTruck[j.truck].journeys += 1;
        if (j.fuelVolume) perTruck[j.truck].fuel += j.fuelVolume;
        if (j.mileageStart !== undefined && j.mileageEnd !== undefined) {
          const delta = j.mileageEnd - j.mileageStart;
          if (delta > 0) perTruck[j.truck].mileage += delta;
        }
      }
      if (j.driver) {
        perDriver[j.driver] = perDriver[j.driver] || { journeys: 0, mileage: 0, fuel: 0 };
        perDriver[j.driver].journeys += 1;
        if (j.fuelVolume) perDriver[j.driver].fuel += j.fuelVolume;
        if (j.mileageStart !== undefined && j.mileageEnd !== undefined) {
          const delta = j.mileageEnd - j.mileageStart;
          if (delta > 0) perDriver[j.driver].mileage += delta;
        }
      }
    });

    res.json({
      success: true,
      data: {
        totalFuel,
        totalMileage,
        perTruck,
        perDriver,
        journeysCount: journeys.length
      }
    });
  } catch (error) {
    next(error);
  }
};

