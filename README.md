# The Web Brain Project

The Web Brain Project (WBP) is a website focused on organizing educational content across the web along a graph data structure relating skills and online educational resources with each other.

## Description / Vision

Graphs (the data structure consisting of vertices and edges) can be used to arrange skills or concepts to show their "is prerequisite to" relationships with online educational resources. One can imagine course syllabuses being connected with each other depending on the prerequisites and objectives they have in common; instead of course syllabuses, WBP uses URLs to online learning resources. Represented like ASCII art, they can be related as follows: (One or more Skill(s))-[Is Prerequisite To]->(URL of Learning Material)-[That Teaches]->(One or more Skill(s)). Doing so may yield many benefits; a non-exhaustive list could be:

- Putting into context the rich library of educational content across the web that don't always make their prerequisites obvious, making them more accessible to learners, by creating pathways that they can follow from a skill that they have towards the one they want.
- Highlighting nodes that a learner has progressed through, and providing cues when they should be reviewed makes it easier to spot holes and to avoid what Salman Khan called "Swiss Cheese Learning" (see his book "The One World Schoolhouse").
- By attaching data to nodes, such as financial and time cost to URL nodes, and job availability and salaries to skill nodes, learners could make more informed decisions about the investment to reward ratio of working towards certain skills, and pick the skills they want accordingly.
- This project was initially inspired by video game skill trees and my hope is that it can eventually be used in a gamified learning platform.

## Usage (NOT YET COMPLETELY IMPLEMENTED)

Listed below are the steps we envision a user would take to use the site, once the MVP is finished:

- A learner, upon entering the site, is expected to:

1. Enter a keyword (e.g., "html") on the searchbox to search for skill nodes or module nodes
2. From the search results, pick a node that they would like to generate a learning path to
3. Clicking "Generate Path" isolates a path from the "E" node (the entry node representing no skills) towards the picked node.
4. User takes an initial skill check, so skills within the path that they already have will be highlighted.
5. User goes through the learning materials from the most advanced highlighted (i.e., already acquired) skill node towards the desired skill node.
6. Progress is saved locally in their browser.
