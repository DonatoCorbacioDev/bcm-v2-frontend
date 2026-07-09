import api from "@/lib/api";

export const calendarFeedService = {
  getUrl: async (): Promise<string> => {
    const res = await api.get<{ url: string }>("/users/me/calendar-feed");
    return res.data.url;
  },

  regenerate: async (): Promise<string> => {
    const res = await api.post<{ url: string }>("/users/me/calendar-feed/regenerate");
    return res.data.url;
  },
};
