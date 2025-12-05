"use server";

import { cookies } from "next/headers";
import prisma from "./prisma";

const SESSION_COOKIE_NAME = "sureyummy_session";
const SESSION_EXPIRY_DAYS = 1;

/**
 * Set session cookie with UUID
 */
export async function setSessionCookie(sessionId: string, expiresAt: Date) {
  const cookieStore = await cookies();
  
  cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
    expires: expiresAt,
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
  });
}

/**
 * Get session ID from cookie
 */
export async function getSessionCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get(SESSION_COOKIE_NAME);
  return sessionCookie?.value ?? null;
}

/**
 * Clear session cookie
 */
export async function clearSessionCookie() {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE_NAME);
}

/**
 * Validate if session is valid and active for a table
 */
export async function validateSession(
  sessionId: string,
  tableId: string
): Promise<boolean> {
  try {
    const session = await prisma.session.findUnique({
      where: { sessionId },
      select: {
        id: true,
        tableId: true,
        expiresAt: true,
        isActive: true,
      },
    });

    if (!session) return false;
    if (!session.isActive) return false;
    if (session.tableId !== tableId) return false;
    if (session.expiresAt < new Date()) {
      // Session expired, mark as inactive
      await prisma.session.update({
        where: { sessionId },
        data: { isActive: false },
      });
      return false;
    }

    return true;
  } catch (error) {
    console.error("Error validating session:", error);
    return false;
  }
}

/**
 * Get or create session for a table
 */
export async function getOrCreateSession(tableId: string): Promise<{
  sessionId: string;
  expiresAt: Date;
  isNew: boolean;
}> {
  // Check for existing session cookie
  const existingSessionId = await getSessionCookie();

  if (existingSessionId) {
    const isValid = await validateSession(existingSessionId, tableId);
    if (isValid) {
      const session = await prisma.session.findUnique({
        where: { sessionId: existingSessionId },
        select: { sessionId: true, expiresAt: true },
      });
      if (session) {
        return {
          sessionId: session.sessionId,
          expiresAt: session.expiresAt,
          isNew: false,
        };
      }
    }
  }

  // Create new session
  const sessionId = crypto.randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_EXPIRY_DAYS);

  await prisma.session.create({
    data: {
      sessionId,
      tableId,
      expiresAt,
      isActive: true,
    },
  });

  await setSessionCookie(sessionId, expiresAt);

  return { sessionId, expiresAt, isNew: true };
}

/**
 * Check if table has an active session (not from current user)
 */
export async function isTableOccupied(tableId: string): Promise<boolean> {
  const currentSessionId = await getSessionCookie();

  const activeSession = await prisma.session.findFirst({
    where: {
      tableId,
      isActive: true,
      expiresAt: { gte: new Date() },
    },
    select: { sessionId: true },
  });

  if (!activeSession) return false;

  // If there's an active session and it's not the current user's session
  if (currentSessionId !== activeSession.sessionId) {
    return true;
  }

  return false;
}

/**
 * Mark session as inactive (called when order is paid)
 */
export async function deactivateSession(sessionId: string) {
  await prisma.session.update({
    where: { sessionId },
    data: { isActive: false },
  });
}

/**
 * Get all orders for a session grouped by batch
 */
export async function getSessionOrders(sessionId: string) {
  const session = await prisma.session.findUnique({
    where: { sessionId },
    include: {
      orders: {
        include: {
          orderItems: {
            include: {
              menuItem: true,
            },
          },
        },
        orderBy: { createdAt: "asc" },
      },
      table: true,
    },
  });

  return session;
}
