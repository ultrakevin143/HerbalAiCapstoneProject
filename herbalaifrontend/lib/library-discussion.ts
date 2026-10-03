export const reconcileDeletedComments = <Comment extends { id: number; parentCommentId: number | null }>(
  comments: readonly Comment[], deletedIds: ReadonlySet<number>,
): Comment[] => comments
  .filter((comment) => !deletedIds.has(comment.id))
  .map((comment) => comment.parentCommentId !== null && deletedIds.has(comment.parentCommentId)
    ? { ...comment, parentCommentId: null } : comment);

export { createRefreshCoordinator as createDiscussionRefresh } from './refresh-coordinator';
