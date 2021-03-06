import { Request, Response, NextFunction } from 'express';
import {
  EarthquakeReport,
  IEarthquakeReportDocument,
} from '../models/EarthquakeReport';

import { EarthquakePrediction } from '../models/EarthquakePrediction';

export const postEarthquakeReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    payload['reporterName'] = req.user.username;
    const earthquakeReport = new EarthquakeReport(payload);
    await earthquakeReport.save();
    return res.status(200).json({});
  } catch (err) {
    next(err);
  }
};

export const getEarthquakeReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const reports: IEarthquakeReportDocument[] = await EarthquakeReport.getAllReports();
    return res.status(200).json({ reports: reports });
  } catch (err) {
    next(err);
  }
};

export const patchEarthquakeReport = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const payload = req.body;
    const reportID = payload['report_id'];
    const report = payload['report'];
    const originalReport: IEarthquakeReportDocument = await EarthquakeReport.findOne(
      { _id: reportID }
    ).exec();
    if (originalReport.reporterName != req.user.username) {
      return res.status(401).json({ err: 'Unauthorized' });
    }
    await EarthquakeReport.updateOne({ _id: reportID }, report);
    return res.status(200).json({});
  } catch (err) {
    next(err);
  }
};

export const postEarthquakePrediction = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (req.user.role !== 'coordinator' && req.user.role !== 'administrator') {
      return res.status(401).json({ err: 'Unauthorized' });
    }
    const payload = req.body;
    payload['predictorName'] = req.user.username;
    const earthquakePrediction = new EarthquakePrediction(payload);
    await earthquakePrediction.save();
    return res.status(200).json({});
  } catch (err) {
    next(err);
  }
};
