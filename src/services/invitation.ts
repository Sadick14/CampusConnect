import { getDb } from '@/lib/firebase';
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { SchoolInvitation, SchoolInvitationInput } from '@/schemas/organization';
import { randomBytes } from 'crypto';

// Re-export types
export type { SchoolInvitation, SchoolInvitationInput };

const COLLECTION = 'school_invitations';

/**
 * Generate a secure random invitation token
 */
function generateInviteToken(): string {
  return randomBytes(32).toString('hex');
}

/**
 * Create a new school invitation
 */
export async function createSchoolInvitation(
  data: Omit<SchoolInvitationInput, 'inviteToken' | 'createdAt' | 'expiresAt'>,
  createdBy: string
): Promise<SchoolInvitation> {
  const db = getDb();
  const now = Timestamp.now();
  const expiresAt = Timestamp.fromMillis(now.toMillis() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const inviteData = {
    ...data,
    inviteToken: generateInviteToken(),
    status: 'pending' as const,
    createdBy,
    createdAt: now,
    expiresAt,
  };

  const docRef = await addDoc(collection(db, COLLECTION), inviteData);

  return {
    id: docRef.id,
    ...inviteData,
  };
}

/**
 * Get invitation by token
 */
export async function getInvitationByToken(token: string): Promise<SchoolInvitation | null> {
  const db = getDb();
  const q = query(
    collection(db, COLLECTION),
    where('inviteToken', '==', token),
    where('status', '==', 'pending')
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return null;

  const doc = snapshot.docs[0];
  const data = doc.data();

  // Check if expired
  if (data.expiresAt.toMillis() < Date.now()) {
    await updateDoc(doc.ref, { status: 'expired' });
    return null;
  }

  return {
    id: doc.id,
    ...data,
  } as SchoolInvitation;
}

/**
 * Get invitation by ID
 */
export async function getInvitation(id: string): Promise<SchoolInvitation | null> {
  const db = getDb();
  const docRef = doc(db, COLLECTION, id);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) return null;

  return {
    id: docSnap.id,
    ...docSnap.data(),
  } as SchoolInvitation;
}

/**
 * Get all invitations (for super admin)
 */
export async function getAllInvitations(status?: 'pending' | 'accepted' | 'expired'): Promise<SchoolInvitation[]> {
  const db = getDb();
  const constraints: any[] = [];

  if (status) {
    constraints.push(where('status', '==', status));
  }

  constraints.push(orderBy('createdAt', 'desc'));

  const q = query(collection(db, COLLECTION), ...constraints);
  const snapshot = await getDocs(q);

  return snapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SchoolInvitation[];
}

/**
 * Accept an invitation and link to created school
 */
export async function acceptInvitation(inviteToken: string, organizationId: string): Promise<void> {
  const invitation = await getInvitationByToken(inviteToken);
  if (!invitation) {
    throw new Error('Invalid or expired invitation');
  }

  const db = getDb();
  const docRef = doc(db, COLLECTION, invitation.id);

  await updateDoc(docRef, {
    status: 'accepted',
    acceptedAt: Timestamp.now(),
    organizationId,
  });
}

/**
 * Send invitation email (placeholder - implement with email service)
 */
export async function sendInvitationEmail(invitation: SchoolInvitation): Promise<void> {
  // TODO: Implement email sending via SendGrid, Resend, or similar
  const inviteLink = `${process.env.NEXT_PUBLIC_APP_URL}/onboarding?token=${invitation.inviteToken}`;
  
  console.log('📧 Invitation email would be sent to:', invitation.adminEmail);
  console.log('🔗 Invitation link:', inviteLink);
  console.log('School:', invitation.schoolName);
  console.log('Expires:', invitation.expiresAt.toDate().toLocaleDateString());

  // Email template:
  // Subject: Welcome to CampusConnect - Set up your school
  // Body: 
  // Hi {adminName},
  // 
  // You've been invited to set up {schoolName} on CampusConnect.
  // 
  // Click here to get started: {inviteLink}
  // 
  // This invitation expires on {expiresAt}.
  // 
  // Best regards,
  // CampusConnect Team
}

/**
 * Resend invitation email
 */
export async function resendInvitation(invitationId: string): Promise<void> {
  const invitation = await getInvitation(invitationId);
  if (!invitation) {
    throw new Error('Invitation not found');
  }

  if (invitation.status !== 'pending') {
    throw new Error('Can only resend pending invitations');
  }

  // Extend expiration
  const db = getDb();
  const newExpiresAt = Timestamp.fromMillis(Date.now() + 7 * 24 * 60 * 60 * 1000);
  
  await updateDoc(doc(db, COLLECTION, invitationId), {
    expiresAt: newExpiresAt,
  });

  const updatedInvitation = { ...invitation, expiresAt: newExpiresAt };
  await sendInvitationEmail(updatedInvitation);
}

/**
 * Cancel/revoke an invitation
 */
export async function cancelInvitation(invitationId: string): Promise<void> {
  const db = getDb();
  await updateDoc(doc(db, COLLECTION, invitationId), {
    status: 'expired',
  });
}
