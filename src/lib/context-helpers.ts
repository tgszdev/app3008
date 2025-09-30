import { supabaseAdmin } from './supabase'

/**
 * Retrieves the context IDs associated with a matrix user.
 * Matrix users can be associated with multiple organizations/contexts.
 * 
 * @param userId - The ID of the user to fetch contexts for
 * @returns Array of context IDs the user has access to, or empty array if none found
 * @throws Error if there's a database error
 */
export async function getUserContextIds(userId: string): Promise<string[]> {
  const { data: userContexts, error: contextsError } = await supabaseAdmin
    .from('user_contexts')
    .select('context_id')
    .eq('user_id', userId)
  
  if (contextsError) {
    console.error('Error fetching user contexts:', contextsError)
    throw new Error(`Failed to fetch user contexts: ${contextsError.message}`)
  }
  
  if (!userContexts || userContexts.length === 0) {
    return []
  }
  
  return userContexts.map(uc => uc.context_id)
}

/**
 * Applies multi-tenant filtering to a Supabase query based on user type.
 * 
 * @param query - The Supabase query builder to apply filtering to
 * @param userType - The type of user ('context' or 'matrix')
 * @param userContextId - The context ID for context-type users
 * @param currentUserId - The current user's ID (for matrix users)
 * @returns The modified query with appropriate context filtering applied
 */
export async function applyContextFilter<T>(
  query: any,
  userType: string | undefined,
  userContextId: string | undefined,
  currentUserId: string
): Promise<any> {
  if (userType === 'context' && userContextId) {
    return query.eq('context_id', userContextId)
  } else if (userType === 'matrix') {
    const associatedContextIds = await getUserContextIds(currentUserId)
    
    if (associatedContextIds.length > 0) {
      return query.in('context_id', associatedContextIds)
    } else {
      return query.eq('context_id', '00000000-0000-0000-0000-000000000000')
    }
  }
  
  return query
}
