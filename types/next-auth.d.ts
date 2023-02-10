import { DefaultSession } from 'next-auth';

declare module 'next-auth' {
  /**
   * Returned by `useSession`, `getSession` and received as a prop on the `SessionProvider` React Context
   */
  interface Session {
    user: {
      role: string | undefined | null;
    } & DefaultSession['user'];
  }

  interface User {
    role: string | undefined | null;
  }
}

declare module 'next/server' {
  interface NextRequest {
    nextauth: {
      token: {
        role: string | undefined | null;
      };
    } & NextRequest['nextauth'];
  }
}
