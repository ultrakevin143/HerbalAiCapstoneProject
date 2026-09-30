import { findAllKB, MAX_UNPAGED_KB_RECORDS } from "../../../repositories/knowledgebase.repository.js";

export async function GetAllKnowledgeBaseService() {
  try {
    const data = await findAllKB();
    if (data.length > MAX_UNPAGED_KB_RECORDS) {
      return {
        code: 409,
        status: "error",
        message: "The knowledge base is too large for this endpoint. Use the paginated /page endpoint.",
      };
    }
    return {
      code: 200,
      status: "success",
      data,
    };
  } catch (error) {
    console.error("GetAllKnowledgeBaseService Error:", error);
    return { code: 500, status: "error", message: "Unable to retrieve knowledge base entries" };
  }
}
