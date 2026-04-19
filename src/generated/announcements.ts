import type { AnnouncementConfig } from "../types/config";

export const announcementOverrideConfigLoaded = true;
export const announcementOverrideConfig: AnnouncementConfig[] = [
  {
    "id": 2,
    "title": "Notice",
    "content": "new version release",
    "closable": true,
    "link": {
      "enable": false,
      "text": "",
      "url": "",
      "external": false
    },
    "pinned": true,
    "sortOrder": 0,
    "position": "top",
    "animationDelay": 50
  }
];
