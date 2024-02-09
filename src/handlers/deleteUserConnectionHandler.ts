import { NotFoundError } from "../errors";
import { Repository } from "../repository"

export const deleteUserConnectionHandler = async (userId: number, appId: string, connectionTypeId: string, repository: Repository) => {
  const user = await repository.getUser(userId, appId);
  if (!user) throw new NotFoundError(`user ${userId} not found`);
  await repository.deleteUserConnection(userId, connectionTypeId);
}