import { updateKB, findKBById } from "../../../repositories/knowledgebase.repository.js";
import { rethrowDatabaseUnavailable } from '../../../utils/error-response.js';
import { generateEmbedding } from "../core/gemini-service.js";
import type { KBData } from "../../../repositories/knowledgebase.repository.js";
import { hasPhilippineSourceMetadata } from './source-metadata.js';

interface UpdateKnowledgeBaseData {
  id: string;
  question?: string;
  answer?: string;
  category?: string;
  tags?: string[];
  metadata?: Record<string, unknown>;
  isActive?: boolean;
}

export async function UpdateKnowledgeBaseService(data: UpdateKnowledgeBaseData, adminId: string) {
  try {
    const existing = await findKBById(data.id);
    if (!existing) {
      return { code: 404, status: "error", message: "Knowledge base entry not found" };
    }

    const changesContent = data.question !== undefined || data.answer !== undefined
      || data.category !== undefined || data.tags !== undefined || data.metadata !== undefined;
    if (changesContent && !hasPhilippineSourceMetadata(data.metadata ?? existing.metadata)) {
      return { code: 400, status: 'error', message: 'Add a Philippine source with a title, publisher, and HTTP(S) URL before saving.' };
    }

    let vectorStr = undefined;
    if (data.question !== undefined || data.answer !== undefined) {
      const newQuestion = data.question ?? existing.question ?? "";
      const newAnswer = data.answer ?? existing.answer;
      const embedding = await generateEmbedding(`${newQuestion}\n${newAnswer}`);
      vectorStr = `[${embedding.join(",")}]`;
    }

    const updatePayload: Partial<KBData> = {};
    if (data.question !== undefined) updatePayload.question = data.question;
    if (data.answer !== undefined) updatePayload.answer = data.answer;
    if (data.category !== undefined) updatePayload.category = data.category;
    if (data.tags !== undefined) updatePayload.tags = data.tags;
    if (data.metadata !== undefined) updatePayload.metadata = data.metadata;
    if (data.isActive !== undefined) updatePayload.isActive = data.isActive;
    if (vectorStr !== undefined) updatePayload.embedding = vectorStr;

    await updateKB(data.id, updatePayload, adminId);

    return {
      code: 200,
      status: "success",
      message: "Knowledge base entry updated successfully",
    };
  } catch (error) {
    rethrowDatabaseUnavailable(error);
    console.error("UpdateKnowledgeBaseService Error:", error);
    return { code: 500, status: "error", message: "Unable to update knowledge base entry" };
  }
}
