import { NextRequest, NextResponse } from "next/server";
import { revalidateTag } from "next/cache";
import {
    searchUsersByEmail,
    getEventAdmins,
    addEventAdmin,
    removeEventAdmin,
    getAdminEvents
} from "@/services/AdminService";
import { checkAdminAuthorization } from "@/services/AuthService";

export async function GET(req: NextRequest) {
    try {
        const user = await checkAdminAuthorization();
        if (user.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const action = searchParams.get("action");

        if (action === "searchUsers") {
            const query = searchParams.get("query") || "";
            const users = await searchUsersByEmail(query);
            return NextResponse.json(users);
        }

        if (action === "getEvents") {
            const events = await getAdminEvents(user.id, user.role);
            return NextResponse.json(events);
        }

        if (action === "getAdmins") {
            const eventId = searchParams.get("eventId");
            if (!eventId) return NextResponse.json({ error: "Event ID required" }, { status: 400 });
            const admins = await getEventAdmins(eventId);
            return NextResponse.json(admins);
        }

        return NextResponse.json({ error: "Invalid action" }, { status: 400 });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(req: NextRequest) {
    try {
        const user = await checkAdminAuthorization();
        if (user.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { eventId, userId } = await req.json();
        if (!eventId || !userId) {
            return NextResponse.json({ error: "Event ID and User ID required" }, { status: 400 });
        }

        await addEventAdmin(eventId, userId);
        revalidateTag("event-admins", {});
        revalidateTag("superadmin-users", {});
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        const user = await checkAdminAuthorization();
        if (user.role !== "SUPERADMIN") {
            return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
        }

        const { searchParams } = new URL(req.url);
        const eventId = searchParams.get("eventId");
        const userId = searchParams.get("userId");

        if (!eventId || !userId) {
            return NextResponse.json({ error: "Event ID and User ID required" }, { status: 400 });
        }

        await removeEventAdmin(eventId, userId);
        revalidateTag("event-admins", {});
        revalidateTag("superadmin-users", {});
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
