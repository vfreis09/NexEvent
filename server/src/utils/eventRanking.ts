export interface EventDetail {
  id: number;
  title: string;
  description: string;
  event_datetime: Date;
  tags: string[];
  score?: number;
}

export const rankEventsForUser = (
  events: EventDetail[],
  userTags: string[]
): EventDetail[] => {
  return events
    .map((event) => {
      const matchCount = event.tags.filter((tag) =>
        userTags.includes(tag)
      ).length;
      return { ...event, score: matchCount };
    })
    .sort((a, b) => {
      if ((b.score || 0) !== (a.score || 0)) {
        return (b.score || 0) - (a.score || 0);
      }
      return a.event_datetime.getTime() - b.event_datetime.getTime();
    });
};
