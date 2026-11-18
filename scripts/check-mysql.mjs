import { checkComplaintTable, getComplaintDistribution, getComplaintHeatmap } from '../complaint-distribution.mjs';

try {
  await checkComplaintTable();
  console.log('MySQL connection and table access verified.');
  const { rows } = await getComplaintDistribution();
  console.log('Aggregation verified. Date groups: ' + rows.length);
  const heatmap = await getComplaintHeatmap();
  console.log('Heatmap verified. Dates: ' + heatmap.dates.length + ', groups: ' + heatmap.rows.length + ', complaints: ' + heatmap.total + ', intense: ' + heatmap.high);
} catch (error) {
  console.error('MySQL check failed (' + (error.code || 'UNKNOWN') + ').');
  process.exitCode = 1;
}
