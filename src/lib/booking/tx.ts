import { dbSource, getPglite, type Sql } from "@/lib/db";

const OID_INT8 = 20;
const OID_DATE = 1082;
const OID_INTERVAL = 1186;

function toSql(
  run: <T>(text: string, params: unknown[]) => Promise<T[]>,
): Sql {
  const sql = (async <T = Record<string, unknown>>(
    strings: TemplateStringsArray,
    ...values: unknown[]
  ): Promise<T[]> => {
    let text = strings[0] ?? "";
    for (let i = 0; i < values.length; i += 1) {
      text += `$${i + 1}${strings[i + 1] ?? ""}`;
    }
    return run<T>(text, values);
  }) as unknown as Sql;
  sql.query = <T = Record<string, unknown>>(
    text: string,
    params: unknown[] = [],
  ) => run<T>(text, params);
  return sql;
}

function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== "object") return false;
  const e = error as { code?: string; message?: string };
  return (
    e.code === "23505" ||
    e.code === "23514" ||
    /unique|duplicate|WHOLE_DAY_BLOCK|SLOT_BLOCK_CONFLICT/i.test(e.message ?? "")
  );
}

export function uniqueCode(error: unknown, fallback: string): string {
  const msg =
    error && typeof error === "object"
      ? String((error as { message?: string }).message ?? "")
      : "";
  if (/WHOLE_DAY_BLOCK/i.test(msg)) return "WHOLE_DAY_BLOCK_CONFLICT";
  if (/SLOT_BLOCK_CONFLICT/i.test(msg)) return "SLOT_BLOCK_CONFLICT_WITH_WHOLE_DAY";
  return fallback;
}

export { isUniqueViolation };

export async function withTransaction<T>(fn: (sql: Sql) => Promise<T>): Promise<T> {
  if (dbSource === "pglite") {
    const pg = await getPglite();
    return pg.transaction(async (tx) => {
      const sql = toSql(async <TRow>(text: string, params: unknown[]) => {
        const result = await tx.query<TRow>(text, params);
        return result.rows;
      });
      return fn(sql);
    });
  }

  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set");
  }

  const { Client, types } = await import("pg");
  types.setTypeParser(OID_INT8, Number);
  types.setTypeParser(OID_DATE, (v) => v);
  types.setTypeParser(OID_INTERVAL, (v) => v);
  const client = new Client({ connectionString });
  await client.connect();
  try {
    await client.query("begin");
    const sql = toSql(async <TRow>(text: string, params: unknown[]) => {
      const result = await client.query(text, params);
      return result.rows as TRow[];
    });
    const out = await fn(sql);
    await client.query("commit");
    return out;
  } catch (error) {
    try {
      await client.query("rollback");
    } catch {
      /* ignore */
    }
    throw error;
  } finally {
    await client.end();
  }
}
