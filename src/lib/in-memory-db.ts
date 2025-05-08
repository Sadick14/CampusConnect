
/**
 * @fileOverview Temporary In-Memory Database for Development ONLY.
 * WARNING: Data is lost on server restart. Not suitable for production.
 */

import type { School, SchoolFirestoreDoc } from '@/schemas/school';
import type { User } from '@/schemas/user';
// Remove Timestamp import as it's not used
// import { Timestamp } from 'firebase/firestore';

// --- Simple ID Generation ---
let schoolIdCounter = 1;
let userIdCounter = 1; // Separate counter for users if needed, or use auth UIDs

function generateId(prefix: string, counter: number): string {
  return `${prefix}${String(counter).padStart(3, '0')}`;
}

// --- In-Memory Stores ---
const schools = new Map<string, School>();
const users = new Map<string, User>(); // Keyed by Firestore Doc ID / Auth UID

console.warn(`
*******************************************************************
* WARNING: Using TEMPORARY In-Memory Database for Development.    *
*          Data will be LOST on server restart.                   *
*          Replace with a persistent database for production.     *
*******************************************************************
`);

// --- School Functions ---

export function addSchoolToMemory(schoolData: Omit<School, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): School {
    const id = schoolData.id ?? generateId('SCH', schoolIdCounter++);
    const now = new Date().toISOString();
    const newSchool: School = {
        ...schoolData,
        id: id,
        createdAt: now,
        updatedAt: now,
        // Ensure optional fields default to null if not provided
        address: schoolData.address ?? null,
        phone: schoolData.phone ?? null,
        website: schoolData.website ?? null,
        logoUrl: schoolData.logoUrl ?? null,
    };
    schools.set(id, newSchool);
    console.log('[In-Memory DB] Added School:', newSchool);
    return newSchool;
}

export function getSchoolFromMemory(id: string): School | null {
    return schools.get(id) || null;
}

export function getAllSchoolsFromMemory(): School[] {
    return Array.from(schools.values());
}

export function updateSchoolInMemory(id: string, updates: Partial<Omit<School, 'id' | 'createdAt'>>): School | null {
    const existing = schools.get(id);
    if (!existing) return null;
    const updatedSchool: School = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    schools.set(id, updatedSchool);
    console.log('[In-Memory DB] Updated School:', updatedSchool);
    return updatedSchool;
}

// --- User Functions ---

export function addUserToMemory(userData: Omit<User, 'id' | 'createdAt' | 'updatedAt'> & { id: string }): User {
    const now = new Date().toISOString();
    // User ID MUST be provided (it's the Auth UID)
    const newUser: User = {
        ...userData,
        createdAt: now,
        updatedAt: now,
        // Ensure optional fields default to null
        schoolId: userData.schoolId ?? null,
        schoolName: userData.schoolName ?? null,
        schoolLogoUrl: userData.schoolLogoUrl ?? null,
        class: userData.class ?? null,
        parentContact: userData.parentContact ?? null,
    };
    users.set(newUser.id, newUser);
    console.log('[In-Memory DB] Added User:', newUser);
    return newUser;
}

export function getUserFromMemory(id: string): User | null {
    return users.get(id) || null;
}

export function getAllUsersFromMemory(schoolId?: string): User[] {
    const all = Array.from(users.values());
    if (schoolId) {
        return all.filter(u => u.schoolId === schoolId);
    }
    return all;
}

export function updateUserInMemory(id: string, updates: Partial<Omit<User, 'id' | 'createdAt'>>): User | null {
    const existing = users.get(id);
    if (!existing) return null;
    const updatedUser: User = {
        ...existing,
        ...updates,
        updatedAt: new Date().toISOString(),
    };
    users.set(id, updatedUser);
    console.log('[In-Memory DB] Updated User:', updatedUser);
    return updatedUser;
}

export function getUserByEmailFromMemory(email: string): User | null {
    for (const user of users.values()) {
        if (user.email === email) {
            return user;
        }
    }
    return null;
}

// Function to set user details (used during sync/creation)
export function setUserInMemory(user: User): User {
     const existing = users.get(user.id);
     const now = new Date().toISOString();
     const userToSave : User = {
        ...existing, // Keep existing data like createdAt if it exists
        ...user, // Overwrite with new data
        updatedAt: now, // Always update timestamp
        createdAt: existing?.createdAt ?? now, // Preserve original creation time
     };
    users.set(user.id, userToSave);
     console.log(`[In-Memory DB] Set/Updated User ${user.id}:`, userToSave);
     return userToSave;
}


// Initialize Super Admin in memory if not present (for testing)
if (!users.has('superadmin')) {
    console.log('[In-Memory DB] Initializing default superadmin profile...');
    addUserToMemory({
        id: 'superadmin',
        name: 'Super Admin',
        email: 'superadmin@example.com', // Use the reserved email
        role: 'superadmin',
        schoolId: null,
        schoolName: null,
        schoolLogoUrl: null,
        class: null,
        parentContact: null,
    });
}
