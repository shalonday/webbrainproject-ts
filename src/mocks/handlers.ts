import { http, HttpResponse } from "msw";

import { BASE_URL } from "../common-constants";
import type { Tree } from "../types/types";

const mockTreeData: Tree = {
  nodes: [
    // Path nodes from /paths response
    {
      name: "E",
      uuid: "97838643-4e9b-434f-8985-89dd23408647",
      type: "skill",
    },
    {
      name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Dealing_with_files",
      uuid: "b503afe3-90d8-45ee-86f5-469cbe4dc929",
      type: "url",
    },
    {
      name: "organize and manage files for a website project",
      uuid: "3833d421-503f-44cb-9b0c-99abd14ecaaa",
      type: "skill",
    },
    {
      name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax",
      uuid: "f53d3dc6-559c-492a-b119-9e85dd56554a",
      type: "url",
    },
    {
      name: "create a basic structured HTML document with elements and attributes in the correct places",
      uuid: "ba259474-a921-4097-aced-ed2a83753856",
      type: "skill",
    },
    {
      name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Headings_and_paragraphs",
      uuid: "07fbc5eb-c75c-470b-9d09-9e1fa2563805",
      type: "url",
    },
    {
      name: "structure text content using HTML headings and paragraphs",
      uuid: "0a19e747-2c1d-4ace-98d5-cd56b03d0b5f",
      type: "skill",
    },
    {
      name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Emphasis_and_importance",
      uuid: "86d8d67c-3a1d-4d11-96d0-3c6808b07859",
      type: "url",
    },
    {
      name: "use HTML elements to emphasize or strongly highlight text content appropriately",
      uuid: "2dc82ba3-eff3-40dc-bc67-d30ef425ee4e",
      type: "skill",
    },
    {
      name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Lists",
      uuid: "ef260eb7-bb88-4560-b9a6-5b0a53e4274f",
      type: "url",
    },
    {
      name: "create unordered, ordered, and description lists in HTML",
      uuid: "2440544e-2701-433e-a165-94fd9282a08e",
      type: "skill",
    },
    {
      name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Structuring_documents",
      uuid: "495a3b8e-e84d-40d1-8513-6ecb336a048e",
      type: "url",
    },
    {
      name: "outline the main structural sections of a web page (header, nav, main, etc.) and mark them up in HTML",
      uuid: "0f361945-ef5e-4923-92bd-ea8b7e0c38b1",
      type: "skill",
    },
    {
      name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_is_JavaScript",
      uuid: "3a9dc498-a2ba-4635-a051-c32c73276c77",
      type: "url",
    },
    {
      name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/What_is_CSS",
      uuid: "cf0467dc-30b2-4306-89f2-69ef1cd52dcb",
      type: "url",
    },
    {
      name: "describe what CSS is and how browsers apply CSS to HTML to style a page",
      uuid: "c5e938d5-1c5e-4e0c-a269-cb87aaa88625",
      type: "skill",
    },
    {
      name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Getting_started_with_CSS",
      uuid: "7c3833e9-0f56-46f2-994b-9e82f8ca9f8a",
      type: "url",
    },
    {
      name: "write a basic CSS stylesheet and link it to an HTML document",
      uuid: "57ca0856-5805-44ac-a732-9fc266ec909d",
      type: "skill",
    },
    {
      name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Advanced_text_features",
      uuid: "c4997c22-2f60-4330-8e6d-df37c1e3ddf3",
      type: "url",
    },
    {
      name: "use less common HTML text elements (quotes, code samples, subscript, etc.) for proper semantics",
      uuid: "4bc4cb00-4182-4415-ade3-010058327636",
      type: "skill",
    },
    {
      name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links",
      uuid: "f4a83976-e979-46a6-857c-c5c456d1a17a",
      type: "url",
    },
    {
      name: "create hyperlinks in an HTML page using the <a> element and follow best practices for links",
      uuid: "76c0d4aa-26c9-4e0b-aeb4-e4e938f2ae23",
      type: "skill",
    },
    {
      name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Installing_software",
      uuid: "7c81ca97-a289-4dcb-90c0-b10c187a79f6",
      type: "url",
    },
    {
      name: "set up a basic web development environment (install a code editor and modern web browsers)",
      uuid: "0b5f9854-f2d2-42b5-9b40-8f4b6af84031",
      type: "skill",
    },
    // Filler nodes with random IDs and names
    {
      uuid: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      type: "skill",
      name: "Advanced JavaScript Concepts",
    },
    {
      uuid: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      type: "skill",
      name: "React Fundamentals",
    },
    {
      uuid: "c3d4e5f6-a7b8-9012-cdef-123456789012",
      type: "url",
      name: "https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide",
    },
    {
      uuid: "d4e5f6a7-b8c9-0123-def1-234567890123",
      type: "skill",
      name: "DOM Manipulation",
    },
    {
      uuid: "e5f6a7b8-c9d0-1234-ef12-345678901234",
      type: "url",
      name: "https://example.com/python-basics",
    },
    {
      uuid: "f6a7b8c9-d0e1-2345-f123-456789012345",
      type: "skill",
      name: "Python Fundamentals",
    },
    {
      uuid: "a7b8c9d0-e1f2-3456-1234-567890123456",
      type: "url",
      name: "https://example.com/git-tutorial",
    },
    {
      uuid: "b8c9d0e1-f2a3-4567-2345-678901234567",
      type: "skill",
      name: "Version Control with Git",
    },
  ],
  links: [
    // Path links from /paths response
    {
      uuid: "d9ce722d-3ad3-487f-8ae0-469a2ddbd7be",
      source: "97838643-4e9b-434f-8985-89dd23408647",
      target: "b503afe3-90d8-45ee-86f5-469cbe4dc929",
    },
    {
      uuid: "93612174-3061-4bdb-8302-149befe102e4",
      source: "b503afe3-90d8-45ee-86f5-469cbe4dc929",
      target: "3833d421-503f-44cb-9b0c-99abd14ecaaa",
    },
    {
      uuid: "00c5bddc-b470-40fb-bd96-f5f6c68440db",
      source: "3833d421-503f-44cb-9b0c-99abd14ecaaa",
      target: "f53d3dc6-559c-492a-b119-9e85dd56554a",
    },
    {
      uuid: "f2abadb1-9e7e-4188-b699-bf1e68026837",
      source: "f53d3dc6-559c-492a-b119-9e85dd56554a",
      target: "ba259474-a921-4097-aced-ed2a83753856",
    },
    {
      uuid: "f6109abc-1426-49ce-972c-e1b49feca199",
      source: "ba259474-a921-4097-aced-ed2a83753856",
      target: "07fbc5eb-c75c-470b-9d09-9e1fa2563805",
    },
    {
      uuid: "cfccb2ec-fcbf-4fd7-8d08-307ca92eb237",
      source: "07fbc5eb-c75c-470b-9d09-9e1fa2563805",
      target: "0a19e747-2c1d-4ace-98d5-cd56b03d0b5f",
    },
    {
      uuid: "eef543b5-c096-4c43-930a-663cd8fd589b",
      source: "0a19e747-2c1d-4ace-98d5-cd56b03d0b5f",
      target: "86d8d67c-3a1d-4d11-96d0-3c6808b07859",
    },
    {
      uuid: "f0f1e3fc-5122-45a1-bdee-36b5a95b0b4b",
      source: "86d8d67c-3a1d-4d11-96d0-3c6808b07859",
      target: "2dc82ba3-eff3-40dc-bc67-d30ef425ee4e",
    },
    {
      uuid: "319ff863-4851-46ff-9d3e-d8f394f76a19",
      source: "2dc82ba3-eff3-40dc-bc67-d30ef425ee4e",
      target: "ef260eb7-bb88-4560-b9a6-5b0a53e4274f",
    },
    {
      uuid: "dc6adbfa-87f9-4631-abf4-e7bfb6dc3b1a",
      source: "ef260eb7-bb88-4560-b9a6-5b0a53e4274f",
      target: "2440544e-2701-433e-a165-94fd9282a08e",
    },
    {
      uuid: "8092322f-7821-4894-8ed0-44992d5a75fb",
      source: "2440544e-2701-433e-a165-94fd9282a08e",
      target: "495a3b8e-e84d-40d1-8513-6ecb336a048e",
    },
    {
      uuid: "bfa09196-7195-479a-abc1-6d73a302129c",
      source: "495a3b8e-e84d-40d1-8513-6ecb336a048e",
      target: "0f361945-ef5e-4923-92bd-ea8b7e0c38b1",
    },
    {
      uuid: "541bf633-e721-436c-bf3d-89529b332203",
      source: "0f361945-ef5e-4923-92bd-ea8b7e0c38b1",
      target: "3a9dc498-a2ba-4635-a051-c32c73276c77",
    },
    {
      uuid: "657643fd-5bb5-4db5-9b5a-4e47d61f2ad5",
      source: "0f361945-ef5e-4923-92bd-ea8b7e0c38b1",
      target: "cf0467dc-30b2-4306-89f2-69ef1cd52dcb",
    },
    {
      uuid: "d9315556-bb85-43d4-8bb1-9c8a8f60cd97",
      source: "cf0467dc-30b2-4306-89f2-69ef1cd52dcb",
      target: "c5e938d5-1c5e-4e0c-a269-cb87aaa88625",
    },
    {
      uuid: "4b303b6e-0436-4cae-a06b-02fab5aeac27",
      source: "c5e938d5-1c5e-4e0c-a269-cb87aaa88625",
      target: "7c3833e9-0f56-46f2-994b-9e82f8ca9f8a",
    },
    {
      uuid: "88312b1a-f351-43bd-b956-aca80dbce085",
      source: "7c3833e9-0f56-46f2-994b-9e82f8ca9f8a",
      target: "57ca0856-5805-44ac-a732-9fc266ec909d",
    },
    {
      uuid: "c964077e-5ca2-4d2a-92fd-883c2d7b732f",
      source: "57ca0856-5805-44ac-a732-9fc266ec909d",
      target: "3a9dc498-a2ba-4635-a051-c32c73276c77",
    },
    {
      uuid: "482ef236-6dee-46af-ab1d-6f9529e508ed",
      source: "0f361945-ef5e-4923-92bd-ea8b7e0c38b1",
      target: "c4997c22-2f60-4330-8e6d-df37c1e3ddf3",
    },
    {
      uuid: "35122507-d1b2-4e0d-9efe-4ef8344d77b5",
      source: "c4997c22-2f60-4330-8e6d-df37c1e3ddf3",
      target: "4bc4cb00-4182-4415-ade3-010058327636",
    },
    {
      uuid: "604a8652-8def-4ce1-8e7c-6385f83d6a8b",
      source: "4bc4cb00-4182-4415-ade3-010058327636",
      target: "f4a83976-e979-46a6-857c-c5c456d1a17a",
    },
    {
      uuid: "b5e2fd7d-4de8-449b-bd02-3b023bf1ee7c",
      source: "f4a83976-e979-46a6-857c-c5c456d1a17a",
      target: "76c0d4aa-26c9-4e0b-aeb4-e4e938f2ae23",
    },
    {
      uuid: "67966f71-7f30-4504-90d1-f03696d91b45",
      source: "76c0d4aa-26c9-4e0b-aeb4-e4e938f2ae23",
      target: "cf0467dc-30b2-4306-89f2-69ef1cd52dcb",
    },
    {
      uuid: "a85568e6-0e0f-4c13-8e8c-8fed001ddbfa",
      source: "97838643-4e9b-434f-8985-89dd23408647",
      target: "7c81ca97-a289-4dcb-90c0-b10c187a79f6",
    },
    {
      uuid: "e6729377-3a49-480c-8d55-7052b754f588",
      source: "7c81ca97-a289-4dcb-90c0-b10c187a79f6",
      target: "0b5f9854-f2d2-42b5-9b40-8f4b6af84031",
    },
    {
      uuid: "a8abf3af-72db-4c99-86c1-d69a06ee2534",
      source: "0b5f9854-f2d2-42b5-9b40-8f4b6af84031",
      target: "f53d3dc6-559c-492a-b119-9e85dd56554a",
    },
    // Filler links
    {
      uuid: "f1a2b3c4-d5e6-7890-1234-abcdef123456",
      source: "97838643-4e9b-434f-8985-89dd23408647",
      target: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
    },
    {
      uuid: "f2a3b4c5-d6e7-8901-2345-bcdef1234567",
      source: "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
      target: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
    },
    {
      uuid: "f3a4b5c6-d7e8-9012-3456-cdef12345678",
      source: "b2c3d4e5-f6a7-8901-bcde-f12345678901",
      target: "c3d4e5f6-a7b8-9012-cdef-123456789012",
    },
    {
      uuid: "f4a5b6c7-d8e9-0123-4567-def123456789",
      source: "c3d4e5f6-a7b8-9012-cdef-123456789012",
      target: "d4e5f6a7-b8c9-0123-def1-234567890123",
    },
    {
      uuid: "f5a6b7c8-d9e0-1234-5678-ef1234567890",
      source: "97838643-4e9b-434f-8985-89dd23408647",
      target: "e5f6a7b8-c9d0-1234-ef12-345678901234",
    },
    {
      uuid: "f6a7b8c9-d0e1-2345-6789-f12345678901",
      source: "e5f6a7b8-c9d0-1234-ef12-345678901234",
      target: "f6a7b8c9-d0e1-2345-f123-456789012345",
    },
    {
      uuid: "f7a8b9c0-d1e2-3456-7890-123456789012",
      source: "f6a7b8c9-d0e1-2345-f123-456789012345",
      target: "a7b8c9d0-e1f2-3456-1234-567890123456",
    },
    {
      uuid: "f8a9b0c1-d2e3-4567-8901-234567890123",
      source: "a7b8c9d0-e1f2-3456-1234-567890123456",
      target: "b8c9d0e1-f2a3-4567-2345-678901234567",
    },
  ],
};

/**
 *
 */
const chatbotHandlers = (baseUrl: string) => [
  http.post(`${baseUrl}/chatbot/chat`, async ({ request }) => {
    const body = (await request.json()) as {
      message: string;
      sessionId?: string;
    };

    return HttpResponse.json({
      message: `You asked about: ${body.message}. Here are some learning resources.`,
      relatedMaterials: [
        {
          nodeId: "550e8400-e29b-41d4-a716-446655440000",
          name: "JavaScript Basics",
          type: "url",
        },
        {
          nodeId: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
          name: "MDN JavaScript Tutorial",
          type: "url",
        },
      ],
      suggestedActions: ["Learn more", "Request new materials"],
    });
  }),
  http.post(`${baseUrl}/chatbot/search`, () => {
    return HttpResponse.json({
      results: [
        {
          node: {
            uuid: "550e8400-e29b-41d4-a716-446655440000",
            name: "JavaScript Basics",
          },
          similarity: 0.95,
        },
        {
          node: {
            uuid: "6ba7b810-9dad-11d1-80b4-00c04fd430c8",
            name: "MDN JavaScript Tutorial",
          },
          similarity: 0.87,
        },
      ],
    });
  }),
  http.post(`${baseUrl}/chatbot/material-request`, () => {
    return HttpResponse.json({ success: true });
  }),
];

export const handlers = [
  http.get(`${BASE_URL}/tree`, () => {
    return HttpResponse.json(mockTreeData);
  }),
  http.get(`${BASE_URL}/paths/:startId/:targetId`, ({ params }) => {
    const startId = params.startId as string;
    const targetId = params.targetId as string;
    // Returns a path with two branches that merge at URL4
    // Branch 1: E -> URL1 -> Skill A -> URL2 -> Skill B
    // Branch 2: E -> URL4 -> Skill C -> URL3 -> Skill D
    // Then both branches converge at final node (URL4 requires both Skill B and Skill D)
    return HttpResponse.json({
      nodes: [
        {
          name: "E",
          uuid: startId, //"97838643-4e9b-434f-8985-89dd23408647" in real data
          type: "skill",
        },
        {
          name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Dealing_with_files",
          uuid: "b503afe3-90d8-45ee-86f5-469cbe4dc929",
          type: "url",
        },
        {
          name: "organize and manage files for a website project",
          uuid: "3833d421-503f-44cb-9b0c-99abd14ecaaa",
          type: "skill",
        },
        {
          name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Basic_HTML_syntax",
          uuid: "f53d3dc6-559c-492a-b119-9e85dd56554a",
          type: "url",
        },
        {
          name: "create a basic structured HTML document with elements and attributes in the correct places",
          uuid: "ba259474-a921-4097-aced-ed2a83753856",
          type: "skill",
        },
        {
          name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Headings_and_paragraphs",
          uuid: "07fbc5eb-c75c-470b-9d09-9e1fa2563805",
          type: "url",
        },
        {
          name: "structure text content using HTML headings and paragraphs",
          uuid: "0a19e747-2c1d-4ace-98d5-cd56b03d0b5f",
          type: "skill",
        },
        {
          name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Emphasis_and_importance",
          uuid: "86d8d67c-3a1d-4d11-96d0-3c6808b07859",
          type: "url",
        },
        {
          name: "use HTML elements to emphasize or strongly highlight text content appropriately",
          uuid: "2dc82ba3-eff3-40dc-bc67-d30ef425ee4e",
          type: "skill",
        },
        {
          name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Lists",
          uuid: "ef260eb7-bb88-4560-b9a6-5b0a53e4274f",
          type: "url",
        },
        {
          name: "create unordered, ordered, and description lists in HTML",
          uuid: "2440544e-2701-433e-a165-94fd9282a08e",
          type: "skill",
        },
        {
          name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Structuring_documents",
          uuid: "495a3b8e-e84d-40d1-8513-6ecb336a048e",
          type: "url",
        },
        {
          name: "outline the main structural sections of a web page (header, nav, main, etc.) and mark them up in HTML",
          uuid: "0f361945-ef5e-4923-92bd-ea8b7e0c38b1",
          type: "skill",
        },
        {
          name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Scripting/What_is_JavaScript",
          uuid: targetId, //"3a9dc498-a2ba-4635-a051-c32c73276c77" in real data
          type: "url",
        },
        {
          name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/What_is_CSS",
          uuid: "cf0467dc-30b2-4306-89f2-69ef1cd52dcb",
          type: "url",
        },
        {
          name: "describe what CSS is and how browsers apply CSS to HTML to style a page",
          uuid: "c5e938d5-1c5e-4e0c-a269-cb87aaa88625",
          type: "skill",
        },
        {
          name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Styling_basics/Getting_started_with_CSS",
          uuid: "7c3833e9-0f56-46f2-994b-9e82f8ca9f8a",
          type: "url",
        },
        {
          name: "write a basic CSS stylesheet and link it to an HTML document",
          uuid: "57ca0856-5805-44ac-a732-9fc266ec909d",
          type: "skill",
        },
        {
          name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Advanced_text_features",
          uuid: "c4997c22-2f60-4330-8e6d-df37c1e3ddf3",
          type: "url",
        },
        {
          name: "use less common HTML text elements (quotes, code samples, subscript, etc.) for proper semantics",
          uuid: "4bc4cb00-4182-4415-ade3-010058327636",
          type: "skill",
        },
        {
          name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Core/Structuring_content/Creating_links",
          uuid: "f4a83976-e979-46a6-857c-c5c456d1a17a",
          type: "url",
        },
        {
          name: "create hyperlinks in an HTML page using the <a> element and follow best practices for links",
          uuid: "76c0d4aa-26c9-4e0b-aeb4-e4e938f2ae23",
          type: "skill",
        },
        {
          name: "https://developer.mozilla.org/en-US/docs/Learn_web_development/Getting_started/Environment_setup/Installing_software",
          uuid: "7c81ca97-a289-4dcb-90c0-b10c187a79f6",
          type: "url",
        },
        {
          name: "set up a basic web development environment (install a code editor and modern web browsers)",
          uuid: "0b5f9854-f2d2-42b5-9b40-8f4b6af84031",
          type: "skill",
        },
      ],
      links: [
        {
          uuid: "d9ce722d-3ad3-487f-8ae0-469a2ddbd7be",
          source: startId,
          target: "b503afe3-90d8-45ee-86f5-469cbe4dc929",
        },
        {
          uuid: "93612174-3061-4bdb-8302-149befe102e4",
          source: "b503afe3-90d8-45ee-86f5-469cbe4dc929",
          target: "3833d421-503f-44cb-9b0c-99abd14ecaaa",
        },
        {
          uuid: "00c5bddc-b470-40fb-bd96-f5f6c68440db",
          source: "3833d421-503f-44cb-9b0c-99abd14ecaaa",
          target: "f53d3dc6-559c-492a-b119-9e85dd56554a",
        },
        {
          uuid: "f2abadb1-9e7e-4188-b699-bf1e68026837",
          source: "f53d3dc6-559c-492a-b119-9e85dd56554a",
          target: "ba259474-a921-4097-aced-ed2a83753856",
        },
        {
          uuid: "f6109abc-1426-49ce-972c-e1b49feca199",
          source: "ba259474-a921-4097-aced-ed2a83753856",
          target: "07fbc5eb-c75c-470b-9d09-9e1fa2563805",
        },
        {
          uuid: "cfccb2ec-fcbf-4fd7-8d08-307ca92eb237",
          source: "07fbc5eb-c75c-470b-9d09-9e1fa2563805",
          target: "0a19e747-2c1d-4ace-98d5-cd56b03d0b5f",
        },
        {
          uuid: "eef543b5-c096-4c43-930a-663cd8fd589b",
          source: "0a19e747-2c1d-4ace-98d5-cd56b03d0b5f",
          target: "86d8d67c-3a1d-4d11-96d0-3c6808b07859",
        },
        {
          uuid: "f0f1e3fc-5122-45a1-bdee-36b5a95b0b4b",
          source: "86d8d67c-3a1d-4d11-96d0-3c6808b07859",
          target: "2dc82ba3-eff3-40dc-bc67-d30ef425ee4e",
        },
        {
          uuid: "319ff863-4851-46ff-9d3e-d8f394f76a19",
          source: "2dc82ba3-eff3-40dc-bc67-d30ef425ee4e",
          target: "ef260eb7-bb88-4560-b9a6-5b0a53e4274f",
        },
        {
          uuid: "dc6adbfa-87f9-4631-abf4-e7bfb6dc3b1a",
          source: "ef260eb7-bb88-4560-b9a6-5b0a53e4274f",
          target: "2440544e-2701-433e-a165-94fd9282a08e",
        },
        {
          uuid: "8092322f-7821-4894-8ed0-44992d5a75fb",
          source: "2440544e-2701-433e-a165-94fd9282a08e",
          target: "495a3b8e-e84d-40d1-8513-6ecb336a048e",
        },
        {
          uuid: "bfa09196-7195-479a-abc1-6d73a302129c",
          source: "495a3b8e-e84d-40d1-8513-6ecb336a048e",
          target: "0f361945-ef5e-4923-92bd-ea8b7e0c38b1",
        },
        {
          uuid: "541bf633-e721-436c-bf3d-89529b332203",
          source: "0f361945-ef5e-4923-92bd-ea8b7e0c38b1",
          target: "3a9dc498-a2ba-4635-a051-c32c73276c77",
        },
        {
          uuid: "657643fd-5bb5-4db5-9b5a-4e47d61f2ad5",
          source: "0f361945-ef5e-4923-92bd-ea8b7e0c38b1",
          target: "cf0467dc-30b2-4306-89f2-69ef1cd52dcb",
        },
        {
          uuid: "d9315556-bb85-43d4-8bb1-9c8a8f60cd97",
          source: "cf0467dc-30b2-4306-89f2-69ef1cd52dcb",
          target: "c5e938d5-1c5e-4e0c-a269-cb87aaa88625",
        },
        {
          uuid: "4b303b6e-0436-4cae-a06b-02fab5aeac27",
          source: "c5e938d5-1c5e-4e0c-a269-cb87aaa88625",
          target: "7c3833e9-0f56-46f2-994b-9e82f8ca9f8a",
        },
        {
          uuid: "88312b1a-f351-43bd-b956-aca80dbce085",
          source: "7c3833e9-0f56-46f2-994b-9e82f8ca9f8a",
          target: "57ca0856-5805-44ac-a732-9fc266ec909d",
        },
        {
          uuid: "c964077e-5ca2-4d2a-92fd-883c2d7b732f",
          source: "57ca0856-5805-44ac-a732-9fc266ec909d",
          target: "3a9dc498-a2ba-4635-a051-c32c73276c77",
        },
        {
          uuid: "482ef236-6dee-46af-ab1d-6f9529e508ed",
          source: "0f361945-ef5e-4923-92bd-ea8b7e0c38b1",
          target: "c4997c22-2f60-4330-8e6d-df37c1e3ddf3",
        },
        {
          uuid: "35122507-d1b2-4e0d-9efe-4ef8344d77b5",
          source: "c4997c22-2f60-4330-8e6d-df37c1e3ddf3",
          target: "4bc4cb00-4182-4415-ade3-010058327636",
        },
        {
          uuid: "604a8652-8def-4ce1-8e7c-6385f83d6a8b",
          source: "4bc4cb00-4182-4415-ade3-010058327636",
          target: "f4a83976-e979-46a6-857c-c5c456d1a17a",
        },
        {
          uuid: "b5e2fd7d-4de8-449b-bd02-3b023bf1ee7c",
          source: "f4a83976-e979-46a6-857c-c5c456d1a17a",
          target: "76c0d4aa-26c9-4e0b-aeb4-e4e938f2ae23",
        },
        {
          uuid: "67966f71-7f30-4504-90d1-f03696d91b45",
          source: "76c0d4aa-26c9-4e0b-aeb4-e4e938f2ae23",
          target: "cf0467dc-30b2-4306-89f2-69ef1cd52dcb",
        },
        {
          uuid: "a85568e6-0e0f-4c13-8e8c-8fed001ddbfa",
          source: "97838643-4e9b-434f-8985-89dd23408647",
          target: "7c81ca97-a289-4dcb-90c0-b10c187a79f6",
        },
        {
          uuid: "e6729377-3a49-480c-8d55-7052b754f588",
          source: "7c81ca97-a289-4dcb-90c0-b10c187a79f6",
          target: "0b5f9854-f2d2-42b5-9b40-8f4b6af84031",
        },
        {
          uuid: "a8abf3af-72db-4c99-86c1-d69a06ee2534",
          source: "0b5f9854-f2d2-42b5-9b40-8f4b6af84031",
          target: "f53d3dc6-559c-492a-b119-9e85dd56554a",
        },
      ],
    });
  }),
  ...chatbotHandlers(BASE_URL),
];
