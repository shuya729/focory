import { desc, eq } from "drizzle-orm";
import { v7 } from "uuid";
import { db } from "@/lib/db/client";
import { archives, timers } from "@/lib/db/schema";
import type {
  FinishTimerSessionInput,
  PauseTimerSessionInput,
  ResetTimerInput,
  TimerRepository,
} from "@/types/timer";

export const timerRepository: TimerRepository = {
  findLatestTimer() {
    return db
      .select({
        id: timers.id,
        durationSeconds: timers.durationSec,
        elapsedSeconds: timers.elapsedSec,
      })
      .from(timers)
      .orderBy(desc(timers.updatedAt), desc(timers.createdAt))
      .limit(1)
      .get();
  },
  startSession(durationSeconds: number) {
    const startedAt = new Date();
    const timerId = v7();
    const archiveId = v7();

    db.transaction((tx) => {
      tx.insert(timers)
        .values({
          createdAt: startedAt,
          durationSec: durationSeconds,
          elapsedSec: 0,
          id: timerId,
          updatedAt: startedAt,
        })
        .run();
      tx.insert(archives)
        .values({
          createdAt: startedAt,
          endAt: startedAt,
          id: archiveId,
          startAt: startedAt,
          timerId,
          updatedAt: startedAt,
        })
        .run();
    });

    return { archiveId, timerId };
  },
  pauseSession({ archiveId, elapsedSeconds, timerId }: PauseTimerSessionInput) {
    const pausedAt = new Date();

    db.transaction((tx) => {
      tx.update(timers)
        .set({
          elapsedSec: elapsedSeconds,
          updatedAt: pausedAt,
        })
        .where(eq(timers.id, timerId))
        .run();
      tx.update(archives)
        .set({
          endAt: pausedAt,
          updatedAt: pausedAt,
        })
        .where(eq(archives.id, archiveId))
        .run();
    });
  },
  restartSession(timerId: string) {
    const restartedAt = new Date();
    const archiveId = v7();

    db.insert(archives)
      .values({
        createdAt: restartedAt,
        endAt: restartedAt,
        id: archiveId,
        startAt: restartedAt,
        timerId,
        updatedAt: restartedAt,
      })
      .run();

    return { archiveId };
  },
  finishSession({
    archiveId,
    durationSeconds,
    timerId,
  }: FinishTimerSessionInput) {
    const finishedAt = new Date();

    db.transaction((tx) => {
      tx.update(timers)
        .set({
          elapsedSec: durationSeconds,
          updatedAt: finishedAt,
        })
        .where(eq(timers.id, timerId))
        .run();
      tx.update(archives)
        .set({
          endAt: finishedAt,
          updatedAt: finishedAt,
        })
        .where(eq(archives.id, archiveId))
        .run();
    });
  },
  resetTimer({ timerId, durationSeconds }: ResetTimerInput) {
    db.update(timers)
      .set({
        durationSec: durationSeconds,
        elapsedSec: 0,
        updatedAt: new Date(),
      })
      .where(eq(timers.id, timerId))
      .run();
  },
};
