import test from "node:test";
import assert from "node:assert/strict";
import { formatPersianDate } from "../app/lib/persian-date.mjs";

test("formats Persian calendar date with stable YYYY/MM/DD segments", () => {
  assert.equal(
    formatPersianDate(new Date("2026-11-20T12:00:00.000Z"), "UTC"),
    "1405/08/29",
  );
});

test("rejects invalid dates instead of emitting malformed date strings", () => {
  assert.throws(() => formatPersianDate(new Date(Number.NaN), "UTC"), RangeError);
});
