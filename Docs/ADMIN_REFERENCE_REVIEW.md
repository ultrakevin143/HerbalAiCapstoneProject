# Admin submission review

Open Admin → Pending Reviews → Edit & references to correct a pending herb and record the reason for edits. References include title, publisher, HTTP(S) URL or citation, publication date, and supported claims. Save before approving. Existing contributor source text remains available for review.

The editor accepts up to 20 references and requires at least one. Public approval requires saved, valid references and the current submission revision. The publication transaction copies each reference into the public herb sources, preserving its claim scope. Editing requires an administrator; contributors continue using the separate resubmission endpoint.

Each admin edit stores before/after submission snapshots in the existing audit log within the edit transaction. Concurrent edits are rejected using a revision counter. Approval also checks the revision used to generate the embedding. Contributor resubmission increments that revision and clears the previously reviewed references so the revised content must be reviewed again.

Apply the `20260913150000_suggestion_references` migration and regenerate Prisma before running the updated backend. No existing herb records are changed by the migration. Older pending suggestions require an admin to enter structured references before publication.
