import "next-auth";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      email: string;
      name?: string | null;
      isAdmin: boolean;
      impersonatedFromEmail?: string;
    };
  }

  interface User {
    id: string;
    email: string;
    name?: string | null;
    isAdmin: boolean;
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    isAdmin: boolean;
    impersonatedFromEmail?: string;
  }
}
