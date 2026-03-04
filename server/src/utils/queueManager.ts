import { pool } from "../config/dbConfig";
import { PoolClient } from "pg";

export const insertEventIntoQueue = async (
  eventId: number,
  authorId: number | undefined,
): Promise<void> => {
  let client: PoolClient | null = null;

  if (!authorId) {
    console.error(
      "Queue Manager: Cannot insert event without valid author ID.",
    );
    return;
  }

  try {
    client = (await (pool as any).connect()) as PoolClient;

    const usersToNotifyQuery = `
      SELECT DISTINCT u.id AS user_id
      FROM users u
      JOIN user_preferences up ON u.id = up.user_id
      JOIN event_tags et ON up.tag_id = et.tag_id
      JOIN events e ON et.event_id = e.id
      WHERE 
        et.event_id = $1 
        AND u.id != $2
        AND u.is_verified = TRUE
        AND u.wants_notifications = TRUE
        AND e.visibility = 'public';
  `;

    const { rows: users } = await client.query<{ user_id: number }>(
      usersToNotifyQuery,
      [eventId, authorId],
    );

    if (users.length === 0) {
      console.log(
        `Queue Manager: No users found to notify for event ${eventId}.`,
      );
      return;
    }

    console.log(
      `Queue Manager: Found ${users.length} users to notify for event ${eventId}. Starting insertions...`,
    );

    for (const user of users) {
      await client.query(
        `INSERT INTO email_queue (user_id, event_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, event_id, status) DO NOTHING`,
        [user.user_id, eventId],
      );
    }

    console.log(
      `Queue Manager: Successfully queued event ${eventId} for ${users.length} users.`,
    );
  } catch (error) {
    console.error(
      `Queue Manager: FATAL error inserting event ${eventId} into queue:`,
      error,
    );
  } finally {
    if (client) {
      client.release();
    }
  }
};
