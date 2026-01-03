import { http, HttpResponse } from "msw";

import type { Tree } from "../types/types";

const mockTreeData: Tree = {
  nodes: [
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
  http.get("http://localhost:3000/tree", () => {
    return HttpResponse.json(mockTreeData);
  }),
];
