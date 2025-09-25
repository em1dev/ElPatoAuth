import { z } from 'zod';
import { app, handleError } from '../..';
import { ExternalServiceType } from '../../repository/types';
import { createOrUpdateAppHandler } from './handlers/createOrUpdateAppHandler';
import { getAppServicesHandler } from './handlers/getAppServicesHandler';

/**
 * Get app
 */
app.get('/app/:nameId', async (req, res) => {
  try {
    const name = z
      .string({ error: 'invalid app id'})
      .min(3)
      .max(200).parse(req.params.nameId);
    const services = await getAppServicesHandler(name);
    if (services.length === 0) return res.status(404).send();
    return res.status(200).send(services);
  } catch (e) {
    handleError(e, req, res);
  }
});

/**
 * Create or update a app
 */
app.post('/app/:nameId', async (req, res) => {
  try {
    const name = z.string().min(3).max(200).parse(req.params.nameId);
    const requestSchema = z.array(z.object({
      type: z.enum(ExternalServiceType),
      clientSecret: z.string(),
      clientId: z.string()
    }));
    const externalService = requestSchema.parse(req.body);

    const created = await createOrUpdateAppHandler(name, externalService);
    return res.status(201).send(created);
  } catch(err) {
    handleError(err, req, res);
  }
});