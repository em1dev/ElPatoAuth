import { decrypt } from '../../../encryption';
import { NotFoundError } from '../../../errors';
import { getUserConnections } from '../../../repository/connectionRepository';
import { getUser } from '../../../repository/userRepository';

export const userConnectionsHandler = async (appId: string, userId: number) => {
  const user = await getUser(userId, appId);
  if (!user) throw new NotFoundError(`user ${userId} not found`);
  const data = await getUserConnections(user.id);
  return data.map(item => ({
    ...item,
    refresh_token: decrypt(item.refresh_token),
    token: decrypt(item.token)
  }));
};