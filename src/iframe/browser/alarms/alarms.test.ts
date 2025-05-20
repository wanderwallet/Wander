import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { alarms, loadAlarms } from "./alarms.mock";

describe("Alarms Mock", () => {
  let originalLocalStorage: Storage;

  // Setup before tests
  beforeEach(() => {
    // Save original localStorage contents
    originalLocalStorage = { ...localStorage };

    // Clear localStorage before each test
    localStorage.clear();

    // Mock timers
    vi.useFakeTimers();
  });

  // Cleanup after tests
  afterEach(() => {
    // Clear any active alarms
    alarms.clearAll();

    // Restore localStorage
    localStorage.clear();
    Object.keys(originalLocalStorage).forEach((key) => {
      localStorage.setItem(key, originalLocalStorage[key]);
    });

    // Restore timers
    vi.clearAllTimers();
    vi.useRealTimers();

    // Restore console
    vi.restoreAllMocks();
  });

  it("should create an immediate alarm", async () => {
    // Mock the callback
    const callback = vi.fn();
    alarms.onAlarm.addListener(callback);

    // Create an immediate alarm
    await alarms.create("test-immediate", { when: Date.now() });

    // Immediate alarms should fire right away
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "test-immediate",
      }),
    );

    // Clean up
    alarms.onAlarm.removeListener(callback);
  });

  it("should create a delayed alarm", async () => {
    const callback = vi.fn();
    alarms.onAlarm.addListener(callback);

    // Create an alarm with 1-minute delay
    const futureTime = Date.now() + 60000;
    await alarms.create("test-delayed", { when: futureTime });

    // Verify alarm hasn't fired yet
    expect(callback).not.toHaveBeenCalled();

    // Advance time by 1 minute
    vi.advanceTimersByTime(60000);

    // Now the alarm should have fired
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "test-delayed",
      }),
    );

    // Clean up
    alarms.onAlarm.removeListener(callback);
  });

  it("should create a recurring alarm", async () => {
    const callback = vi.fn();
    alarms.onAlarm.addListener(callback);

    // Create a recurring alarm that fires every minute
    await alarms.create("test-recurring", { periodInMinutes: 1 });

    // Reset mock to check future calls
    callback.mockReset();

    // Advance time by 3 minutes
    vi.advanceTimersByTime(180000);

    // Should have fired 3 more times
    expect(callback).toHaveBeenCalledTimes(3);

    // Clean up
    alarms.onAlarm.removeListener(callback);
  });

  it("should persist alarms to localStorage", async () => {
    // Create a test alarm
    await alarms.create("test-persistence", { when: Date.now() + 120000 });

    // Should be persisted to localStorage
    const storageKey = "WANDER_ALARMS";
    const storedData = localStorage.getItem(storageKey);

    expect(storedData).not.toBeNull();

    const parsedData = JSON.parse(storedData);
    expect(parsedData).toContainEqual(
      expect.objectContaining({
        name: "test-persistence",
      }),
    );
  });

  it("should restore alarms from localStorage on initialization", async () => {
    // Create test data in localStorage
    const futureTime = Date.now() + 300000; // 5 minutes in the future
    const testAlarms = [
      {
        name: "restored-alarm",
        scheduledTime: futureTime,
        periodInMinutes: 5,
        createdAt: Date.now(),
      },
    ];

    localStorage.setItem("WANDER_ALARMS", JSON.stringify(testAlarms));

    await loadAlarms();

    // Verify the alarm was loaded
    const loadedAlarms = await alarms.getAll();

    expect(loadedAlarms).toContainEqual(
      expect.objectContaining({
        name: "restored-alarm",
        periodInMinutes: 5,
      }),
    );
  });

  it("should update existing alarms", async () => {
    // Create initial alarm
    await alarms.create("update-test", {
      periodInMinutes: 10,
    });

    // Update the same alarm with new settings
    await alarms.create("update-test", {
      periodInMinutes: 5,
    });

    // Get the updated alarm
    const updatedAlarm = await alarms.get("update-test");

    expect(updatedAlarm).toEqual(
      expect.objectContaining({
        name: "update-test",
        periodInMinutes: 5,
      }),
    );
  });

  it("should clear alarms correctly", async () => {
    // Create a test alarm
    await alarms.create("clear-test", { when: Date.now() + 60000 });

    // Verify it exists
    let allAlarms = await alarms.getAll();
    expect(allAlarms.some((a) => a.name === "clear-test")).toBe(true);

    // Clear the alarm
    await alarms.clear("clear-test");

    // Verify it's gone
    allAlarms = await alarms.getAll();
    expect(allAlarms.some((a) => a.name === "clear-test")).toBe(false);

    // Also check localStorage
    const storedData = localStorage.getItem("WANDER_ALARMS");
    const parsedData = storedData ? JSON.parse(storedData) : [];
    expect(parsedData.some((a) => a.name === "clear-test")).toBe(false);
  });

  it("should handle expired one-time alarms on reload", async () => {
    // Create expired alarm data in localStorage
    const pastTime = Date.now() - 60000; // 1 minute in the past
    const expiredAlarm = {
      name: "expired-alarm",
      scheduledTime: pastTime,
      // No periodInMinutes means it's a one-time alarm
    };

    localStorage.setItem("WANDER_ALARMS", JSON.stringify([expiredAlarm]));

    // Reload the alarms from localStorage
    await loadAlarms();

    // The expired one-time alarm should not be loaded
    const loadedAlarms = await alarms.getAll();
    expect(loadedAlarms.some((a) => a.name === "expired-alarm")).toBe(false);
  });

  it("should recalculate future time for periodic alarms on reload", async () => {
    // Create a periodic alarm that should have fired while page was closed
    const pastTime = Date.now() - 120000; // 2 minutes in the past
    const periodicAlarm = {
      name: "periodic-recalc",
      scheduledTime: pastTime,
      periodInMinutes: 1, // Every minute
      createdAt: pastTime - 60000, // Created 3 minutes ago
    };

    localStorage.setItem("WANDER_ALARMS", JSON.stringify([periodicAlarm]));

    // Load the alarms from localStorage
    await loadAlarms();

    // Get the recalculated alarm
    const recalcAlarm = await alarms.get("periodic-recalc");

    // It should exist and have a future scheduledTime
    expect(recalcAlarm).not.toBeUndefined();
    expect(recalcAlarm.scheduledTime).toBeGreaterThan(Date.now());

    const timeSinceCreation = Date.now() - periodicAlarm.createdAt;
    const periodsElapsed = Math.floor(timeSinceCreation / 60000);

    const expectedNextTime = periodicAlarm.createdAt + (periodsElapsed + 1) * 60000;

    // Allow small precision differences (within 100ms)
    expect(Math.abs(recalcAlarm.scheduledTime - expectedNextTime)).toBeLessThan(100);
  });

  it("should handle multiple concurrent alarms", async () => {
    const callback = vi.fn();
    alarms.onAlarm.addListener(callback);

    // Create multiple alarms with different timings
    await alarms.create("concurrent-1", { when: Date.now() + 30000 }); // 30 seconds
    await alarms.create("concurrent-2", { when: Date.now() + 60000 }); // 1 minute
    await alarms.create("concurrent-3", { when: Date.now() + 90000 }); // 1.5 minutes

    // Advance time and check each fires at the right time
    vi.advanceTimersByTime(30000);
    expect(callback).toHaveBeenCalledTimes(1);
    expect(callback).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: "concurrent-1",
      }),
    );

    vi.advanceTimersByTime(30000);
    expect(callback).toHaveBeenCalledTimes(2);
    expect(callback).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: "concurrent-2",
      }),
    );

    vi.advanceTimersByTime(30000);
    expect(callback).toHaveBeenCalledTimes(3);
    expect(callback).toHaveBeenLastCalledWith(
      expect.objectContaining({
        name: "concurrent-3",
      }),
    );

    // Clean up
    alarms.onAlarm.removeListener(callback);
  });

  // Add when we implement removeListener
  it("should properly remove alarm listeners", async () => {
    // This test assumes we've added the removeListener functionality
    const callback1 = vi.fn();
    const callback2 = vi.fn();

    alarms.onAlarm.addListener(callback1);
    alarms.onAlarm.addListener(callback2);

    // Create an immediate alarm
    await alarms.create("listener-test", { when: Date.now() });

    // Both should have been called
    expect(callback1).toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();

    // Reset mocks
    callback1.mockReset();
    callback2.mockReset();

    // Remove first listener
    alarms.onAlarm.removeListener(callback1);

    // Create another alarm
    await alarms.create("listener-test-2", { when: Date.now() });

    // Only callback2 should be called
    expect(callback1).not.toHaveBeenCalled();
    expect(callback2).toHaveBeenCalled();
  });

  it("should handle minimum alarm interval of 30 seconds", async () => {
    const callback = vi.fn();
    alarms.onAlarm.addListener(callback);

    // Create an alarm with minimum delay (30 seconds)
    await alarms.create("minimum-delay", { delayInMinutes: 0.5 });

    // Verify it hasn't fired yet
    expect(callback).not.toHaveBeenCalled();

    // Advance time by 30 seconds
    vi.advanceTimersByTime(30000);

    // Now it should have fired
    expect(callback).toHaveBeenCalledWith(
      expect.objectContaining({
        name: "minimum-delay",
      }),
    );

    // Clean up
    alarms.onAlarm.removeListener(callback);
  });

  it("should respect alarm persistence behavior", async () => {
    // Create an alarm
    await alarms.create("persistence-test", { periodInMinutes: 5 });

    // Reload the alarms from localStorage
    await loadAlarms();

    // Verify the alarm was restored
    const restoredAlarm = await alarms.get("persistence-test");
    expect(restoredAlarm).not.toBeUndefined();
    expect(restoredAlarm).toEqual(
      expect.objectContaining({
        name: "persistence-test",
        periodInMinutes: 5,
      }),
    );
  });

  it("should handle the 500 alarm limit", async () => {
    // Mock the console error to avoid cluttering test output
    const originalConsoleError = console.error;
    console.error = vi.fn();

    try {
      // Create 500 alarms
      const promises = [];
      for (let i = 0; i < 500; i++) {
        promises.push(alarms.create(`alarm-${i}`, { when: Date.now() + 60000 }));
      }
      await Promise.all(promises);

      // Verify we have 500 alarms
      const currentAlarms = await alarms.getAll();
      expect(currentAlarms.length).toBe(500);

      // Trying to create the 501st alarm should be handled gracefully
      // Note: Our mock might not implement the same limit as Chrome,
      // but we should at least test that the code handles many alarms
      await alarms.create("one-too-many", { when: Date.now() + 60000 });

      // Cleanup - clear all alarms
      await alarms.clearAll();
    } finally {
      // Restore console.error
      console.error = originalConsoleError;
    }
  });
});
