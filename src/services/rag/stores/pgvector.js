const { Pool } = require("pg");
const logger = require("../../../config/logger");

const METADATA_COLUMNS = [
  "service_id", "resource_id", "address_id", "latitude", "longitude",
  "schedule", "category_ids", "category_names", "parent_category_names",
  "sfsg_category_ids", "sfsg_category_names",
  "ucsf_top_category_ids", "ucsf_top_category_names",
  "ucsf_sub_category_ids", "ucsf_sub_category_names",
  "our415_category_ids", "our415_category_names",
  "eligibility_age", "eligibility_education", "eligibility_employment",
  "eligibility_ethnicity", "eligibility_family_status", "eligibility_financial",
  "eligibility_gender", "eligibility_health", "eligibility_immigration",
  "eligibility_housing", "eligibility_other", "eligibility_all",
];

async function createVectorStore(embeddings) {
  const host = process.env.PGVECTOR_HOST || "localhost";
  const port = parseInt(process.env.PGVECTOR_PORT || "5432", 10);
  const database = process.env.PGVECTOR_DB || "sheltertech";
  const user = process.env.PGVECTOR_USER || "postgres";
  const password = process.env.PGVECTOR_PASSWORD || "mypassword";
  const tableName = process.env.PGVECTOR_TABLE || "service_snapshots";

  logger.info(`Connecting to pgvector at ${host}:${port}/${database}, table: ${tableName}`);

  const pool = new Pool({ host, port, database, user, password });
  await pool.query("SELECT 1");
  logger.info("pgvector store connected");

  const selectColumns = ["embedding_text", ...METADATA_COLUMNS].join(", ");

  return {
    asRetriever({ k = 4 } = {}) {
      return {
        async invoke(question) {
          const queryVector = await embeddings.embedQuery(question);
          const vectorLiteral = `[${queryVector.join(",")}]`;

          const { rows } = await pool.query(
            `SELECT ${selectColumns}
             FROM ${tableName}
             ORDER BY embedding <=> $1::vector
             LIMIT $2`,
            [vectorLiteral, k]
          );

          return rows.map((row) => ({
            pageContent: row.embedding_text ?? "",
            metadata: Object.fromEntries(
              METADATA_COLUMNS.map((col) => [col, row[col]])
            ),
          }));
        },
      };
    },
  };
}

module.exports = { createVectorStore };
