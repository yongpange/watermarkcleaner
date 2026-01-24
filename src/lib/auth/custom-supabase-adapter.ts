import type { Adapter } from 'next-auth/adapters';
import { type SupabaseAdapterOptions } from '@auth/supabase-adapter';
import { createAdminClient } from '@/lib/supabase-admin';
import { createHash } from 'crypto';

/**
 * Custom Supabase Adapter that uses existing public.wmc_* tables
 * instead of the default profiles.* or public.* tables
 *
 * Maps:
 * - users → wmc_users
 * - accounts → wmc_accounts
 * - sessions → wmc_sessions
 * - verification_tokens → wmc_verification_tokens
 */
export function CustomSupabaseAdapter(options?: SupabaseAdapterOptions): Adapter {
  // Use the provided options or fall back to env variables
  const supabaseUrl = options?.url || process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseSecret = options?.secret || process.env.SUPABASE_SERVICE_ROLE_KEY!;

  if (!supabaseUrl || !supabaseSecret) {
    throw new Error('Missing Supabase credentials for CustomSupabaseAdapter');
  }

  // Helper to create admin client
  function getAdminClient() {
    return createAdminClient();
  }

  // Helper to map user data format
  function mapWmcUserToAdapterUser(wmcUser: any) {
    if (!wmcUser) return null;

    return {
      id: wmcUser.id,
      name: wmcUser.name,
      email: wmcUser.email,
      emailVerified: wmcUser.emailverified ? new Date(wmcUser.emailverified) : null,
      image: wmcUser.image,
      // Extended fields required by our custom User type
      tier: wmcUser.tier || 'unverified',
      creditsUsed: wmcUser.creditsused || 0,
    };
  }

  // Helper to map account data format
  function mapWmcAccountToAdapterAccount(wmcAccount: any) {
    if (!wmcAccount) return null;

    return {
      id: wmcAccount.id,
      userId: wmcAccount.user_id,
      type: wmcAccount.type,
      provider: wmcAccount.provider,
      providerAccountId: wmcAccount.provideraccountid,
      refresh_token: wmcAccount.refresh_token,
      access_token: wmcAccount.access_token,
      expires_at: wmcAccount.expires_at,
      token_type: wmcAccount.token_type,
      scope: wmcAccount.scope,
      id_token: wmcAccount.id_token,
      session_state: wmcAccount.session_state,
    };
  }

  const adapter = {
    // User operations
    createUser: async (data) => {
      const supabase = getAdminClient();

      const userData = {
        id: crypto.randomUUID(),
        name: data.name,
        email: data.email,
        emailverified: data.emailVerified?.toISOString(),
        image: data.image,
        tier: 'unverified', // Default tier for new users
        creditsused: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { data: user, error } = await supabase
        .from('wmc_users')
        .insert(userData)
        .select()
        .single();

      if (error) {
        console.error('[CustomAdapter] Error creating user:', error);
        throw error;
      }

      console.log('[CustomAdapter] ✓ User created in wmc_users:', user.email);
      return mapWmcUserToAdapterUser(user);
    },

    getUser: async (id) => {
      const supabase = getAdminClient();
      const { data: user, error } = await supabase
        .from('wmc_users')
        .select('*')
        .eq('id', id)
        .single();

      if (error || !user) {
        console.log('[CustomAdapter] User not found:', id);
        return null;
      }

      return mapWmcUserToAdapterUser(user);
    },

    getUserByEmail: async (email) => {
      const supabase = getAdminClient();
      const { data: user, error } = await supabase
        .from('wmc_users')
        .select('*')
        .eq('email', email)
        .single();

      if (error || !user) {
        return null;
      }

      return mapWmcUserToAdapterUser(user);
    },

    getUserByAccount: async (providerAccountId) => {
      const supabase = getAdminClient();

      // First find the account
      const { data: account, error: accountError } = await supabase
        .from('wmc_accounts')
        .select('*')
        .eq('provider', providerAccountId.provider)
        .eq('provideraccountid', providerAccountId.providerAccountId)
        .single();

      if (accountError || !account) {
        console.log('[CustomAdapter] Account not found:', providerAccountId);
        return null;
      }

      // Then get the user
      const { data: user, error: userError } = await supabase
        .from('wmc_users')
        .select('*')
        .eq('id', account.user_id)
        .single();

      if (userError || !user) {
        console.log('[CustomAdapter] User not found for account:', account.user_id);
        return null;
      }

      return mapWmcUserToAdapterUser(user);
    },

    updateUser: async ({ id, ...data }) => {
      const supabase = getAdminClient();

      const updateData = {
        ...(data.name && { name: data.name }),
        ...(data.email && { email: data.email }),
        ...(data.emailVerified !== undefined && {
          emailverified: data.emailVerified?.toISOString(),
        }),
        ...(data.image && { image: data.image }),
        updated_at: new Date().toISOString(),
      };

      const { data: user, error } = await supabase
        .from('wmc_users')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('[CustomAdapter] Error updating user:', error);
        throw error;
      }

      console.log('[CustomAdapter] ✓ User updated:', user.email);
      return mapWmcUserToAdapterUser(user);
    },

    deleteUser: async (userId) => {
      const supabase = getAdminClient();

      // Delete all related records first (accounts, sessions)
      await supabase.from('wmc_accounts').delete().eq('user_id', userId);
      await supabase.from('wmc_sessions').delete().eq('user_id', userId);

      // Delete the user
      const { error } = await supabase.from('wmc_users').delete().eq('id', userId);

      if (error) {
        console.error('[CustomAdapter] Error deleting user:', error);
        throw error;
      }

      console.log('[CustomAdapter] ✓ User deleted:', userId);
    },

    // Account operations
    linkAccount: async (data) => {
      const supabase = getAdminClient();

      const accountData = {
        id: crypto.randomUUID(),
        userid: data.userId,
        type: data.type,
        provider: data.provider,
        provideraccountid: data.providerAccountId,
        refresh_token: data.refresh_token,
        access_token: data.access_token,
        expires_at: data.expires_at,
        token_type: data.token_type,
        scope: data.scope,
        id_token: data.id_token,
        session_state: data.session_state,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('wmc_accounts').insert(accountData);

      if (error) {
        console.error('[CustomAdapter] Error linking account:', error);
        throw error;
      }

      console.log('[CustomAdapter] ✓ Account linked:', data.provider, 'for user:', data.userId);
      return data;
    },

    unlinkAccount: async (providerAccountId) => {
      const supabase = getAdminClient();

      const { error } = await supabase
        .from('wmc_accounts')
        .delete()
        .eq('provider', providerAccountId.provider)
        .eq('provideraccountid', providerAccountId.providerAccountId);

      if (error) {
        console.error('[CustomAdapter] Error unlinking account:', error);
        throw error;
      }

      console.log('[CustomAdapter] ✓ Account unlinked:', providerAccountId);
    },

    // Session operations
    createSession: async (data) => {
      const supabase = getAdminClient();

      const sessionData = {
        id: crypto.randomUUID(),
        session_token: data.sessionToken,
        user_id: data.userId,
        expires: data.expires.toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase.from('wmc_sessions').insert(sessionData);

      if (error) {
        console.error('[CustomAdapter] Error creating session:', error);
        throw error;
      }

      console.log('[CustomAdapter] ✓ Session created for user:', data.userId);
      return data;
    },

    getSessionAndUser: async (sessionToken) => {
      const supabase = getAdminClient();

      // Get the session
      const { data: session, error: sessionError } = await supabase
        .from('wmc_sessions')
        .select('*')
        .eq('session_token', sessionToken)
        .single();

      if (sessionError || !session) {
        console.log('[CustomAdapter] Session not found or expired:', sessionToken.substring(0, 10) + '...');
        return null;
      }

      // Check if session is expired
      const expires = new Date(session.expires);
      if (expires < new Date()) {
        console.log('[CustomAdapter] Session expired, deleting:', sessionToken.substring(0, 10) + '...');
        await supabase.from('wmc_sessions').delete().eq('session_token', sessionToken);
        return null;
      }

      // Get the user
      const { data: user, error: userError } = await supabase
        .from('wmc_users')
        .select('*')
        .eq('id', session.user_id)
        .single();

      if (userError || !user) {
        console.log('[CustomAdapter] User not found for session:', session.user_id);
        return null;
      }

      return {
        session: {
          sessionToken: session.session_token,
          userId: session.user_id,
          expires: new Date(session.expires),
        },
        user: mapWmcUserToAdapterUser(user),
      };
    },

    updateSession: async (data) => {
      const supabase = getAdminClient();

      const { error } = await supabase
        .from('wmc_sessions')
        .update({
          expires: data.expires.toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('session_token', data.sessionToken);

      if (error) {
        console.error('[CustomAdapter] Error updating session:', error);
        throw error;
      }

      console.log('[CustomAdapter] ✓ Session updated:', data.sessionToken.substring(0, 20) + '...');
      return data;
    },

    deleteSession: async (sessionToken) => {
      const supabase = getAdminClient();

      const { error } = await supabase
        .from('wmc_sessions')
        .delete()
        .eq('session_token', sessionToken);

      if (error) {
        console.error('[CustomAdapter] Error deleting session:', error);
        throw error;
      }

      console.log('[CustomAdapter] ✓ Session deleted:', sessionToken.substring(0, 20) + '...');
    },

    // Verification token operations
    createVerificationToken: async (data) => {
      const supabase = getAdminClient();

      // Hash the token for secure storage (SHA256)
      const hashedToken = createHash('sha256').update(data.token).digest('hex');
      const expires = data.expires.toISOString();

      const verificationData = {
        identifier: data.identifier,
        token: hashedToken,
        expires: expires,
        created_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from('wmc_verification_tokens')
        .insert(verificationData);

      if (error) {
        console.error('[CustomAdapter] Error creating verification token:', error);
        throw error;
      }

      console.log('[CustomAdapter] ✓ Verification token created for:', data.identifier);
      return data;
    },

    useVerificationToken: async (params) => {
      const supabase = getAdminClient();

      // Hash the provided token to match stored hash
      const hashedToken = createHash('sha256').update(params.token).digest('hex');

      // Find the verification token matching both identifier and hashed token
      const { data: token, error } = await supabase
        .from('wmc_verification_tokens')
        .select('*')
        .eq('identifier', params.identifier)
        .eq('token', hashedToken)
        .gt('expires', new Date().toISOString()) // Check not expired
        .limit(1)
        .single();

      if (error || !token) {
        console.log('[CustomAdapter] Verification token not found, expired, or invalid');
        return null;
      }

      // Delete the token (one-time use)
      await supabase
        .from('wmc_verification_tokens')
        .delete()
        .eq('identifier', params.identifier);

      console.log('[CustomAdapter] ✓ Verification token used and deleted for:', params.identifier);

      return {
        identifier: token.identifier,
        token: params.token, // Return original token, not hashed
        expires: new Date(token.expires),
      };
    },
  };

  return adapter as Adapter;
}
