// Interface for User data structure
export interface User {
    _id?: string;
    username: string;
    email: string;
    password?: string;
    role?: string;
    createdAt?: Date;
    isActive?: boolean;
    lastLogin?: Date;
    videos?: string[];
} 