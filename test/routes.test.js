import request from 'supertest';
import app from '../src/app.js';

const assert = require('chai').assert;

describe('GET /', () => {
  it('should render properly', async () => {
    await request(app).get('/').expect(HTTP_STATUS.OK);
  });
});
