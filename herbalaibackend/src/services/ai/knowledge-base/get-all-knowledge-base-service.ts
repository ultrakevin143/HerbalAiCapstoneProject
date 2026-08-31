import { findAllKB } from "../../../repositories/knowledgebase.repository.js";

export async function GetAllKnowledgeBaseService() {
  try {
    const data = await findAllKB();
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
