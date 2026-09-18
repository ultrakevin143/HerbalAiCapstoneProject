import { z } from "zod";

export const MAX_CHAT_HISTORY_TURNS = 6;
export const MAX_CHAT_TURN_CHARACTERS = 8_000;
export const MAX_CHAT_HISTORY_CHARACTERS = 24_000;

const chatTurnSchema = z
  .object({
    role: z.enum(["user", "model"]),
    parts: z
      .array(
        z
          .object({
            text: z
              .string()
              .trim()
              .min(1, "History messages cannot be empty")
              .max(
                MAX_CHAT_TURN_CHARACTERS,
                `Each history message must be at most ${MAX_CHAT_TURN_CHARACTERS} characters`
              ),
          })
          .strict()
      )
      .length(1, "Each history turn must contain exactly one text part"),
  })
  .strict();

const chatHistorySchema = z
  .array(chatTurnSchema)
  .max(
    MAX_CHAT_HISTORY_TURNS,
    `History must contain at most ${MAX_CHAT_HISTORY_TURNS} conversation turns`
  )
  .superRefine((history, context) => {
    const totalCharacters = history.reduce(
      (total, turn) => total + (turn.parts[0]?.text.length ?? 0),
      0
    );

    if (totalCharacters > MAX_CHAT_HISTORY_CHARACTERS) {
      context.addIssue({
        code: "custom",
        message: `History must contain at most ${MAX_CHAT_HISTORY_CHARACTERS} characters`,
      });
    }

    if (history.length % 2 !== 0) {
      context.addIssue({
        code: "custom",
        message: "History must contain complete user and model message pairs",
      });
    }

    history.forEach((turn, index) => {
      const expectedRole = index % 2 === 0 ? "user" : "model";
      if (turn.role !== expectedRole) {
        context.addIssue({
          code: "custom",
          path: [index, "role"],
          message: `History turn ${index + 1} must have role '${expectedRole}'`,
        });
      }
    });
  });

export const chatRequestSchema = z.object({
  body: z
    .object({
      message: z.unknown().optional(),
      history: chatHistorySchema.optional(),
    })
    .strict(),
});
