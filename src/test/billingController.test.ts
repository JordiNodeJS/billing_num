import { expect } from 'chai';
import request from 'supertest';
import app from '../index'; // Asegúrate de que este es el punto de entrada de tu aplicación

describe('BillingController', () => {
  describe('updateBillingNumbers', () => {
    it('should return a JSON with the status of the updates', async () => {
      const res = await request(app)
        .post('/api/update-billing-numbers') // Asegúrate de que esta es la ruta correcta
        .send();

      expect(res.status).to.equal(200);
      expect(res.body).to.have.property('total');
      expect(res.body).to.have.property('updated');
      expect(res.body).to.have.property('skipped');
      expect(res.body).to.have.property('errors');
      expect(res.body).to.have.property('results');
    });
  });
});