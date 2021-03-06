import mongoose, { Model } from 'mongoose';

interface ICoordinate {
  longitude: Number;
  latitude: Number;
}

export interface IEarthquakeReportDocument extends mongoose.Document {
  occurred_datetime: Date;
  description: String;
  magnitude: Number;
  location: ICoordinate;
  killed: Number;
  injured: Number;
  missing: Number;
  reporterName: String;
}

export interface IEarthquakeReportModel
  extends Model<IEarthquakeReportDocument> {
  getAllReports(): IEarthquakeReportDocument[];
  updateReport(oldReporterName: string, newReporterName: string): void;
}

const earthquakeReportSchema = new mongoose.Schema(
  {
    occurred_datetime: Date,
    description: String,
    magnitude: Number,
    location: {
      longitude: Number,
      latitude: Number,
    },
    killed: Number,
    injured: Number,
    missing: Number,
    reporterName: String,
  },
  { collection: 'earthquake_reports' }
);

earthquakeReportSchema.statics.getAllReports = async function getAllReports() {
  try {
    return await EarthquakeReport.find({}).exec();
  } catch (err) {
    throw err;
  }
};

earthquakeReportSchema.statics.updateReport = async function updateReport(
  oldReporterName: string,
  newReporterName: string
) {
  try {
    await EarthquakeReport.update(
      { reporterName: oldReporterName },
      { $set: { reporterName: newReporterName } },
      { multi: true }
    );
  } catch (err) {
    throw err;
  }
};

export const EarthquakeReport: IEarthquakeReportModel = mongoose.model<
  IEarthquakeReportDocument,
  IEarthquakeReportModel
>('EarthquakeReport', earthquakeReportSchema);
