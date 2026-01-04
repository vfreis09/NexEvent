import pool = require("../config/dbConfig");
import emailServices from "../utils/emailService";
import { rankEventsForUser, EventDetail } from "../utils/eventRanking";
import { PoolClient } from "pg";

interface UserBatchData {
  user_id: number;
  email: string;
  digest_frequency: "daily" | "weekly" | "never";
  queued_event_ids: number[];
}

const buildDigestHtml = (
  newEvents: EventDetail[],
  reminders: EventDetail[],
  interestedTags: string[]
): string => {
  const newEventsHtml =
    newEvents.length > 0
      ? `
        <h2 style="color: #2c3e50; border-bottom: 2px solid #eee; padding-bottom: 10px;">✨ Personalized for You</h2>
        <p style="color: #7f8c8d; font-size: 0.9em;">Based on your interests in: ${interestedTags.join(
          ", "
        )}</p>
        <table style="width: 100%; border-collapse: collapse;">
            ${newEvents
              .map((e) => {
                const matches = e.tags.filter((tag) =>
                  interestedTags.includes(tag)
                );
                return `
                <tr style="border-bottom: 1px solid #eee;">
                    <td style="padding: 15px 0;">
                        <strong style="font-size: 1.1em;"><a href="http://localhost:5173/event/${
                          e.id
                        }" style="color: #3498db; text-decoration: none;">${
                  e.title
                }</a></strong>
                        <br>
                        <small style="color: #e67e22;">📅 ${e.event_datetime.toLocaleDateString()} at ${e.event_datetime.toLocaleTimeString(
                  [],
                  { hour: "2-digit", minute: "2-digit" }
                )}</small>
                        ${
                          matches.length > 0
                            ? `<br><span style="background: #d4edda; color: #155724; font-size: 0.75em; padding: 2px 6px; border-radius: 4px;">Matched: ${matches.join(
                                ", "
                              )}</span>`
                            : ""
                        }
                        <p style="margin-top: 8px; color: #34495e; font-size: 0.95em; line-height: 1.4;">${e.description.substring(
                          0,
                          120
                        )}...</p>
                    </td>
                </tr>`;
              })
              .join("")}
        </table>`
      : "<p>No new events matching your interests this period.</p>";

  const remindersHtml =
    reminders.length > 0
      ? `
        <h2 style="color: #2c3e50; margin-top: 30px;">🔔 Your Upcoming Schedule</h2>
        <p style="color: #7f8c8d;">Don't forget these events you've joined:</p>
        <ul style="list-style: none; padding: 0;">
            ${reminders
              .map(
                (e) => `
                <li style="margin-bottom: 10px; padding: 10px; background: #f8f9fa; border-left: 4px solid #3498db;">
                    <strong><a href="http://localhost:5173/event/${
                      e.id
                    }" style="color: #2c3e50; text-decoration: none;">${
                  e.title
                }</a></strong>
                    <br><small style="color: #7f8c8d;">${e.event_datetime.toLocaleDateString()}</small>
                </li>`
              )
              .join("")}
        </ul>`
      : "";

  return `
    <html>
      <body style="font-family: sans-serif; padding: 20px; background-color: #f4f7f6;">
        <div style="max-width: 600px; margin: auto; background: white; padding: 30px; border-radius: 12px; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
            <h1 style="color: #2c3e50; text-align: center;">Your Event Digest</h1>
            ${newEventsHtml}
            ${remindersHtml}
            <div style="text-align: center; margin-top: 40px; border-top: 1px solid #eee; padding-top: 20px;">
                <a href="http://localhost:5173/settings" style="color: #3498db; font-size: 0.85em; text-decoration: none;">Manage Notifications</a>
            </div>
        </div>
      </body>
    </html>`;
};

export const processDigestQueue = async (
  frequency: "daily" | "weekly"
): Promise<void> => {
  let client: PoolClient | null = null;
  const now = new Date();

  try {
    client = (await (pool as any).connect()) as PoolClient;

    const getUsersQuery = `
      SELECT eq.user_id, u.email, u.digest_frequency, ARRAY_AGG(eq.event_id) AS queued_event_ids
      FROM email_queue eq
      JOIN users u ON eq.user_id = u.id
      WHERE eq.status = 'pending' AND u.digest_frequency = $1 
      GROUP BY eq.user_id, u.email, u.digest_frequency;`;

    const { rows: usersToProcess } = await client.query<UserBatchData>(
      getUsersQuery,
      [frequency]
    );

    console.log(`Processing ${usersToProcess.length} ${frequency} digests...`);

    for (const userData of usersToProcess) {
      const { user_id, email, queued_event_ids } = userData;

      try {
        const { rows: userTags } = await client.query<{ name: string }>(
          `SELECT t.name FROM tags t JOIN user_preferences up ON t.id = up.tag_id WHERE up.user_id = $1`,
          [user_id]
        );
        const interestedTags = userTags.map((t) => t.name);

        const queuedEventsQuery = `
          SELECT e.id, e.title, e.description, e.event_datetime,
                 COALESCE(ARRAY_AGG(t.name) FILTER (WHERE t.name IS NOT NULL), '{}') as tags
          FROM events e
          LEFT JOIN event_tags et ON e.id = et.event_id
          LEFT JOIN tags t ON et.tag_id = t.id
          WHERE e.id = ANY($1::int[]) AND e.event_datetime > NOW() 
          GROUP BY e.id;`;

        const { rows: eventsWithDetails } = await client.query<EventDetail>(
          queuedEventsQuery,
          [queued_event_ids]
        );

        const rankedEvents = rankEventsForUser(
          eventsWithDetails,
          interestedTags
        );
        const topPicks = rankedEvents.slice(0, 5);

        const { rows: reminders } = await client.query<EventDetail>(
          `SELECT e.id, e.title, e.description, e.event_datetime
           FROM events e JOIN rsvps r ON e.id = r.event_id
           WHERE r.user_id = $1 AND r.status = 'Accepted'
           AND e.event_datetime BETWEEN NOW() AND NOW() + interval '7 days'
           ORDER BY e.event_datetime ASC;`,
          [user_id]
        );

        for (const reminder of reminders) {
          const timeDiff = reminder.event_datetime.getTime() - now.getTime();
          const hoursRemaining = timeDiff / (1000 * 60 * 60);

          if (hoursRemaining > 0 && hoursRemaining < 24) {
            const urgentMsg = `Reminder: "${reminder.title}" starts in less than 24 hours!`;

            await client.query(
              `INSERT INTO notifications (user_id, event_id, message)
               SELECT $1, $2, $3
               WHERE NOT EXISTS (
                 SELECT 1 FROM notifications 
                 WHERE user_id = $1 AND event_id = $2 AND is_read = false AND message = $3
               )`,
              [user_id, reminder.id, urgentMsg]
            );
          }
        }

        const emailContent = buildDigestHtml(
          topPicks,
          reminders,
          interestedTags
        );
        await emailServices.sendEmail(
          email,
          `Your ${
            frequency.charAt(0).toUpperCase() + frequency.slice(1)
          } Event Digest - ${now.toLocaleDateString()}`,
          emailContent
        );

        await client.query(
          `DELETE FROM email_queue WHERE user_id = $1 AND event_id = ANY($2::int[])`,
          [user_id, queued_event_ids]
        );
      } catch (userError) {
        console.error(`Error processing user ${user_id}:`, userError);
      }
    }
  } catch (error) {
    console.error("Fatal processor error:", error);
  } finally {
    if (client) client.release();
  }
};
