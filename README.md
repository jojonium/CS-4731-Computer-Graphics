# CS 4731: Computer Graphics

Coursework and projects for the undergraduate WPI computer science class CS
4731: Computer Graphics.

## Building

```
$ npm run build
```

The `npm run compile` script uses tsc to compile TypeScript in the `src/`
directory, and outputs it to the `build/` directory. `npm run bundle` uses
browserify to bundle this JavaScript and emits it in the `dist/` directory.
`npm run build` combines both of these into one script.
