# Third-party notices

Luna's own code is distributed under the [MIT license](LICENSE). Upstream code, fonts, and installed
dependencies retain their respective licenses.

| Material               | Location and notice                                                                                  |
| ---------------------- | ---------------------------------------------------------------------------------------------------- |
| Sites Vite integration | [Source](scripts/vite/sites-vite-plugin.ts) and [MIT notice](scripts/vite/sites-vite-plugin.LICENSE) |
| Installed packages     | Exact resolutions in `pnpm-lock.yaml`; license files remain in installed package distributions       |
| Web fonts              | Requested through Google Fonts by `app/globals.css`; font binaries are not vendored here             |

Preserve upstream notices when modifying or redistributing the corresponding material. Unused shadcn
components, hooks, styles, and their corresponding vendor files were removed in 0.2.0.
