import "dotenv/config";
import pg from "pg";

type TableCheck = {
  table: string;
  dateColumn?: string;
  idColumn?: string;
};

const checks: TableCheck[] = [
  { table: "jobs", dateColumn: "date_posted", idColumn: "id" },
  { table: "users", dateColumn: "updated_at", idColumn: "id" },
  { table: "invoices", dateColumn: "updated_at", idColumn: "id" },
  { table: "countries", dateColumn: "created_at", idColumn: "id" },
  { table: "cities", dateColumn: "created_at", idColumn: "id" },
  { table: "sectors", dateColumn: "created_at", idColumn: "id" },
];

const sourceUrl = process.env.SOURCE_DATABASE_URL;
const targetUrl = process.env.TARGET_DATABASE_URL;

if (!sourceUrl || !targetUrl) {
  console.error("Set SOURCE_DATABASE_URL and TARGET_DATABASE_URL before running this script.");
  process.exit(1);
}

const source = new pg.Pool({ connectionString: sourceUrl });
const target = new pg.Pool({ connectionString: targetUrl });

const quoteIdent = (identifier: string) => `"${identifier.replace(/"/g, '""')}"`;

async function tableExists(pool: pg.Pool, table: string) {
  const result = await pool.query(
    "select exists (select 1 from information_schema.tables where table_schema = 'public' and table_name = $1) as exists",
    [table],
  );
  return Boolean(result.rows[0]?.exists);
}

async function summarize(pool: pg.Pool, check: TableCheck) {
  if (!(await tableExists(pool, check.table))) {
    return { exists: false, count: 0, maxId: null as number | null, latest: null as string | null };
  }

  const table = quoteIdent(check.table);
  const countResult = await pool.query(`select count(*)::int as count from ${table}`);
  const count = Number(countResult.rows[0]?.count || 0);

  let maxId: number | null = null;
  if (check.idColumn) {
    const id = quoteIdent(check.idColumn);
    const idResult = await pool.query(`select max(${id})::int as max_id from ${table}`);
    maxId = idResult.rows[0]?.max_id ?? null;
  }

  let latest: string | null = null;
  if (check.dateColumn) {
    const date = quoteIdent(check.dateColumn);
    const dateResult = await pool.query(`select max(${date}) as latest from ${table}`);
    latest = dateResult.rows[0]?.latest ? new Date(dateResult.rows[0].latest).toISOString() : null;
  }

  return { exists: true, count, maxId, latest };
}

function compareValue<T>(sourceValue: T, targetValue: T) {
  return Object.is(sourceValue, targetValue) ? "OK" : "DIFF";
}

try {
  console.log("Read-only database comparison");
  console.log("Source should be the current live Replit database.");
  console.log("Target should be Neon or Supabase candidate database.");
  console.log("");

  for (const check of checks) {
    const sourceSummary = await summarize(source, check);
    const targetSummary = await summarize(target, check);

    console.log(`Table: ${check.table}`);
    if (!sourceSummary.exists || !targetSummary.exists) {
      console.log(`  exists: source=${sourceSummary.exists} target=${targetSummary.exists} ${compareValue(sourceSummary.exists, targetSummary.exists)}`);
      continue;
    }

    console.log(`  rows:   source=${sourceSummary.count} target=${targetSummary.count} ${compareValue(sourceSummary.count, targetSummary.count)}`);
    console.log(`  max id: source=${sourceSummary.maxId ?? "n/a"} target=${targetSummary.maxId ?? "n/a"} ${compareValue(sourceSummary.maxId, targetSummary.maxId)}`);
    console.log(`  latest: source=${sourceSummary.latest ?? "n/a"} target=${targetSummary.latest ?? "n/a"} ${compareValue(sourceSummary.latest, targetSummary.latest)}`);
  }
} finally {
  await source.end();
  await target.end();
}
