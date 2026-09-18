import { z } from "zod";

export const createKnowledgeSchema = z.object({
  body: z.object({
    question: z.string().min(5, "Question must be at least 5 characters"),
    answer: z.string().min(10, "Answer must be at least 10 characters"),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
  }),
});

export const updateKnowledgeSchema = z.object({
  body: z.object({
    question: z.string().min(5).optional(),
    answer: z.string().min(10).optional(),
    category: z.string().optional(),
    tags: z.array(z.string()).optional(),
    metadata: z.record(z.string(), z.any()).optional(),
    isActive: z.boolean().optional(),
  }),
});

const philippineKnowledgeMetadataSchema = z.object({
  jurisdiction: z.string().trim().refine(
    (value) => value.toLowerCase() === "philippines",
    "Knowledge facts must use Philippines as their jurisdiction",
  ),
  sources: z.array(z.object({
    title: z.string().trim().min(1, "Each source needs a title"),
    publisher: z.string().trim().min(1, "Each source needs a publisher"),
    url: z.string().url("Each source needs a valid URL"),
    accessedAt: z.string().trim().optional(),
  }).passthrough()).min(1, "Each fact needs at least one Philippine-relevant source"),
}).passthrough();

const knowledgeFactSchema = z.object({
  question: z.string().trim().min(5, "Question must be at least 5 characters"),
  answer: z.string().trim().min(10, "Answer must be at least 10 characters"),
  category: z.string().trim().optional(),
  tags: z.array(z.string().trim().min(1)).max(20).optional(),
  metadata: philippineKnowledgeMetadataSchema,
});

export const importKnowledgeSchema = z.object({
  body: z.object({
    facts: z.array(knowledgeFactSchema).min(1, "At least one fact is required").max(50, "Import up to 50 facts at a time"),
  }),
});
