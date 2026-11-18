import { createConnection } from 'mysql2/promise';

const table = 'hiido_report_marki_user_sen_ai_result';
const scenes = [
  '广告位置过多',
  '广告自动下载',
  '广告无法回到APP',
  '广告关不掉',
  '广告强制跳转或误触',
  '广告干扰使用或等待过长',
  '广告诱导消费或收费争议',
  '广告不满但原因不明',
];
export const complaintSeries = ['总投诉数', ...scenes];

async function read(sql, values = []) {
  if (!process.env.MYSQL_PASSWORD) {
    throw Object.assign(new Error('MySQL password is missing'), { code: 'MYSQL_NOT_CONFIGURED' });
  }
  const connection = await createConnection({
    host: process.env.MYSQL_HOST || '10.130.87.26',
    port: Number(process.env.MYSQL_PORT || 10130),
    user: process.env.MYSQL_USER || 'sodadev_o',
    database: process.env.MYSQL_DATABASE || 'hiido_report',
    password: process.env.MYSQL_PASSWORD,
    dateStrings: true,
    connectTimeout: 8000,
  });
  try {
    const [rows] = await connection.query({ sql, timeout: 30000 }, values);
    return rows;
  } finally {
    connection.destroy();
  }
}

export async function checkComplaintTable() {
  await read('SELECT dt, complaint_id, content_scene FROM ' + table + ' LIMIT 0');
}

const sceneCounts = scenes.map((_, index) =>
  'COUNT(DISTINCT CASE WHEN content_scene = ? THEN complaint_id END) AS scene_' + index
).join(', ');
const sql = 'SELECT dt, COUNT(DISTINCT complaint_id) AS total, ' + sceneCounts +
  ' FROM ' + table + ' WHERE dt IS NOT NULL GROUP BY dt ORDER BY dt';

let pending;
let cached;
let expires = 0;

export function getComplaintDistribution() {
  if (Date.now() < expires) return Promise.resolve(cached);
  pending ??= read(sql, scenes).then(rows => {
    cached = {
      series: complaintSeries,
      rows: rows.map(row => ({
        date: String(row.dt),
        counts: [Number(row.total), ...scenes.map((_, index) => Number(row['scene_' + index]))],
      })),
    };
    expires = Date.now() + 60000;
    return cached;
  }).finally(() => { pending = undefined; });
  return pending;
}
