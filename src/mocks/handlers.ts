import { http, HttpResponse } from "msw";

import { BASE_URL } from "../common-constants";
import type { Tree } from "../types/types";

const mockTreeData: Tree = {
  nodes: [
    {
      id: "97838643-4e9b-434f-8985-89dd23408647",
      type: "skill",
      name: "E",
    },
    {
      id: "1",
      type: "skill",
      name: "JavaScript",
    },
    {
      id: "2",
      type: "skill",
      name: "React",
    },
    {
      id: "3",
      type: "url",
      name: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    },
  ],
  links: [
    {
      id: "link-e-to-js",
      source: "97838643-4e9b-434f-8985-89dd23408647",
      target: "3",
    },
    {
      id: "1",
      source: "1",
      target: "3",
    },
    {
      id: "2",
      source: "3",
      target: "2",
    },
  ],
};

export const handlers = [
  http.get(`${BASE_URL}/tree`, () => {
    return HttpResponse.json(mockTreeData);
  }),
  http.get(`${BASE_URL}/paths/:startId/:targetId`, ({ params }) => {
    const startId = params.startId as string;
    const targetId = params.targetId as string;
    return HttpResponse.json({
      nodes: [
        { id: startId, type: "skill", name: "E" },
        {
          id: "3",
          type: "url",
          name: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
        },
        { id: targetId, type: "skill", name: "JavaScript" },
      ],
      links: [
        { id: "path-link-1", source: startId, target: "3" },
        { id: "path-link-2", source: "3", target: targetId },
      ],
    });
  }),
];
