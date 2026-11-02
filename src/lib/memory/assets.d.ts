// Vite imports a file's text with ?raw (the offline cities table)
declare module '*?raw' { const text: string; export default text; }
