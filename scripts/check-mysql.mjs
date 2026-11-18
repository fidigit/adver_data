import { checkComplaintTable, getComplaintDistribution } from '../complaint-distribution.mjs';

try {
  await checkComplaintTable();
  console.log('MySQL connection and table access verified.');
  const { rows } = await getComplaintDistribution();
  console.log('Aggregation verified. Date groups: ' + rows.length);
} catch (error) {
  console.error('MySQL check failed (' + (error.code || 'UNKNOWN') + ').');
  process.exitCode = 1;
}
