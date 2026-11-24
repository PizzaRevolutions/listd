export interface User {
  id: string;
  username: string;
  email: string;
  avatarUrl?: string | null;
  bio?: string | null;
  createdAt: string;
}

export interface AuthResponse {
  user: User;
  token: string;
}
