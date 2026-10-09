import { deleteKB, findKBById } from "../../../repositories/knowledgebase.repository.js";
import { rethrowDatabaseUnavailable } from '../../../utils/error-response.js';

export async function DeleteKnowledgeBaseService(id: string, adminId: string) {
  try {
    const existing = await findKBById(id);
    if (!existing) {
      return { code: 404, status: "error", message: "Knowledge base entry not found" };
    }

    await deleteKB(id, adminId);

    return {
      code: 200,
      status: "success",
      message: "Knowledge base entry deleted successfully",
    };
  } catch (error) {
    rethrowDatabaseUnavailable(error);
    console.error("DeleteKnowledgeBaseService Error:", error);
    return { code: 500, status: "error", message: "Unable to delete knowledge base entry" };
  }
}
