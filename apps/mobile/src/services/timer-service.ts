import { desc, eq } from "drizzle-orm";
import { v7 } from "uuid";
import { db } from "@/lib/db/client";
import { archives, timers } from "@/lib/db/schema";

export type ArchiveRecord = typeof archives.$inferSelect;

interface PauseTimerSessionInput {
  archiveId: string;
  elapsedSec: number;
  timerId: string;
}

interface FinishTimerSessionInput {
  archiveId: string;
  durationSec: number;
  timerId: string;
}

export async function startTimerSession(durationSec: number) {
  const startedAt = new Date();
  const timerId = v7();
  const archiveId = v7();

  await db.transaction(async (tx) => {
    await tx.insert(timers).values({
      createdAt: startedAt,
      durationSec,
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
  elapsedSec,
  timerId,
}: PauseTimerSessionInput) {
  const pausedAt = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(timers)
      .set({
        elapsedSec,
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
  durationSec,
  timerId,
}: FinishTimerSessionInput) {
  const finishedAt = new Date();

  await db.transaction(async (tx) => {
    await tx
      .update(timers)
      .set({
        elapsedSec: durationSec,
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

export async function listArchives() {
  return await db.select().from(archives).orderBy(desc(archives.startAt));
}
