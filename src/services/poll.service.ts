import { db } from "@/db";
import { polls, pollOptions, pollVotes, messages } from "@/db/schema";
import { eq, and, sql } from "drizzle-orm";
import { sendMessage } from "@/services/message.service";

export async function createPoll(
  channelId: string,
  userId: string,
  question: string,
  options: string[],
  isAnonymous: boolean,
  isMultipleChoice: boolean,
  expiresAt?: Date
) {
  if (options.length < 2) {
    throw new Error("A poll requires at least 2 options");
  }

  // Create a message of type 'poll'
  const message = await sendMessage({
    channelId,
    userId,
    content: question,
    type: "poll",
  });

  // Create the poll record
  const [poll] = await db
    .insert(polls)
    .values({
      messageId: message.id,
      createdByUserId: userId,
      question,
      isAnonymous,
      isMultipleChoice,
      expiresAt: expiresAt || null,
    })
    .returning();

  // Insert poll options
  const optionRecords = await Promise.all(
    options.map((text, index) =>
      db
        .insert(pollOptions)
        .values({
          pollId: poll.id,
          text,
          sortOrder: index,
        })
        .returning()
    )
  );

  return {
    ...poll,
    options: optionRecords.map((r) => r[0]),
  };
}

export async function vote(
  pollId: string,
  optionId: string,
  userId: string
) {
  // Fetch the poll
  const [poll] = await db
    .select()
    .from(polls)
    .where(eq(polls.id, pollId))
    .limit(1);

  if (!poll) {
    throw new Error("Poll not found");
  }

  // Check if poll has expired
  if (poll.expiresAt && poll.expiresAt < new Date()) {
    throw new Error("Poll has expired");
  }

  // Verify the option belongs to this poll
  const [option] = await db
    .select()
    .from(pollOptions)
    .where(
      and(eq(pollOptions.id, optionId), eq(pollOptions.pollId, pollId))
    )
    .limit(1);

  if (!option) {
    throw new Error("Poll option not found");
  }

  // Check existing votes
  const existingVotes = await db
    .select()
    .from(pollVotes)
    .where(
      and(eq(pollVotes.pollId, pollId), eq(pollVotes.userId, userId))
    );

  if (!poll.isMultipleChoice && existingVotes.length > 0) {
    throw new Error(
      "You have already voted. This poll does not allow multiple choices."
    );
  }

  // Check if already voted for this specific option
  const alreadyVotedOption = existingVotes.find(
    (v) => v.pollOptionId === optionId
  );
  if (alreadyVotedOption) {
    throw new Error("You have already voted for this option");
  }

  const [voteRecord] = await db
    .insert(pollVotes)
    .values({
      pollId,
      pollOptionId: optionId,
      userId,
    })
    .returning();

  return voteRecord;
}

export async function removeVote(
  pollId: string,
  optionId: string,
  userId: string
) {
  const [existing] = await db
    .select()
    .from(pollVotes)
    .where(
      and(
        eq(pollVotes.pollId, pollId),
        eq(pollVotes.pollOptionId, optionId),
        eq(pollVotes.userId, userId)
      )
    )
    .limit(1);

  if (!existing) {
    throw new Error("Vote not found");
  }

  await db.delete(pollVotes).where(eq(pollVotes.id, existing.id));
}

export async function getPollResults(pollId: string) {
  const [poll] = await db
    .select()
    .from(polls)
    .where(eq(polls.id, pollId))
    .limit(1);

  if (!poll) {
    throw new Error("Poll not found");
  }

  const options = await db
    .select({
      id: pollOptions.id,
      text: pollOptions.text,
      sortOrder: pollOptions.sortOrder,
      voteCount: sql<number>`count(${pollVotes.id})::int`,
    })
    .from(pollOptions)
    .leftJoin(pollVotes, eq(pollVotes.pollOptionId, pollOptions.id))
    .where(eq(pollOptions.pollId, pollId))
    .groupBy(pollOptions.id, pollOptions.text, pollOptions.sortOrder)
    .orderBy(pollOptions.sortOrder);

  const totalVotes = options.reduce((sum, opt) => sum + opt.voteCount, 0);

  return {
    ...poll,
    options,
    totalVotes,
  };
}
