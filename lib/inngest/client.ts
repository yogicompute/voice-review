import { Inngest } from "inngest";

export const inngest = new Inngest({ id: "voicereview" });

// Event payloads
export type ReviewCreatedEvent = {
  name: "review/created";
  data: {
    reviewId: string;
    businessId: string;
    audioUrl: string | null;
  };
};
