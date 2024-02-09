import { decrypt } from "../encryption";
import { NotFoundError } from "../errors";
import { Repository } from "../repository";

export const userConnectionsHandler = async (appId: string, userId: number, repository: Repository) => {
  const user = await repository.getUser(userId, appId);
  if (!user) throw new NotFoundError(`user ${userId} not found`);
  const data = await repository.getUserConnections(user.id);
  return data.map(item => ({
    ...item,
    refresh_token: decrypt(item.refresh_token),
    token: decrypt(item.token)
  }))
};