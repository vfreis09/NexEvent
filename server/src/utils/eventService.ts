import moment from "moment";
const pool = require("../config/dbConfig");

export const updateEventStatus = async (eventId: number) => {
  try {
    const event = await pool.query(
      `SELECT status, max_attendees, 
              (SELECT COUNT(*) FROM rsvps WHERE event_id = $1) AS current_attendees, 
              event_datetime 
       FROM events 
       WHERE id = $1`,
      [eventId]
    );

    if (event.rows.length === 0) return;

    const { status, max_attendees, current_attendees, event_datetime } =
      event.rows[0];

    if (status === "canceled") return;

    let newStatus = "active";

    const now = moment();
    const eventTime = moment(event_datetime);

    if (now.isAfter(eventTime)) {
      newStatus = "expired";
    } else if (max_attendees !== null && current_attendees >= max_attendees) {
      newStatus = "full";
    }

    await pool.query(`UPDATE events SET status = $1 WHERE id = $2`, [
      newStatus,
      eventId,
    ]);
  } catch (err) {
    console.error("Error updating event status:", err);
  }
};
