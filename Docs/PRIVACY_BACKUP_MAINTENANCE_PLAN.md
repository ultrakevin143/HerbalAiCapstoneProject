# Herbal AI Privacy, Backup, and Maintenance Plan

## Privacy and data handling

The platform stores account identity data (name, username, email, avatar, profile bio), authentication tokens, user-generated content, private messages, suggestion data, uploaded image references, audit entries, and notification records. Dr. Ai prompts and responses must be treated as potentially sensitive health-adjacent information.

Required operating rules:

1. Do not collect medical records, diagnoses, prescriptions, or government identifiers.
2. Show the Dr. Ai informational/safety disclaimer before use and in relevant responses.
3. Restrict administrative, private-message, and token data to authorized staff or the involved user.
4. Keep production secrets outside the repository; rotate them after exposure or staff departure.
5. Provide a documented account-deletion request path and remove/anonymize associated personal data where legally and operationally appropriate.
6. Define and publish retention periods before public deployment; suggested initial policy: inactive account data and private messages are retained only while needed for service/support, then reviewed for deletion or anonymization.
7. Do not use production personal data in tests, demonstrations, or screenshots.

## Backup and restore

| Item | Minimum procedure | Frequency | Owner |
|---|---|---|---|
| PostgreSQL database | Encrypted logical backup using `pg_dump` | Daily | Deployment administrator |
| Uploaded images | Confirm Cloudinary backup/export policy | Weekly review | Deployment administrator |
| Environment/secrets | Store in approved secret manager or encrypted offline record | On every change | Project lead |
| Restore test | Restore latest backup to a non-production database and validate application access | Monthly and before defense | Backend lead |

Example database backup command, run only on the secured server:

```bash
docker compose exec -T postgres pg_dump -U "$POSTGRES_USER" "$POSTGRES_DB" > herbalai-backup-YYYY-MM-DD.sql
```

Recovery sequence: place the application in maintenance mode, preserve the failed database volume for investigation, restore into a clean database, run health checks and a smoke test, then record the incident and recovery time.

## Maintenance schedule

| Frequency | Work |
|---|---|
| Every deployment | Run tests, lint, type checks, production build, and database migration review |
| Weekly | Review errors, failed emails, admin actions, disk space, Docker health, and dependency advisories |
| Monthly | Apply approved dependency/security updates; perform backup-restore test; review access/roles |
| Quarterly | Rotate secrets where practical; review privacy retention and capacity/performance trends |

## Incident priorities

- **Critical:** credential exposure, unauthorized access, data loss, outage, or unsafe AI behavior. Contain immediately, rotate affected secrets, preserve evidence, and notify the adviser/project lead.
- **Major:** required workflow fails or data is incorrect. Create defect record, prioritize repair, and retest before release.
- **Minor:** usability or cosmetic problem with a workaround. Track and schedule according to release capacity.
