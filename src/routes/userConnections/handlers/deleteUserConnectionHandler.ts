import { NotFoundError } from '../../../errors';
import { deleteUserConnection } from '../../../repository/connectionRepository';
import { ConnectionType } from '../../../repository/types';
import { getUser } from '../../../repository/userRepository';

export const deleteUserConnectionHandler = async (userId: number, appId: string, connectionTypeId: ConnectionType) => {
  const user = await getUser(userId, appId);
  if (!user) throw new NotFoundError(`user ${userId} not found`);
  // TODO - remove connection using external api
  await deleteUserConnection(userId, connectionTypeId);
};