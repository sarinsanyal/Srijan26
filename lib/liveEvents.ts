import fs from "fs/promises";
import path from "path";
import { unstable_cache, revalidateTag } from "next/cache";

const DATA_FILE = path.join(process.cwd(), "data", "liveEvents.json");

export interface LiveEvent {
    id: string;
    slug: string;
    name: string;
    round: string;
    location: string;
}

async function ensureFile() {
    try {
        await fs.access(DATA_FILE);
    } catch {
        await fs.writeFile(DATA_FILE, "[]", "utf-8");
    }
}

const _getLiveEvents = async (): Promise<LiveEvent[]> => {
    await ensureFile();
    const data = await fs.readFile(DATA_FILE, "utf-8");
    try {
        return JSON.parse(data);
    } catch {
        return [];
    }
}

export const getLiveEvents = unstable_cache(
    async () => _getLiveEvents(),
    ["live-events-cache"],
    { tags: ["live-events"], revalidate: 43200 } // 12 hours
);

export async function addLiveEvent(event: Omit<LiveEvent, "id">): Promise<LiveEvent> {
    const events = await getLiveEvents();
    const newEvent = { ...event, id: crypto.randomUUID() };
    events.push(newEvent);
    await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2), "utf-8");
    revalidateTag("live-events", {});
    return newEvent;
}

export async function removeLiveEvent(id: string): Promise<void> {
    const events = await getLiveEvents();
    const filtered = events.filter((e) => e.id !== id);
    await fs.writeFile(DATA_FILE, JSON.stringify(filtered, null, 2), "utf-8");
    revalidateTag("live-events", {});
}

export async function updateLiveEvent(event: LiveEvent): Promise<void> {
    const events = await getLiveEvents();
    const index = events.findIndex((e) => e.id === event.id);
    if (index !== -1) {
        events[index] = event;
        await fs.writeFile(DATA_FILE, JSON.stringify(events, null, 2), "utf-8");
        revalidateTag("live-events", {});
    }
}
