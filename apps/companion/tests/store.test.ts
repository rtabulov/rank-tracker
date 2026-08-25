import { describe, expect, test } from "vite-plus/test";
import { dispatch, getState } from "../src/store.ts";

describe("companion store", () => {
  test("accepting risk moves to elevate", () => {
    dispatch({ type: "RESET" });
    dispatch({ type: "ACCEPT_RISK" });
    expect(getState().phase).toBe("elevate");
  });
});
