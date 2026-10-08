import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

const evidence = JSON.parse(readFileSync(new URL("../../Docs/research/HERB_PROVIDER_TARGET_FOLLOW_UP_2026-10-05.json", import.meta.url), "utf8"));

describe("read-only herb provider target evidence", () => {
  it("matches the configured pooled host to the selected Neon endpoint and database", () => {
    expect(evidence.railway.configuredDatabaseHost).toBe(`${evidence.neon.computeEndpointId}-pooler.c-8.us-east-1.aws.neon.tech`);
    expect(evidence.railway.configuredDatabaseName).toBe(evidence.neon.database);
    expect(evidence.configuredTargetMatchesNeonBranch).toBe(true);
    expect(evidence.neon.branchId).toBe("br-still-waterfall-aqtagztm");
  });

  it("records observed counts without manufacturing an all-state duplicate or import pass", () => {
    expect(evidence.neon).toMatchObject({ herbRows: 38, publishedRows: 38, suggestionRows: 17, queryMode: "SELECT_ONLY" });
    expect(evidence.neon.identityFingerprint).toMatch(/^[a-f0-9]{32}$/);
    expect(evidence.limitations.join(" ")).toMatch(/not a fresh all-state row-level duplicate comparison/);
    expect(evidence).toMatchObject({ writesPerformed: 0, stagingAllowed: false, publicationAllowed: false });
    expect(evidence).not.toHaveProperty("herbs");
  });

  it("stores no credentials and does not change or replace service variables", () => {
    expect(evidence.railway).toMatchObject({ credentialsRecorded: false, variableChanged: false, variableValueRehidden: true });
    const serialized = JSON.stringify(evidence);
    expect(serialized).not.toMatch(/postgres(?:ql)?:\/\//i);
    expect(serialized).not.toMatch(/"(?:password|secret|username|connectionString)"\s*:/i);
    expect(evidence.limitations.join(" ")).toMatch(/ep-purple-frog.*different endpoint/);
  });
});
