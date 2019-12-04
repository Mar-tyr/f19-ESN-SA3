import mongoose from 'mongoose';
import * as smartAssistantController from '../../src/controllers/smart-assistant';

import { Message } from '../../src/models/Message';
import { HospitalInfo } from '../../src/models/HospitalInfo';
import { MONGODB_URI } from '../../src/config/secrets';

describe('Test Smart Assistant Controller', () => {
  beforeAll(async () => {
    const MONGODB_URI_TEST = MONGODB_URI + '_hospital-info';
    mongoose
      .connect(MONGODB_URI_TEST, { useNewUrlParser: true })
      .then(() => {})
      .catch((err) => {
        console.log(err);
      });

    const message = new Message({
      senderName: '456',
      receiverName: 'smart-assistant',
      content: 'Hello',
    });
    await message.save();

    const hospital = new HospitalInfo({
      center: '1,2',
      longlat: '3,4',
      address: 'abc',
      category: '0',
      name: 'abc',
    });
    await hospital.save();
  }, 1000000);

  afterAll(async () => {
    await mongoose.connection.db.dropDatabase();
  });

  test('postRequest() - Ask a meaningless question', async () => {
    const req: any = {
      body: {
        senderName: '123',
        message: '123',
      },
    };
    const res: any = {
      status: jest.fn((code) => {
        return res;
      }),
      json: jest.fn((payload) => {
        return res;
      }),
    };
    const next = jest.fn();

    await smartAssistantController.postRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith('{}');
  }, 1000000);

  test('postRequest() - Ask a meaningful question', async () => {
    const req: any = {
      body: {
        senderName: '123',
        message: 'I am Injured...',
        location: '1,2',
      },
    };
    const res: any = {
      status: jest.fn((code) => {
        return res;
      }),
      json: jest.fn((payload) => {
        return res;
      }),
    };
    const next = jest.fn();

    await smartAssistantController.postRequest(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith('{}');
  }, 1000000);

  test('getResponse() - fetch a response message', async () => {
    const req: any = {
      query: {
        senderName: '456',
        receiverName: 'smart-assistant',
      },
    };
    const res: any = {
      status: jest.fn((code) => {
        return res;
      }),
      json: jest.fn((resp) => {
        resp.messages[0] = resp.messages[0].toObject();
        delete resp.messages[0].createdAt;
        delete resp.messages[0].__v;
        delete resp.messages[0]._id;
        delete resp.messages[0].senderId;
        delete resp.messages[0].updatedAt;
        return res;
      }),
    };
    const next = jest.fn();

    await smartAssistantController.getResponse(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      messages: [
        {
          active: true,
          senderName: '456',
          content: 'Hello',
          receiverName: 'smart-assistant',
        },
      ],
    });
  }, 100000);

  test('getHospitalInfo() - fetch a list of nearby hospitals', async () => {
    const req: any = {
      query: {
        location: '1,2',
      },
    };
    const res: any = {
      status: jest.fn((code) => {
        return res;
      }),
      json: jest.fn((resp) => {
        resp.hospitals[0] = resp.hospitals[0].toObject();
        delete resp.hospitals[0].createdAt;
        delete resp.hospitals[0].__v;
        delete resp.hospitals[0]._id;
        delete resp.hospitals[0].senderId;
        delete resp.hospitals[0].updatedAt;
        return res;
      }),
    };
    const next = jest.fn();

    await smartAssistantController.getHospitalInfo(req, res, next);
    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith({
      hospitals: [
        {
          longlat: '3,4',
          address: 'abc',
          category: '0',
          name: 'abc',
          center: '1,2',
        },
      ],
    });
  }, 1000000);
});
