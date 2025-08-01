import { Octokit } from '@octokit/core'

export interface IssueNode {
  id: string
  title: string
  url: string
  body: string
  createdAt: string
  updatedAt: string
  author: {
    username: string
    avatarUrl: string
    url: string
  }
}

interface IssuesResult {
  edges: IssueEdge[]
  pageInfo: PageInfo
}

interface PageInfo {
  hasNextPage: boolean
  endCursor: string | null
}

interface IssueEdge {
  node: IssueNode
  cursor: string
}

export async function fetchIssues(
  owner: string,
  name: string,
  labels: string[],
  afterCursor: string | null = null,
): Promise<IssueNode[]> {
  const octokit = new Octokit({ auth: process.env.GITHUB_TOKEN })
  const query = `query ($owner: String!, $name: String!, $labels: [String!], $afterCursor: String) {
    repository(owner: $owner, name: $name) {
      issues(labels: $labels, first: 10, after: $afterCursor) {
        edges {
          node {
            id
            title
            url
            body
            createdAt
            updatedAt
            author {
              username: login
              avatarUrl
              url
            }
          }
          cursor
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }`

  const variables = {
    owner,
    name,
    labels,
    afterCursor,
  }

  const data = await octokit.graphql<{ repository: { issues: IssuesResult } }>(
    query,
    variables,
  )
  const issues = data.repository.issues.edges.map((edge) => edge.node)
  const pageInfo = data.repository.issues.pageInfo

  if (pageInfo.hasNextPage && pageInfo.endCursor) {
    return issues.concat(
      await fetchIssues(owner, name, labels, pageInfo.endCursor),
    )
  } else {
    return issues
  }
}
