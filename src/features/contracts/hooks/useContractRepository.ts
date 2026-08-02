import { useRepositories } from '../../../repositories/RepositoryProvider';
import { ContractRepository } from '../repositories/ContractRepository';

export function useContractRepository(): ContractRepository {
  const repos = useRepositories();
  return repos.contractRepository;
}
