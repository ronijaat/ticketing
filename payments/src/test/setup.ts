import jwt from 'jsonwebtoken';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

declare global {
  var signin: (userId?: string) => string[];
  var createId: () => string;
}

jest.mock('../nats-wrapper');

process.env.STRIPE_KEY =
  'sk_test_51NiViMSC5lIPuLtisCKheTTVH90XWXIDfhl7IqvTIGw9UHIMSlwGPJmFPPsd3Fwm7AQhA8kNcfUBIhLu1N8UQ4YV00le75zjQs';

let mongo: any;
beforeAll(async () => {
  jest.clearAllMocks();
  process.env.JWT_KEY = 'asdfasdf';
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';

  mongo = await MongoMemoryServer.create();
  const mongoUri = mongo.getUri();

  await mongoose.connect(mongoUri, {});
});

beforeEach(async () => {
  jest.clearAllMocks();
  const collections = await mongoose.connection.db.collections();

  for (let collection of collections) {
    await collection.deleteMany({});
  }
});

afterAll(async () => {
  if (mongo) {
    await mongo.stop();
  }
  await mongoose.connection.close();
});

global.createId = () => {
  return new mongoose.Types.ObjectId().toHexString();
};

global.signin = (userId?: string) => {
  // Build a JWT payload. { id, email }
  const payload = {
    id: userId ?? global.createId(),
    email: 'test@test.com',
  };
  // Create the JWT!
  const token = jwt.sign(payload, process.env.JWT_KEY!);

  // Build session Object {jwt: MY_JWT}
  const session = { jwt: token };

  // Turn that session into JSON
  const sessionJSON = JSON.stringify(session);

  // Take JSON and encode it as base64
  const base64 = Buffer.from(sessionJSON).toString('base64');

  // return a string thats the cookie with the encoded data
  return [`session=${base64}`];
};
