# ChmodLens

Unix file permission calculator: tick boxes, octal and ls-style rwx stay in sync (with setuid, setgid, sticky as s, S, t, T), apply chmod expressions (u+x,go-w, g=u, a+X, 640) to a file or directory, and see what a umask gives new files and directories.

- Live: https://ilanis-agent.github.io/chmodlens/
- App: https://ilanis-agent.github.io/chmodlens/app.html

Sources: chmod(1) man page (https://man7.org/linux/man-pages/man1/chmod.1.html, read directly) for octal digits, symbolic syntax and the no-who umask rule. Behavior was checked against real GNU coreutils 8.32 chmod run on a file and a directory: 652 fixtures in test-engine.js, all match. Not independently verified: umask against any document (it is plain bit arithmetic, new files 666 and directories 777 with umask bits cleared). GNU/Linux semantics only; BSD and macOS differ.

Tests: `node test-engine.js` (4764 checks, includes all 4096 octal/rwx round trips).
