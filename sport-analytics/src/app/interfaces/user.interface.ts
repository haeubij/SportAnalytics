// Interface for User data structure
export interface User {
    id?: string;
    username: string;
    email: string;
    password: string;
    role?: string;
    createdAt?: Date;
} 