import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";
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

  const supabase = createClient(await cookies());

  // Create a message of type 'poll'
  const message = await sendMessage({
    channelId,
    userId,
    content: question,
    type: "poll",
  });

  // Create the poll record
  const { data: poll, error: pollError } = await supabase
    .from("polls")
    .insert({
      message_id: message.id,
      created_by_user_id: userId,
      question,
      is_anonymous: isAnonymous,
      is_multiple_choice: isMultipleChoice,
      expires_at: expiresAt ? expiresAt.toISOString() : null,
    })
    .select()
    .single();

  if (pollError) throw new Error(pollError.message);

  // Insert poll options
  const optionRecords = [];
  for (let i = 0; i < options.length; i++) {
    const { data: opt, error: optError } = await supabase
      .from("poll_options")
      .insert({
        poll_id: poll.id,
        text: options[i],
        sort_order: i,
      })
      .select()
      .single();

    if (optError) throw new Error(optError.message);
    optionRecords.push(opt);
  }

  return {
    ...poll,
    options: optionRecords,
  };
}

export async function vote(
  pollId: string,
  optionId: string,
  userId: string
) {
  const supabase = createClient(await cookies());

  // Fetch the poll
  const { data: poll } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();

  if (!poll) {
    throw new Error("Poll not found");
  }

  // Check if poll has expired
  if (poll.expires_at && new Date(poll.expires_at) < new Date()) {
    throw new Error("Poll has expired");
  }

  // Verify the option belongs to this poll
  const { data: option } = await supabase
    .from("poll_options")
    .select("*")
    .eq("id", optionId)
    .eq("poll_id", pollId)
    .maybeSingle();

  if (!option) {
    throw new Error("Poll option not found");
  }

  // Check existing votes
  const { data: existingVotes } = await supabase
    .from("poll_votes")
    .select("*")
    .eq("poll_id", pollId)
    .eq("user_id", userId);

  if (!poll.is_multiple_choice && (existingVotes || []).length > 0) {
    throw new Error(
      "You have already voted. This poll does not allow multiple choices."
    );
  }

  // Check if already voted for this specific option
  const alreadyVotedOption = (existingVotes || []).find(
    (v: any) => v.poll_option_id === optionId
  );
  if (alreadyVotedOption) {
    throw new Error("You have already voted for this option");
  }

  const { data: voteRecord, error } = await supabase
    .from("poll_votes")
    .insert({
      poll_id: pollId,
      poll_option_id: optionId,
      user_id: userId,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);

  return voteRecord;
}

export async function removeVote(
  pollId: string,
  optionId: string,
  userId: string
) {
  const supabase = createClient(await cookies());

  const { data: existing } = await supabase
    .from("poll_votes")
    .select("*")
    .eq("poll_id", pollId)
    .eq("poll_option_id", optionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (!existing) {
    throw new Error("Vote not found");
  }

  await supabase.from("poll_votes").delete().eq("id", existing.id);
}

export async function getPollResults(pollId: string) {
  const supabase = createClient(await cookies());

  const { data: poll } = await supabase
    .from("polls")
    .select("*")
    .eq("id", pollId)
    .single();

  if (!poll) {
    throw new Error("Poll not found");
  }

  // Get options
  const { data: optionsData } = await supabase
    .from("poll_options")
    .select("id, text, sort_order")
    .eq("poll_id", pollId)
    .order("sort_order", { ascending: true });

  // Count votes per option
  const options = [];
  for (const opt of optionsData || []) {
    const { count } = await supabase
      .from("poll_votes")
      .select("id", { count: "exact", head: true })
      .eq("poll_option_id", opt.id);

    options.push({
      id: opt.id,
      text: opt.text,
      sortOrder: opt.sort_order,
      voteCount: count || 0,
    });
  }

  const totalVotes = options.reduce((sum, opt) => sum + opt.voteCount, 0);

  return {
    ...poll,
    options,
    totalVotes,
  };
}
