/**
 * GitHub GraphQL Mutations
 * 统一管理所有 GraphQL 变更操作
 */

import { Octokit } from '@octokit/core'
import { AddReactionResponse, RemoveReactionResponse } from './types'
import { GitHubReaction } from '@/types'

/**
 * 添加 Reaction 的 GraphQL Mutation
 */
export const ADD_REACTION_MUTATION = `
  mutation AddReaction($subjectId: ID!, $content: ReactionContent!) {
    addReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        id
        content
      }
    }
  }
`

/**
 * 执行添加 Reaction
 * 
 * @param octokit - Octokit 实例
 * @param issueId - Issue ID（全局 ID）
 * @param reaction - Reaction 类型
 * @returns Reaction ID
 */
export async function addReaction(
  octokit: Octokit,
  issueId: string,
  reaction: GitHubReaction
): Promise<string> {
  const response = await octokit.graphql<AddReactionResponse>(
    ADD_REACTION_MUTATION,
    {
      subjectId: issueId,
      content: reaction,
    }
  )

  return response.addReaction.reaction.id
}

/**
 * 删除 Reaction 的 GraphQL Mutation
 */
export const REMOVE_REACTION_MUTATION = `
  mutation RemoveReaction($subjectId: ID!, $content: ReactionContent!) {
    removeReaction(input: { subjectId: $subjectId, content: $content }) {
      reaction {
        id
      }
    }
  }
`

/**
 * 执行删除 Reaction
 * 
 * @param octokit - Octokit 实例
 * @param issueId - Issue ID（全局 ID）
 * @param reaction - Reaction 类型
 * @returns Reaction ID
 */
export async function removeReaction(
  octokit: Octokit,
  issueId: string,
  reaction: GitHubReaction
): Promise<string> {
  const response = await octokit.graphql<RemoveReactionResponse>(
    REMOVE_REACTION_MUTATION,
    {
      subjectId: issueId,
      content: reaction,
    }
  )

  return response.removeReaction.reaction.id
}

/**
 * 切换 Reaction（如果存在则删除，不存在则添加）
 * 
 * @param octokit - Octokit 实例
 * @param issueId - Issue ID
 * @param reaction - Reaction 类型
 * @param currentReactionId - 当前的 Reaction ID（如果有）
 * @returns 操作类型和 Reaction ID
 */
export async function toggleReaction(
  octokit: Octokit,
  issueId: string,
  reaction: GitHubReaction,
  currentReactionId?: string
): Promise<{ action: 'added' | 'removed'; reactionId: string }> {
  if (currentReactionId) {
    // 已存在，删除
    const reactionId = await removeReaction(octokit, issueId, reaction)
    return { action: 'removed', reactionId }
  } else {
    // 不存在，添加
    const reactionId = await addReaction(octokit, issueId, reaction)
    return { action: 'added', reactionId }
  }
}
