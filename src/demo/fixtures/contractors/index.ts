import { ContractorProfile } from '../../../types';
import { venueFixtures } from './venues';
import { hostFixtures } from './hosts';
import { djFixtures } from './djs';
import { photographerFixtures } from './photographers';
import { videographerFixtures } from './videographers';
import { decoratorFixtures } from './decorators';
import { catererFixtures } from './caterers';
import { technicalFixtures } from './technical';
import { artistFixtures } from './artists';
import { transportFixtures } from './transport';
import { organizerFixtures } from './organizers';

export * from './venues';
export * from './hosts';
export * from './djs';
export * from './photographers';
export * from './videographers';
export * from './decorators';
export * from './caterers';
export * from './technical';
export * from './artists';
export * from './transport';
export * from './organizers';

export const allContractorFixtures: ContractorProfile[] = [
  ...venueFixtures,
  ...hostFixtures,
  ...djFixtures,
  ...photographerFixtures,
  ...videographerFixtures,
  ...decoratorFixtures,
  ...catererFixtures,
  ...technicalFixtures,
  ...artistFixtures,
  ...transportFixtures,
  ...organizerFixtures
];
