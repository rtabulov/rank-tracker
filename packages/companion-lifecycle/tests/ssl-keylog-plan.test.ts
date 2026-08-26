import { describe, expect, test } from "vite-plus/test";
import { SSLKEYLOGFILE_ENV, sslKeyLogPlan } from "../src/ssl-keylog-plan.ts";

describe("sslKeyLogPlan", () => {
  test("uses SSLKEYLOGFILE env name", () => {
    expect(SSLKEYLOGFILE_ENV).toBe("SSLKEYLOGFILE");
    const plan = sslKeyLogPlan("C:\\Users\\player");
    expect(plan.envName).toBe("SSLKEYLOGFILE");
  });

  test("places key log under per-user Local AppData companion tls dir", () => {
    const plan = sslKeyLogPlan("C:\\Users\\player");
    expect(plan.scope).toBe("per-user");
    expect(plan.keyLogDirPath).toBe("C:\\Users\\player\\AppData\\Local\\RankTrackerCompanion\\tls");
    expect(plan.keyLogFilePath).toBe(
      "C:\\Users\\player\\AppData\\Local\\RankTrackerCompanion\\tls\\sslkeys.log",
    );
  });

  test("requires restrictive ACL on the key-log directory", () => {
    const plan = sslKeyLogPlan("D:\\Profiles\\alice");
    expect(plan.requiresRestrictiveAcl).toBe(true);
  });

  test("normalizes trailing separators on the profile dir", () => {
    const plan = sslKeyLogPlan("C:\\Users\\player\\");
    expect(plan.keyLogFilePath).toBe(
      "C:\\Users\\player\\AppData\\Local\\RankTrackerCompanion\\tls\\sslkeys.log",
    );
  });
});
