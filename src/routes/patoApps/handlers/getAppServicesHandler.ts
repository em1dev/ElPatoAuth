import { decrypt } from '../../../encryption';
import { getAppServices } from '../../../repository/appRepository';

export const getAppServicesHandler = async (appName: string) => {
  const servicesEncrypted = await getAppServices(appName);
  const decryptedServices = servicesEncrypted.map(service => ({
    ...service,
    clientId: decrypt(service.clientId),
    clientSecret: decrypt(service.clientSecret)
  }));

  return decryptedServices;
};