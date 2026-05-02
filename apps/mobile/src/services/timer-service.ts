import { desc, eq } from "drizzle-orm";
import { v7 } from "uuid";
import { db } from "@/lib/db/client";
import { archives, timers } from "@/lib/db/schema";
import type { RestoredTimerState } from "@/types/timer";
import {
  clampTimerDurationSeconds,
  normalizePositiveTimerDurationSeconds,
} from "@/utils/timer-utils";

export type ArchiveRecord = typeof archives.$inferSelect;
export type TimerRecord = typeof timers.$inferSelect;

interface PauseTimerSessionInput {
  archiveId: string;
  elapsedSeconds: number;
  timerId: string;
}

interface FinishTimerSessionInput {
  archiveId: string;
  durationSeconds: number;
  timerId: string;
}

export const createDefaultRestoredTimerState = (
  durationSeconds: number
): RestoredTimerState => ({
  currentTimerId: null,
  durationSeconds,
  remainingSeconds: durationSeconds,
});

export async function getLatestRestoredTimerState(
  fallbackDurationSeconds: number
) {
  const latestTimerRecord = (
    await db
      .select()
      .from(timers)
      .orderBy(desc(timers.updatedAt), desc(timers.createdAt))
      .limit(1)
  ).at(0);

  if (!latestTimerRecord) {
    return createDefaultRestoredTimerState(fallbackDurationSeconds);
  }

  const durationSeconds = normalizePositiveTimerDurationSeconds(
    latestTimerRecord.durationSec,
    fallbackDurationSeconds
  );
  const elapsedSeconds = clampTimerDurationSeconds(
    latestTimerRecord.elapsedSec
  );
  const remainingSeconds = Math.max(durationSeconds - elapsedSeconds, 0);

  if (remainingSeconds === 0) {
    return createDefaultRestoredTimerState(durationSeconds);
  }

  return {
    currentTimerId: latestTimerRecord.id,
    durationSeconds,
    remainingSeconds,
  } satisfies RestoredTimerState;
}

export async function startTimerSession(durationSeconds: number) {
  const startedAt = new Date();
  const timerId = v7();
  const archiveId = v7();

  await db.transaction(async (tx) => {
    await tx.insert(timers).values({
      createdAt: startedAt,
      durationSec: durationSeconds,
      elapsedSec: 0,
      id: timerId,
      updatedAt: startedAt,
    });
    await tx.insert(archives).values({
      createdAt: startedAt,
      endAt: startedAt,
      id: archiveId,
      startAt: startedAt,
      timerId,
      updatedAt: startedAt,
    });
  });

  return { archiveId, timerId };
}

export async function pauseTimerSession({
  archiveId,
  elapsedSeconds,
  timerId,
}: PauseTimerSessionInput) {
  const pausedAt = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(timers)
      .set({
        elapsedSec: elapsedSeconds,
        updatedAt: pausedAt,
      })
      .where(eq(timers.id, timerId));
    await tx
      .update(archives)
      .set({
        endAt: pausedAt,
        updatedAt: pausedAt,
      })
      .where(eq(archives.id, archiveId));
  });
}

export async function restartTimerSession(timerId: string) {
  const restartedAt = new Date();
  const archiveId = v7();

  await db.insert(archives).values({
    createdAt: restartedAt,
    endAt: restartedAt,
    id: archiveId,
    startAt: restartedAt,
    timerId,
    updatedAt: restartedAt,
  });

  return { archiveId };
}

export async function finishTimerSession({
  archiveId,
  durationSeconds,
  timerId,
}: FinishTimerSessionInput) {
  const finishedAt = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(timers)
      .set({
        elapsedSec: durationSeconds,
        updatedAt: finishedAt,
      })
      .where(eq(timers.id, timerId));
    await tx
      .update(archives)
      .set({
        endAt: finishedAt,
        updatedAt: finishedAt,
      })
      .where(eq(archives.id, archiveId));
  });
}

export async function listArchiveRecords() {
  return await db.select().from(archives).orderBy(desc(archives.startAt));
}
