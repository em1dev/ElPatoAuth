import { decrypt, encrypt } from '../../../encryption';
import { createOrUpdateApp, getAppServices } from '../../../repository/appRepository';
import { ExternalServiceType } from '../../../repository/types';

export const createOrUpdateAppHandler = async (
  appName: string, 
  externalServices: Array<{ 
    type: ExternalServiceType,
    clientSecret: string,
    clientId: string 
  }>) => {

  const newExternalServicesEncrypted = externalServices.map(service => ({
    ...service,
    clientSecret: encrypt(service.clientSecret),
    clientId: encrypt(service.clientId)
  }));

  await createOrUpdateApp(appName, newExternalServicesEncrypted);

  const servicesEncrypted = await getAppServices(appName);
  const servicesDecrypted = servicesEncrypted.map(service => ({
    ...service,
    clientSecret: decrypt(service.clientSecret),
    clientId: decrypt(service.clientId)
  }));

  return servicesDecrypted;
};