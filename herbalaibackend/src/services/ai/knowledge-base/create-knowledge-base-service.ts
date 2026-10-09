import { createKB } from "../../../repositories/knowledgebase.repository.js";
import { rethrowDatabaseUnavailable } from '../../../utils/error-response.js';
import { generateEmbedding } from "../core/gemini-service.js";
import { hasPhilippineSourceMetadata } from './source-metadata.js';

interface CreateKnowledgeBaseData {
  question: string;
  answer: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
}

export async function CreateKnowledgeBaseService(data: CreateKnowledgeBaseData, adminId: string) {
  if (!hasPhilippineSourceMetadata(data.metadata)) {
    return { code: 400, status: 'error', message: 'Add a Philippine source with a title, publisher, and HTTP(S) URL before publishing.' };
  }
  try {
    // Generate vector embedding based on the question and answer text
    const embedding = await generateEmbedding(`${data.question}\n${data.answer}`);
    const vectorStr = `[${embedding.join(",")}]`;

    const created = await createKB({
      ...data,
      embedding: vectorStr,
    }, adminId);

    return {
      code: 201,
      status: "success",
      message: "Knowledge base entry created successfully",
      data: created,
    };
  } catch (error) {
    rethrowDatabaseUnavailable(error);
    console.error("CreateKnowledgeBaseService Error:", error);
    const err = error as Error & { code?: string };

    // Handle duplicate question unique constraint violation
    if (err.message?.includes("23505") || err.code === "P2002") {
      return { 
        code: 409, 
        status: "error", 
        message: "A knowledge base entry with this question already exists." 
      };
    }

    return { code: 500, status: "error", message: "Unable to create knowledge base entry" };
  }
}
