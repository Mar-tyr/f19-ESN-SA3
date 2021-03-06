import supertest from 'supertest';
import mongoose, { mongo } from 'mongoose';
import { MONGODB_URI, setMongoDbUri } from '../../src/config/secrets';
import { Message } from '../../src/models/Message';
import { User } from '../../src/models/User';

setMongoDbUri(MONGODB_URI + '_message');
import server from '../../src/server';
const mock = supertest(server);

describe('Message API', () => {
  let token: string;

  beforeAll(async () => {
    const message = new Message({
      senderName: '123',
      content: 'message',
      receiverName: 'public',
      createdAt: '2019-09-30T19:37:46.495Z',
    });
    await message.save();

    const user = new User({
      username: '123',
      password: '1234',
      role: 'coordinator',
    });
    await user.save();
  }, 10000);

  afterAll(async () => {
    console.log(mongoose.connection.db.databaseName + ' deleted');
    await mongoose.connection.db.dropDatabase();
    server.close();
  });

  beforeEach(async () => {
    const res = await mock.post('/auth/login').send({
      username: '123',
      password: '1234',
    });

    token = res.body.token;
  });

  test('GET /messages/announcements', async () => {
    const res = await mock
      .get('/messages/announcements')
      .set('Authorization', `Bearer ${token}`);

    expect(res.status).toEqual(200);
  });

  test('POST /messages/announcements', async () => {
    const res = await mock
      .post('/messages/announcements')
      .set('Authorization', `Bearer ${token}`)
      .send({
        senderName: '123',
        message: 'hello',
      });

    expect(res.status).toEqual(200);
  });

  test('GET /messages/public/history', async () => {
    const res = await mock
      .get('/messages/public/history')
      .set('Authorization', `Bearer ${token}`)
      .query({
        start: 0,
        end: 10,
      });

    expect(res.status).toEqual(200);
    expect(res.body.messages[0]['content']).toEqual('message');
  });

  test('GET /messages/def/history', async () => {
    const message = new Message({
      senderName: '123',
      content: 'message',
      receiverName: 'def',
      createdAt: '2019-09-30T19:37:46.495Z',
    });
    await message.save();
    const res = await mock
      .get('/messages/def/history')
      .set('Authorization', `Bearer ${token}`)
      .query({
        start: 0,
        end: 10,
        receiverName: 'def',
        senderName: '123',
      });

    expect(res.status).toEqual(200);
    expect(res.body.messages).toHaveLength(1);
    expect(res.body.messages[0]['senderName']).toEqual('123');
    expect(res.body.messages[0]['receiverName']).toEqual('def');
    expect(res.body.messages[0]['content']).toEqual('message');
  });

  test('GET /messages/abc/history', async () => {
    const message = new Message({
      senderName: 'def',
      content: 'message',
      receiverName: 'abc',
      createdAt: '2019-09-30T19:37:46.495Z',
    });
    await message.save();

    const res = await mock
      .get('/messages/abc/history')
      .set('Authorization', `Bearer ${token}`)
      .query({
        start: 0,
        end: 10,
        receiverName: 'abc',
        senderName: 'def',
      });

    expect(res.status).toEqual(401);
    expect(res.body.err).toEqual('Unauthorized');
  });

  // test('POST /messages/public', async () => {
  //     const formData = new FormData();
  //     formData.append('senderName', '123');
  //     formData.append('message', 'hello');
  //     formData.append('status', 'undefined');

  //   const res = await mock
  //     .post('/messages/public')
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(formData);

  //   expect(res.status).toEqual(200);
  // });

  test('GET /messages/123', async () => {
    const message = new Message({
      senderName: 'abc',
      content: 'message',
      receiverName: '123',
      createdAt: '2019-09-30T19:37:46.495Z',
    });
    await message.save();

    const res = await mock
      .get('/messages/123')
      .set('Authorization', `Bearer ${token}`)
      .query({
        timestamp: 100,
      });

    expect(res.status).toEqual(200);
    expect(res.body.messages[0]['senderName']).toEqual('abc');
    expect(res.body.messages[0]['receiverName']).toEqual('123');
    expect(res.body.messages[0]['content']).toEqual('message');
  });

  // test('POST /messages/123', async () => {
  //   const formData = new FormData();
  //   formData.append('senderName', '123');
  //   formData.append('message', 'hello');
  //   formData.append('status', 'undefined');

  //   const res = await mock
  //     .post('/messages/123')
  //     .set('Authorization', `Bearer ${token}`)
  //     .send(formData);

  //   expect(res.status).toEqual(200);
  // });
});
