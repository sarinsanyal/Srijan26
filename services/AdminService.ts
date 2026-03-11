"use server";

import { prisma } from "@/prisma/client";
import { AdminEvent, EventParticipant, VerificationFilter } from "@/types/admin";
import { unstable_cache } from "next/cache";
import { checkAdminAuthorization } from "@/services/AuthService";

const _getAdminEvents = async (
  userId: string,
  role: string
): Promise<AdminEvent[]> => {
  if (!userId) return [];

  if (role === "SUPERADMIN") {
    const events = await prisma.event.findMany({
      select: {
        id: true,
        name: true,
        slug: true,
        isVisible: true,
        registrationOpen: true,
      },
    });
    return events;
  }

  const assignments = await prisma.eventAdmin.findMany({
    where: { userId },
    include: { event: {
      omit: {
        eventListingData: true
      }
    } },
  });

  return assignments.map((a) => ({
    id: a.event.id,
    name: a.event.name,
    slug: a.event.slug,
    isVisible: a.event.isVisible,
    registrationOpen: a.event.registrationOpen,
  }));
};

const getAdminEvents = async (userId: string, role: string) => {
  if (role !== "ADMIN" && role !== "SUPERADMIN") return [];
  
  const getCachedAdminEvents = unstable_cache(
    async (uid: string, r: string) => _getAdminEvents(uid, r),
    [`admin-events-${userId}`],
    { tags: ["admin-events"], revalidate: 180 } // 3 minutes
  );
  
  return getCachedAdminEvents(userId, role);
};

const _getEventParticipantsBySlug = async (
  eventSlug: string,
  verification: VerificationFilter = "all"
) => {
  if (!eventSlug) return [] as EventParticipant[];

  const teams = await prisma.team.findMany({
    where: { eventSlug },
    include: { members: true },
  });

  const leaderById = new Map<string, string>();
  for (const team of teams) {
    const leader = team.members.find((m) => m.id === team.leader);
    if (leader) leaderById.set(team.id, leader.name);
  }

  const seen = new Set<string>();
  const users: EventParticipant[] = [];

  for (const team of teams) {
    const teamName = team.name;
    const teamLeaderName = leaderById.get(team.id) ?? null;
    for (const member of team.members) {
      if (!member?.id || seen.has(member.id)) continue;
      seen.add(member.id);

      if (verification === "verified" && !member.emailVerified) continue;
      if (verification === "unverified" && member.emailVerified) continue;

      users.push({
        id: member.id,
        name: member.name,
        email: member.email,
        phone: member.phone,
        college: member.college,
        emailVerified: member.emailVerified,
        teamName,
        teamLeaderName,
      });

    }
  }

  return users;
};

const getEventParticipantsBySlug = async (
  eventSlug: string,
  verification: VerificationFilter = "all"
) => {
  const user = await checkAdminAuthorization();
  if (!user || (user.role !== "ADMIN" && user.role !== "SUPERADMIN")) return [] as EventParticipant[];

  const getCachedParticipants = unstable_cache(
    async (slug: string, verif: VerificationFilter) => _getEventParticipantsBySlug(slug, verif),
    [`event-participants-${eventSlug}-${verification}`],
    { tags: ["admin-events", "event-participants"], revalidate: 180 }
  );
  
  return getCachedParticipants(eventSlug, verification);
};

const _getAllUsers = async () => {
  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      college: true,
      department: true,
      year: true,
      role: true,
      emailVerified: true,
      createdAt: true,
    },
  });
  return users;
};

export const getAllUsers = async () => {
  const user = await checkAdminAuthorization();
  if (!user || user.role !== "SUPERADMIN") return [];

  const getCachedUsers = unstable_cache(
    async () => _getAllUsers(),
    [`superadmin-all-users`],
    { tags: ["superadmin-users"], revalidate: 180 }
  );

  return getCachedUsers();
};

const _getAllMerchandise = async () => {
  const merchandise = await prisma.merchandise.findMany({
    where: {
      status: "completed",
    },
    include: {
      user: {
        select: {
          name: true,
          email: true,
          phone: true,
          department: true,
          year: true,
        },
      },
    },
    orderBy: {
      id: "desc", // implicitly ordered by creation if id is auto-generated in a way that respects time, but ObjectId contains timestamp.
    },
  });
  return merchandise;
};

export const getAllMerchandise = async () => {
  const user = await checkAdminAuthorization();
  if (!user || user.role !== "SUPERADMIN") return [];

  const getCachedMerch = unstable_cache(
    async () => _getAllMerchandise(),
    [`superadmin-all-merch`],
    { tags: ["superadmin-merch"], revalidate: 180 }
  );
  
  return getCachedMerch();
};

const _searchUsersByEmail = async (query: string) => {
  if (!query) return [];
  const users = await prisma.user.findMany({
    where: {
      email: {
        contains: query,
        mode: "insensitive",
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    take: 10,
  });
  return users;
};

export const searchUsersByEmail = async (query: string) => {
  const user = await checkAdminAuthorization();
  if (!user || user.role !== "SUPERADMIN") return [];

  const getCachedSearchResults = unstable_cache(
    async (q: string) => _searchUsersByEmail(q),
    [`search-users-${query}`],
    { tags: ["superadmin-users"], revalidate: 180 }
  );
  
  return getCachedSearchResults(query);
};

const _getEventAdmins = async (eventId: string) => {
  const admins = await prisma.eventAdmin.findMany({
    where: { eventId },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
  });
  return admins.map((a) => a.user);
};

export const getEventAdmins = async (eventId: string) => {
  const user = await checkAdminAuthorization();
  if (!user || user.role !== "SUPERADMIN") return [];

  const getCachedAdmins = unstable_cache(
    async (id: string) => _getEventAdmins(id),
    [`event-admins-${eventId}`],
    { tags: ["admin-events", "event-admins"], revalidate: 180 }
  );

  return getCachedAdmins(eventId);
};

export const addEventAdmin = async (eventId: string, userId: string) => {
  const count = await prisma.eventAdmin.count({
    where: { eventId },
  });

  if (count >= 3) {
    throw new Error("Maximum of 3 admins allowed per event");
  }

  const existing = await prisma.eventAdmin.findUnique({
    where: {
      eventId_userId: { eventId, userId },
    },
  });

  if (existing) {
    throw new Error("User is already an admin for this event");
  }

  await prisma.eventAdmin.create({
    data: { eventId, userId },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user && user.role === "USER") {
    await prisma.user.update({
      where: { id: userId },
      data: { role: "ADMIN" },
    });
  }
};

export const removeEventAdmin = async (eventId: string, userId: string) => {
  await prisma.eventAdmin.delete({
    where: {
      eventId_userId: { eventId, userId },
    },
  });

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  });

  if (user && user.role === "ADMIN") {
    const adminFor = await prisma.eventAdmin.count({
      where: { userId },
    });

    if (adminFor === 0) {
      await prisma.user.update({
        where: { id: userId },
        data: { role: "USER" },
      });
    }
  }
};

export { getAdminEvents, getEventParticipantsBySlug };
