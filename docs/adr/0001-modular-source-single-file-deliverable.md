# Modular TypeScript source, single-file HTML deliverable

The game design document asks for a game that works as a single HTML file with no install, which
would normally mean inline JavaScript. The software factory needs lint, typecheck and automated
tests on every change, which inline JavaScript cannot give. We keep both: the source is a Vite +
TypeScript project with ordinary modules and Vitest tests, and the build (vite-plugin-singlefile)
inlines everything, Tailwind CSS included, into one self-contained `index.html` with no runtime
network dependency. The player sees one file; the agents see a testable codebase.

## Considered options

- Inline JavaScript in one HTML file: faithful to the document, untestable and unlintable.
- A multi-file static site: testable, but a runtime dependency on a web server and several files.
