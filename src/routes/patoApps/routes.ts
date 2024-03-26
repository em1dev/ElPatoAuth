import { z } from 'zod';
import { app, handleError } from '../..';
import { ExternalServiceType } from '../../repository/types';
import { createOrUpdatePatoAppHandler } from './handlers/createOrUpdatePatoAppHandler';
import { getAppServicesHandler } from './handlers/getAppServicesHandler';

/**
 * Get pato app
 */
app.get('/app/:nameId', async (req, res) => {
  try {
    const name = z
      .string({ invalid_type_error: 'invalid app id'})
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
 * Create or update a pato app
 */
app.post('/app/:nameId', async (req, res) => {
  try {
    const name = z.string().min(3).max(200).parse(req.params.nameId);
    const requestSchema = z.array(z.object({
      type: z.nativeEnum(ExternalServiceType),
      clientSecret: z.string(),
      clientId: z.string()
    }));
    const externalService = requestSchema.parse(req.body);

    const created = await createOrUpdatePatoAppHandler(name, externalService);
    return res.status(201).send(created);
  } catch(err) {
    handleError(err, req, res);
  }
});