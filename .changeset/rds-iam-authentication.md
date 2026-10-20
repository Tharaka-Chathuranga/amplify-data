---
'@aws-amplify/data-schema-types': minor
'@aws-amplify/data-schema': minor
---

Add optional `authentication` to the SQL data source configuration accepted by `configure({ database })`. Set `authentication: { strategy: 'rdsIam' }` to mark the database as using RDS IAM database authentication; `connectionUri` still supplies the host, port, database name and username but may omit the password. Omitting `authentication` (or `{ strategy: 'password' }`) keeps the current behavior. SQL data sources only; this is metadata for downstream backend packages and does not generate IAM auth tokens.
