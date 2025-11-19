

import * as dbService from './dbService';
import { User } from '../types';

export const register = async (name: string, email: string, password: string): Promise<User> => {
    await dbService.initDB();
    const existingUser = await dbService.getUserByEmail(email);
    if (existingUser) {
        throw new Error("User with this email already exists.");
    }

    const newUser: User = {
        id: Date.now().toString(),
        name,
        email,
        password, // In a real app, this should be hashed before saving
    };

    await dbService.addUser(newUser);
    return newUser;
};

export const login = async (email: string, password: string): Promise<User> => {
    await dbService.initDB();
    const user = await dbService.getUserByEmail(email);

    if (!user || user.password !== password) { // In a real app, compare hashed passwords
        throw new Error("Invalid email or password.");
    }

    return user;
};

export const getUserByEmail = async (email: string): Promise<User | undefined> => {
    await dbService.initDB();
    return await dbService.getUserByEmail(email);
};

export const resetPassword = async (email: string, newPassword: string): Promise<void> => {
    await dbService.initDB();
    const user = await dbService.getUserByEmail(email);

    if (!user) {
        throw new Error("User with this email does not exist.");
    }
    
    const updatedUser: User = { ...user, password: newPassword }; 
    await dbService.updateUser(updatedUser);
};

export const deleteAccount = async (userId: string): Promise<void> => {
    await dbService.initDB();
    await dbService.deleteUser(userId);
};